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
    count: number
): Promise<{ item: SearchResult; region: 'EU' | 'US' | 'GLOBAL' }[]> {
    try {
        const prompt = `
你是一个专业的零售行业分析师。请从以下新闻列表中，挑选出 ${count} 条对"中国日用百货出口商"最有价值的新闻。
由于这些新闻来源混杂，你需要在挑选的同时，判断这条新闻主要发生的区域（EU代表欧洲，US代表北美，GLOBAL代表全球/其他地区）。
关注重点：超市渠道动向（如Lidl, Aldi, Walmart, Action等）、市场趋势、SKU 变化、消费者洞察。尽量兼顾大品牌和区域性特色超市。

请返回 JSON 格式的数组，每个对象包含 "index"（数字，列表中的序号）和 "region"（字符串，"EU", "US" 或 "GLOBAL"）。
例如：{"results": [{"index": 0, "region": "EU"}, {"index": 5, "region": "US"}]}

新闻列表：
${items.map((item, index) => `${index}. [${item.date || 'N/A'}] ${item.title} - ${item.source} (${item.snippet})`).join('\n')}
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content || "{}";
        let results: { index: number, region: 'EU' | 'US' | 'GLOBAL' }[] = [];
        try {
            const parsed = JSON.parse(content);
            results = parsed.results || Object.values(parsed)[0];
            if (!Array.isArray(results)) throw new Error("Not an array");
        } catch (e) {
            console.error('Failed to parse selected JSON', e);
        }

        const finalSelection: { item: SearchResult; region: 'EU' | 'US' | 'GLOBAL' }[] = [];
        for (const res of results) {
            const idx = res.index;
            if (typeof idx === 'number' && idx >= 0 && idx < items.length) {
                finalSelection.push({
                    item: items[idx],
                    region: ['EU', 'US', 'GLOBAL'].includes(res.region) ? res.region : 'GLOBAL'
                });
            }
        }

        return finalSelection.slice(0, count);
    } catch (error) {
        console.error(`Error selecting top stories:`, error);
        if (!process.env.DEEPSEEK_API_KEY) {
            // Mock selection
            return items.slice(0, count).map(item => ({ item, region: 'GLOBAL' }));
        }
        return items.slice(0, count).map(item => ({ item, region: 'GLOBAL' })); // Fallback
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
