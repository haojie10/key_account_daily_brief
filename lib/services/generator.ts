import { searchRetailers, scrapeContent, SearchResult } from './search';
import { selectTopStories, generateBriefingItem, BriefingItem } from './deepseek';
import { getSearchConfigForDate } from '../config/retailers';

export interface DailyBriefing {
    id: string; // date string
    date: string;
    items: BriefingItem[];
    stats: {
        totalScanned: number;
        generated: number;
    };
    htmlContent?: string; // For email/display
}

export async function generateDailyBriefing(): Promise<DailyBriefing> {
    const startTime = Date.now();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    console.log(`[Generator] Starting briefing generation for ${dateStr}...`);

    const config = getSearchConfigForDate(today);

    if (!config) {
        throw new Error('Weekend skip: No briefings generated on Saturdays and Sundays.');
    }

    console.log(`[Generator] Today's target regions: ${config.rotationRegions.join(', ')}`);
    console.log(`[Generator] Priority retailers: ${config.priorityRetailers.length > 0 ? config.priorityRetailers.join(', ') : 'None'}`);

    // 搜索当天轮换区域的零售商资讯
    const allNews = await searchRetailers(config.rotationRetailers, config.queryTimeframe);
    const searchElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Generator] Search complete in ${searchElapsed}s. Found ${allNews.length} news items.`);

    if (allNews.length === 0) {
        return {
            id: dateStr,
            date: dateStr,
            items: [],
            stats: { totalScanned: 0, generated: 0 }
        };
    }

    // NOTE: 将选取数从 10 减到 5，以大幅减少 DeepSeek 调用次数，避免 Vercel 60s 超时
    const topSelected = await selectTopStories(allNews, 5, config.priorityRetailers);
    const selectElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Generator] Selected ${topSelected.length} items in ${selectElapsed}s (priority first).`);

    // 全局超时保护：预留 10 秒给邮件发送
    const GLOBAL_TIMEOUT_MS = 50_000;

    // 并行抓取 & 生成摘要，使用 allSettled 防止单条失败拖垮整体
    const briefingPromises = topSelected.map(async ({ item, region }) => {
        // 如果已经接近超时，直接跳过抓取，用 snippet
        if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
            console.log(`[Generator] Timeout guard: skipping scrape for ${item.link}`);
            return generateBriefingItem(item, item.snippet, region);
        }

        let content = '';
        let finalImageUrl = item.imageUrl;

        const scrapeResult = await scrapeContent(item.link);
        content = scrapeResult.text;

        if (scrapeResult.ogImage) {
            finalImageUrl = scrapeResult.ogImage;
        }

        if (!content || content.length < 200) {
            console.log(`[Generator] Scrape failed/empty for ${item.link}, using snippet.`);
            content = item.snippet;
        }

        const generated = await generateBriefingItem(item, content, region);
        if (generated) {
            generated.imageUrl = finalImageUrl;
        }
        return generated;
    });

    const settled = await Promise.allSettled(briefingPromises);
    const items = settled
        .filter((r): r is PromiseFulfilledResult<BriefingItem | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((i): i is BriefingItem => i !== null);

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Generator] Generation complete in ${totalElapsed}s. ${items.length} valid items produced.`);

    return {
        id: dateStr,
        date: dateStr,
        items,
        stats: {
            totalScanned: allNews.length,
            generated: items.length
        }
    };
}
