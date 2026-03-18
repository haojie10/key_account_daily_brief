/**
 * 北京时间（UTC+8）工具函数
 * NOTE: Vercel 服务器默认运行在 UTC 时区，所有时间判断必须通过此模块统一转换到北京时间
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 获取当前北京时间的 Date 对象
 * NOTE: 返回的 Date 内部时间戳已偏移到北京时间，仅用于取 year/month/date/day 等字段，
 * 不应用于 Date.getTime() 比较
 */
export function getBeijingNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + BEIJING_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000);
}

/**
 * 获取当前北京时间的日期字符串，格式 YYYY-MM-DD
 */
export function getBeijingDateStr(): string {
  const bj = getBeijingNow();
  const year = bj.getFullYear();
  const month = String(bj.getMonth() + 1).padStart(2, '0');
  const day = String(bj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前北京时间的星期几 (0=周日, 1=周一, ..., 6=周六)
 */
export function getBeijingDayOfWeek(): number {
  return getBeijingNow().getDay();
}

/**
 * 获取当前北京时间的 ISO 格式字符串，用于日志输出
 */
export function getBeijingISOString(): string {
  const bj = getBeijingNow();
  return bj.toISOString().replace('Z', '+08:00');
}
