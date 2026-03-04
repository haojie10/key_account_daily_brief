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

export async function searchNews(query: string, location: string = 'us', timeframe: string = 'qdr:d'): Promise<SearchResult[]> {
  if (!SERPAPI_API_KEY) {
    console.warn('SERPAPI_API_KEY is not set. Returning MOCK data.');
    return getMockData(location);
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
      return getMockData(location); // Fallback on error
    }

    const result = await response.json();

    if (result.error) {
      console.error('SerpApi returned error:', result.error);
      return getMockData(location);
    }

    if (!result.news_results) return [];

    return result.news_results.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
      imageUrl: item.thumbnail?.src,
      date: item.date,
      source: item.source?.title
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return getMockData(location);
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

export async function scrapeContent(url: string): Promise<string> {
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

    if (!response.ok) return '';

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, ads, .ads, .sidebar, iframe').remove();

    let content = $('article').text();
    if (content.length < 100) {
      content = $('main').text();
    }
    if (content.length < 100) {
      content = $('body').text();
    }

    return content.replace(/\s+/g, ' ').trim().slice(0, 10000);
  } catch (error) {
    console.warn(`Error scraping ${url}:`, error);
    return '';
  }
}

function getMockData(location: string): SearchResult[] {
  return [
    {
      title: `[MOCK] Lidl's New Sustainability Push in ${location === 'gb' ? 'Europe' : 'Global'}`,
      link: 'https://example.com/lidl-news',
      snippet: 'Lidl announces major changes to its supply chain to reduce carbon footprint by 30%...',
      source: 'Retail Gazette',
      date: '1 hour ago',
      imageUrl: 'https://placehold.co/600x400?text=Lidl+News'
    },
    {
      title: `[MOCK] Walmart Q3 Earnings Beat Expectations`,
      link: 'https://example.com/walmart-news',
      snippet: 'Walmart reports 5% revenue growth driven by strong grocery sales and ecommerce...',
      source: 'CNBC',
      date: '2 hours ago',
      imageUrl: 'https://placehold.co/600x400?text=Walmart+Earnings'
    },
    {
      title: `[MOCK] Consumer Spending Trends in ${location}`,
      link: 'https://example.com/trends',
      snippet: 'New report shows consumers are shifting towards private label brands...',
      source: 'NielsenIQ',
      date: '5 hours ago'
    }
  ];
}
