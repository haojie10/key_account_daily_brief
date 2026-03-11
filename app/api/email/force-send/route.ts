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

        // Send to provided 'to' address, or default recipients if none provided
        await sendBriefingEmail(briefing, to);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to send email:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
