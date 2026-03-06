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

export async function searchNews(query: string, location: string = 'us', timeframe: string = 'qdr:w'): Promise<SearchResult[]> {
  if (!SERPAPI_API_KEY) {
    console.warn('SERPAPI_API_KEY is not set. Returning empty array to prevent mock data.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_news',
      q: query,
      gl: location,
      tbs: timeframe, // 支持外部指定时间范围，如 'qdr:w' (1周)
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
      // Google News from SerpApi may place source in `source`(string), `source.title`, `source.name`, or `source_info.name`
      source: item.source?.name || item.source?.title || item.source_info?.name || (typeof item.source === 'string' ? item.source : '未知来源')
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

// 新增：批量搜索零售商
export async function searchRetailers(retailers: string[], timeframe: string = 'qdr:w'): Promise<SearchResult[]> {
  const CHUNK_SIZE = 5; // 每5个零售商一组，避免查询字符串过长
  const chunks = [];
  for (let i = 0; i < retailers.length; i += CHUNK_SIZE) {
    chunks.push(retailers.slice(i, i + CHUNK_SIZE));
  }

  let allResults: SearchResult[] = [];

  for (const chunk of chunks) {
    // 构建 OR 查询，例如："Walmart OR Target OR Costco retail news"
    const query = `${chunk.join(' OR ')} retail news`;
    const results = await searchNews(query, 'us', timeframe);
    allResults = [...allResults, ...results];

    // 适当休眠避免并发过高触发限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 简单按 URL 去重
  const uniqueResults = Array.from(new Map(allResults.map(item => [item.link, item])).values());
  return uniqueResults;
}

export async function scrapeContent(url: string): Promise<{ text: string, ogImage?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

