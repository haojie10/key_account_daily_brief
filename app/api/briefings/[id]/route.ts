import { NextRequest, NextResponse } from 'next/server';
import { getBriefing } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // Upgrade for Next.js 15
    const briefing = await getBriefing(id);
    if (!briefing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(briefing);
}
