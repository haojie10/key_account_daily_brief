import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/generator';
import { sendBriefingEmail } from '@/lib/services/email';
import { saveBriefing } from '@/lib/storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const authHeader = req.headers.get('authorization');

    // 验证 Cron Secret（如果已配置）
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log(`[Cron] Job started at ${new Date().toISOString()}`);

        const briefing = await generateDailyBriefing();
        const genElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron] Briefing generated in ${genElapsed}s, items: ${briefing.items.length}`);

        // 保存简报数据
        await saveBriefing(briefing);

        // 发送邮件（使用 RECIPIENTS 列表，无需传入 to 参数）
        if (briefing.items.length > 0) {
            await sendBriefingEmail(briefing);
            const emailElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[Cron] Email sent in ${emailElapsed}s total`);
        } else {
            console.log('[Cron] No items generated, skipping email.');
        }

        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron] Job completed in ${totalElapsed}s`);
        return NextResponse.json({ success: true, count: briefing.items.length, date: briefing.date, elapsed: `${totalElapsed}s` });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[Cron] Job failed after ${elapsed}s:`, message);
        return NextResponse.json({ success: false, error: message, elapsed: `${elapsed}s` }, { status: 500 });
    }
}
