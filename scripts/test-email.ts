import { sendBriefingEmail } from '../lib/services/email';
import { DailyBriefing } from '../lib/services/generator';

async function test() {
    console.log('Testing Email service...');
    console.log('GMAIL_USER is set:', !!process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD is set:', !!process.env.GMAIL_APP_PASSWORD);

    // Mock briefing
    const mockBriefing: DailyBriefing = {
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        items: [
            {
                title: "Test Email from Nodemailer",
                url: "https://example.com",
                source: "System Test",
                summary: "This is a test summary",
                recap: "This is a test recap message to verify email structure.",
                highlights: ["Highlight 1: Emails are working", "Highlight 2: Formatting is great"],
                takeaways: "Takeaway: Nodemailer integration is successful.",
                tags: ["Test", "Nodemailer"],
                region: "GLOBAL"
            }
        ],
        stats: {
            totalScanned: 1,
            generated: 1
        }
    };

    try {
        await sendBriefingEmail(mockBriefing, 'sales@howstoday.com');
        console.log('Test completed: check your inbox!');
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
