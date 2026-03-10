import * as cheerio from 'cheerio';

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  date?: string;
  source?: string;
}

/**
 * 解析 SerpAPI 返回的日期字符串，判断是否在指定天数内
 * 支持格式："X hours ago", "X days ago", "X weeks ago", "yesterday", 绝对日期等
 */
function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return true; // 没有日期信息则默认保留

  const lowerDate = dateStr.toLowerCase().trim();

  // "just now", "today", "X minutes ago", "X hours ago" — 一定在范围内
  if (/^(just now|today)$/i.test(lowerDate)) return true;
  if (/\d+\s*(hour|minute|min|second|sec)s?\s*ago/i.test(lowerDate)) return true;
  if (lowerDate === 'yesterday') return true;

  // "X days ago"
  const daysMatch = lowerDate.match(/(\d+)\s*days?\s*ago/i);
  if (daysMatch) return parseInt(daysMatch[1]) <= days;

  // "X weeks ago"
  const weeksMatch = lowerDate.match(/(\d+)\s*weeks?\s*ago/i);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7 <= days;

  // "X months ago", "X years ago" — 超出 7 天范围
  if (/\d+\s*(month|year)s?\s*ago/i.test(lowerDate)) return false;

  // 尝试解析为绝对日期（如 "Mar 5, 2026"）
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return parsed >= cutoff;
  }

  // 无法解析时默认保留
  return true;
}

export async function searchNews(query: string, location: string = 'us', timeframe: string = 'qdr:w'): Promise<SearchResult[]> {
  if (!SERPAPI_API_KEY) {
    console.warn('SERPAPI_API_KEY is not set. Returning empty array to prevent mock data.');
    return [];
  }

  try {
    // NOTE: google_news 引擎不支持 tbs 参数，时间过滤在代码层面完成
    const params = new URLSearchParams({
      engine: 'google_news',
      q: query,
      gl: location,
      api_key: SERPAPI_API_KEY
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

    if (!response.ok) {
      console.error(`SerpApi error: ${response.status} ${response.statusText}`);
      return [];
    }

    const result = await response.json();

    if (result.error) {
      console.error('SerpApi returned error:', result.error);
      return [];
    }

    if (!result.news_results) return [];

    return result.news_results.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
      imageUrl: item.thumbnail || item.thumbnail?.src,
      date: item.date,
      source: item.source?.name || item.source?.title || item.source_info?.name || (typeof item.source === 'string' ? item.source : '未知来源')
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

// 批量搜索零售商，带代码级日期过滤
export async function searchRetailers(retailers: string[], timeframe: string = 'qdr:w'): Promise<SearchResult[]> {
  const CHUNK_SIZE = 8;
  const chunks = [];
  for (let i = 0; i < retailers.length; i += CHUNK_SIZE) {
    chunks.push(retailers.slice(i, i + CHUNK_SIZE));
  }

  let allResults: SearchResult[] = [];

  for (const chunk of chunks) {
    const query = `${chunk.join(' OR ')} retail news`;
    const results = await searchNews(query, 'us', timeframe);
    allResults = [...allResults, ...results];

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 按 URL 去重
  const uniqueResults = Array.from(new Map(allResults.map(item => [item.link, item])).values());

  // 硬性日期过滤：只保留 7 天以内的新闻
  const recentResults = uniqueResults.filter(item => isWithinDays(item.date, 7));
  const filtered = uniqueResults.length - recentResults.length;
  if (filtered > 0) {
    console.log(`[Search] Date filter: removed ${filtered} items older than 7 days.`);
  }

  return recentResults;
}

export async function scrapeContent(url: string): Promise<{ text: string, ogImage?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { text: '' };

    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取 og:image
    let ogImage = $('meta[property="og:image"]').attr('content');
    if (!ogImage) {
      ogImage = $('meta[name="twitter:image"]').attr('content');
    }

    $('script, style, nav, footer, header, ads, .ads, .sidebar, iframe').remove();

    let content = $('article').text();
    if (content.length < 100) {
      content = $('main').text();
    }
    if (content.length < 100) {
      content = $('body').text();
    }

    const text = content.replace(/\s+/g, ' ').trim().slice(0, 10000);
    return { text, ogImage };
  } catch (error) {
    console.warn(`Error scraping ${url}:`, error);
    return { text: '' };
  }
}

