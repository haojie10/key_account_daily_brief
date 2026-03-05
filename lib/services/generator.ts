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

    console.log(`[Generator] Search complete. Found ${allNews.length} news items from regions: ${config.rotationRegions.join(', ')}`);

    if (allNews.length === 0) {
        return {
            id: dateStr,
            date: dateStr,
            items: [],
            stats: { totalScanned: 0, generated: 0 }
        };
    }

    // 2. 使用 LLM 筛选，遵循优先渠道置顶 & 渠道去重约束
    const topSelected = await selectTopStories(allNews, 10, config.priorityRetailers);
    console.log(`[Generator] Selected ${topSelected.length} items for processing (priority first).`);

    // 3. Parallel Scrape & Summarize
    const briefingPromises = topSelected.map(async ({ item, region }) => {
        let content = '';

        // Attempt scrape
        content = await scrapeContent(item.link);

        if (!content || content.length < 200) {
            console.log(`[Generator] Scrape failed/empty for ${item.link}, using snippet.`);
            content = item.snippet; // Fallback
        }

        return generateBriefingItem(item, content, region);
    });

    const rawItems = await Promise.all(briefingPromises);
    const items = rawItems.filter((i): i is BriefingItem => i !== null);

    console.log(`[Generator] Generation complete. ${items.length} valid items produced.`);

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
