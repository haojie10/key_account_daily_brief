import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { searchRetailers, searchNews } from './lib/services/search';
import { getSearchConfigForDate } from './lib/config/retailers';

async function main() {
    const config = getSearchConfigForDate(new Date('2026-03-10T09:50:05+08:00'));
    if (!config) {
        console.log('No config for today');
        return;
    }
    console.log('Retailers:', config.rotationRetailers);
    console.log('Priority:', config.priorityRetailers);

    // Try raw search first
    const raw = await searchNews(`${config.rotationRetailers.slice(0, 5).join(' OR ')} retail news`, 'us', 'qdr:w');
    console.log('Raw search sample matches:', raw.map(r => ({ title: r.title, date: r.date })));

    const results = await searchRetailers(config.rotationRetailers);
    console.log('Final SearchRetailers Found:', results.length);
}
main().catch(console.error);
