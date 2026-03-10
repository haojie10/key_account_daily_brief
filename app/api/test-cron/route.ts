import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/generator';
import { sendBriefingEmail } from '@/lib/services/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * 手动测试入口 — 通过 URL 参数 ?secret=xxx 验证身份
 * 用法：/api/test-cron?secret=YOUR_CRON_SECRET
 * 加上 &send=true 会真正发送邮件，否则只生成不发送
 */
export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const shouldSend = searchParams.get('send') === 'true';

    // 通过 URL 参数验证
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Invalid secret. Use ?secret=YOUR_CRON_SECRET' }, { status: 401 });
    }

    try {
        console.log(`[TestCron] Manual test started at ${new Date().toISOString()}`);

        const briefing = await generateDailyBriefing();
        const genElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (shouldSend && briefing.items.length > 0) {
            await sendBriefingEmail(briefing);
            console.log(`[TestCron] Email sent.`);
        }

        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        return NextResponse.json({
            success: true,
            count: briefing.items.length,
            date: briefing.date,
            elapsed: `${totalElapsed}s`,
            genElapsed: `${genElapsed}s`,
            emailSent: shouldSend && briefing.items.length > 0,
            stats: briefing.stats,
            // 返回前 3 条的标题，便于快速确认内容质量
            preview: briefing.items.slice(0, 3).map(i => ({
                title: i.title,
                source: i.source,
                region: i.region,
                url: i.url,
            }))
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        return NextResponse.json({ success: false, error: message, elapsed: `${elapsed}s` }, { status: 500 });
    }
}
