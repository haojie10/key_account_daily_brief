import fs from 'fs';
import path from 'path';
import { DailyBriefing } from './services/generator';

// MOCK STORAGE
// In a real Vercel app, use @vercel/kv or a database.
// This in-memory store will be wiped when the serverless function spins down.
// For local dev, we can write to a file.

const DATA_FILE = path.join(process.cwd(), 'data', 'briefings.json');

// Ensure data dir exists
if (process.env.NODE_ENV === 'development') {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

let memoryCache: DailyBriefing[] = [];

// Load from file if dev
if (process.env.NODE_ENV === 'development' && fs.existsSync(DATA_FILE)) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        memoryCache = JSON.parse(data);
    } catch (e) {
        console.error("Failed to load local data", e);
    }
}

export async function saveBriefing(briefing: DailyBriefing) {
    memoryCache.unshift(briefing); // Add to top
    // Keep only last 30
    if (memoryCache.length > 30) memoryCache = memoryCache.slice(0, 30);

    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCache, null, 2));
    }
}

export async function getBriefings(): Promise<DailyBriefing[]> {
    return memoryCache;
}

export async function getBriefing(date: string): Promise<DailyBriefing | undefined> {
    return memoryCache.find(b => b.date === date);
}
