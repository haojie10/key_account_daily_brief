import { NextResponse } from 'next/server';
import { getBriefings } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    const briefings = await getBriefings();
    return NextResponse.json(briefings);
}
