import { NextRequest, NextResponse } from 'next/server';
import { getBriefing } from '@/lib/storage';
import { sendBriefingEmail } from '@/lib/services/email';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const briefing = await getBriefing(id);

        if (!briefing) {
            return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
        }

        if (briefing.items.length === 0) {
            return NextResponse.json({ error: 'No items in briefing to send' }, { status: 400 });
        }

        // Send to verified test email
        await sendBriefingEmail(briefing, 'haojie10@gmail.com');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
