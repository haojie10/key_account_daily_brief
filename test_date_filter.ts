import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 模拟 isWithinDays 逻辑
function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false;

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

  return false;
}

const testDates = [
  "2 hours ago",
  "8 hours ago",
  "12 hours ago",
  "yesterday",
  "1 day ago",
  "6 days ago",
  "7 days ago",
  "8 days ago",
  "1 week ago",
  "2 weeks ago",
  "1 month ago",
  "2 months ago",
  "1 year ago",
  "Feb 20, 2025",
  "Mar 1, 2026",
  "Mar 11, 2026",
  "Mar 17, 2026",
  "2014-05-01",
  "May 2014",
  undefined,
  ""
];

console.log(`Current Date.now(): ${new Date().toISOString()}`);
console.log('Testing isWithinDays(date, 7):');
for (const d of testDates) {
  console.log(`"${d}" -> ${isWithinDays(d, 7)}`);
}
