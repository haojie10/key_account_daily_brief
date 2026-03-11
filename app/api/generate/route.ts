import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/generator';
import { sendBriefingEmail } from '@/lib/services/email';
import { saveBriefing } from '@/lib/storage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const briefing = await generateDailyBriefing();

        // Save
        await saveBriefing(briefing);

        // Send Email (Optional, assume yes for now)
        // Maybe query param ?email=false
        const { searchParams } = new URL(req.url);
        if (searchParams.get('email') !== 'false' && briefing.items.length > 0) {
            await sendBriefingEmail(briefing);
        }

        return NextResponse.json({ success: true, data: briefing });
    } catch (error: any) {
        console.error('Manual generation failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
