import OpenAI from 'openai';
import { SearchResult } from './search';

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'mock-key', // Fallback for build/mock mode
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

export interface BriefingItem {
    title: string;
    url: string;
    source: string;
    summary: string; // kept for legacy compatibility if needed
    recap: string;
    highlights: string[];
    takeaways: string;
    tags: string[];
    region: 'EU' | 'US' | 'GLOBAL';
    imageUrl?: string;
    originalDate?: string;
}

export async function selectTopStories(
    items: SearchResult[],
    count: number,
    priorityRetailers: string[] = []
): Promise<{ item: SearchResult; region: 'EU' | 'US' | 'GLOBAL' }[]> {
    try {
        // 构建优先渠道约束说明
        const priorityConstraint = priorityRetailers.length > 0
            ? `
**重要约束（必须严格遵守）**：
1. 以下是今日"优先关注渠道"：${priorityRetailers.join(', ')}。请确保每个优先渠道至少有 1 条新闻入选（最多 2 条），并且放在结果数组的最前面。
2. 其他渠道（非优先）每个最多只能选 1 条新闻。
3. 同一个零售渠道/品牌不得出现超过上述数量限制。
4. 结果排序：优先渠道的新闻排在最前面，之后是其他渠道的新闻。`
            : '';

        const prompt = `
你是一个专业的零售行业分析师。请从以下新闻列表中，挑选出最多 ${count} 条对"中国日用百货出口商"最有价值的新闻。
由于这些新闻来源混杂，你需要在挑选的同时，判断这条新闻主要发生的区域（EU代表欧洲，US代表北美，GLOBAL代表全球/其他地区）。
关注重点：超市渠道动向（如Lidl, Aldi, Walmart, Action等）、市场趋势、SKU 变化、消费者洞察。尽量兼顾大品牌和区域性特色超市。
${priorityConstraint}

请返回 JSON 格式，每个对象包含：
- "index"（数字，列表中的序号）
- "region"（字符串，"EU", "US" 或 "GLOBAL"）
- "retailer"（字符串，该新闻涉及的主要零售商/品牌名称）
优先渠道的新闻必须排在数组最前面。
例如：{"results": [{"index": 0, "region": "EU", "retailer": "B&M"}, {"index": 5, "region": "US", "retailer": "Walmart"}]}

新闻列表：
${items.map((item, index) => `${index}. [${item.date || 'N/A'}] ${item.title} - ${item.source} (${item.snippet})`).join('\n')}
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content || "{}";
        let results: { index: number; region: 'EU' | 'US' | 'GLOBAL'; retailer?: string }[] = [];
        try {
            const parsed = JSON.parse(content);
            results = parsed.results || Object.values(parsed)[0];
            if (!Array.isArray(results)) throw new Error("Not an array");
        } catch (e) {
            console.error('Failed to parse selected JSON', e);
        }

        // 后处理：严格按渠道去重并限制数量
        const prioritySet = new Set(priorityRetailers.map(r => r.toLowerCase()));
        const retailerCount: Record<string, number> = {};
        const priorityItems: { item: SearchResult; region: 'EU' | 'US' | 'GLOBAL' }[] = [];
        const regularItems: { item: SearchResult; region: 'EU' | 'US' | 'GLOBAL' }[] = [];

        for (const res of results) {
            const idx = res.index;
            if (typeof idx !== 'number' || idx < 0 || idx >= items.length) continue;

            const retailerName = (res.retailer || '').toLowerCase().trim();
            if (!retailerName) continue;

            const isPriority = prioritySet.has(retailerName);
            // 优先渠道最多 2 条，其他渠道最多 1 条
            const maxAllowed = isPriority ? 2 : 1;
            const currentCount = retailerCount[retailerName] || 0;
            if (currentCount >= maxAllowed) continue;

            retailerCount[retailerName] = currentCount + 1;
            const entry = {
                item: items[idx],
                region: (['EU', 'US', 'GLOBAL'].includes(res.region) ? res.region : 'GLOBAL') as 'EU' | 'US' | 'GLOBAL'
            };

            // 优先渠道放前面，其他放后面
            if (isPriority) {
                priorityItems.push(entry);
            } else {
                regularItems.push(entry);
            }
        }

        // 最终合并：优先渠道在前，其他渠道在后
        const finalSelection = [...priorityItems, ...regularItems];
        return finalSelection.slice(0, count);
    } catch (error) {
        console.error(`Error selecting top stories:`, error);
        return items.slice(0, count).map(item => ({ item, region: 'GLOBAL' as const }));
    }
}

export async function generateBriefingItem(
    item: SearchResult,
    content: string,
    region: 'EU' | 'US' | 'GLOBAL'
): Promise<BriefingItem | null> {
    if (!process.env.DEEPSEEK_API_KEY) {
        return {
            title: item.title,
            url: item.link,
            source: item.source || 'Mock Source',
            summary: "这是模拟的简报摘要内容。由于未配置 DeepSeek API Key，无法进行智能总结。在真实环境中，这里将会是根据新闻内容生成的专业中文摘要。",
            recap: "这是事件的核心概述。",
            highlights: ["模拟亮点一", "模拟亮点二"],
            takeaways: "这对出口商的启示是...",
            tags: ["模拟数据", "待配置", "零售"],
            region,
            imageUrl: item.imageUrl,
            originalDate: item.date
        };
    }

    try {
        const prompt = `
请作为这篇新闻的中文简报（针对出口贸易商）。
新闻标题：${item.title}
来源：${item.source}
原始内容：
${content.slice(0, 8000)}

要求：
1. 标题（title）：简练、吸引人，包含关键企业/品牌名。
2. Recap（recap）：100-150字，中文。概括核心事件。
3. Highlights（highlights）：提取 3-5 个关键数据或亮点，作为字符串数组返回。
4. Takeaways（takeaways）：50-100字，中文。对供应链、选品或出口商的启示。
5. 标签（tags）：提取 3-5 个关键标签（如：Lidl, 厨具, 德国市场）。
6. 如果内容与"日用百货/零售"完全无关，请将 isValid 设为 false。

输出 JSON 格式：
{
  "title": "...",
  "recap": "...",
  "highlights": ["...", "..."],
  "takeaways": "...",
  "tags": ["...", "..."],
  "isValid": true
}
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        if (!result.isValid) return null;

        return {
            title: result.title || item.title,
            url: item.link,
            source: item.source || 'Unknown',
            summary: result.recap || item.snippet,
            recap: result.recap || item.snippet,
            highlights: result.highlights || [],
            takeaways: result.takeaways || '',
            tags: result.tags || [],
            region,
            imageUrl: item.imageUrl,
            originalDate: item.date
        };
    } catch (error) {
        console.error(`Error summarizing item ${item.link}:`, error);
        // Return basic info if LLM fails
        return {
            title: item.title,
            url: item.link,
            source: item.source || 'Unknown',
            summary: item.snippet,
            recap: item.snippet,
            highlights: [],
            takeaways: '',
            tags: [],
            region,
            imageUrl: item.imageUrl,
            originalDate: item.date
        };
    }
}
