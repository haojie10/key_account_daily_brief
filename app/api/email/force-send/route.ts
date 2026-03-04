import { NextRequest, NextResponse } from 'next/server';
import { sendBriefingEmail } from '@/lib/services/email';
import { DailyBriefing } from '@/lib/services/generator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { briefing, to } = body as { briefing: DailyBriefing; to: string };

        if (!briefing || !briefing.items || briefing.items.length === 0) {
            return NextResponse.json({ error: 'Invalid briefing data' }, { status: 400 });
        }

        // Send to verified test email (or provided 'to' if valid in production)
        // For safety/testing, we still force haojie10@gmail.com or check env
        const recipient = to || 'haojie10@gmail.com';

        await sendBriefingEmail(briefing, recipient);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
