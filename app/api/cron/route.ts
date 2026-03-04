import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/generator';
import { sendBriefingEmail } from '@/lib/services/email';
import { saveBriefing } from '@/lib/storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    // 验证 Cron Secret（如果已配置）
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const briefing = await generateDailyBriefing();

        // 保存简报数据
        await saveBriefing(briefing);

        // 发送邮件（使用 RECIPIENTS 列表，无需传入 to 参数）
        if (briefing.items.length > 0) {
            await sendBriefingEmail(briefing);
        }

        return NextResponse.json({ success: true, count: briefing.items.length, date: briefing.date });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Cron job failed:', message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
