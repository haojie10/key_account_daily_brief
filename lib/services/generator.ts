import { searchRetailers, scrapeContent, SearchResult } from './search';
import { selectTopStories, generateBriefingItem, BriefingItem } from './deepseek';
import { getSearchConfigForDate } from '../config/retailers';

/**
 * 基于标题关键词相似度去重
 * 提取标题中的有意义词汇（≥3字符），如果两条新闻关键词重叠超过 50% 则视为雷同
 */
function deduplicateByTitle(items: BriefingItem[]): BriefingItem[] {
    const extractKeywords = (title: string): Set<string> => {
        // 移除标点、转小写，提取长度 ≥ 3 的词
        const words = title
            .toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 3);
        return new Set(words);
    };

    const overlapRatio = (a: Set<string>, b: Set<string>): number => {
        if (a.size === 0 || b.size === 0) return 0;
        let overlap = 0;
        for (const word of a) {
            if (b.has(word)) overlap++;
        }
        return overlap / Math.min(a.size, b.size);
    };

    const result: BriefingItem[] = [];
    const keywordSets: Set<string>[] = [];

    for (const item of items) {
        const keywords = extractKeywords(item.title);
        const isDuplicate = keywordSets.some(existing => overlapRatio(existing, keywords) > 0.5);

        if (!isDuplicate) {
            result.push(item);
            keywordSets.push(keywords);
        }
    }

    return result;
}

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

    // 选取 10 条最有价值的新闻
    const topSelected = await selectTopStories(allNews, 10, config.priorityRetailers);
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
    const rawItems = settled
        .filter((r): r is PromiseFulfilledResult<BriefingItem | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((i): i is BriefingItem => i !== null);

    // 代码级去重：基于标题关键词相似度，过滤雷同资讯
    const items = deduplicateByTitle(rawItems);
    if (rawItems.length !== items.length) {
        console.log(`[Generator] Dedup: removed ${rawItems.length - items.length} similar items.`);
    }

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
