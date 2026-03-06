import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { DailyBriefingEmail } from '../emails/DailyBriefingEmail';
import { DailyBriefing } from './generator';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// 收件人列表，后续可扩展到 10 个
const RECIPIENTS = [
    '838048181@qq.com',
    'sales@howstoday.com',
];

export async function sendBriefingEmail(briefing: DailyBriefing, to?: string) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('[Email] GMAIL_USER 或 GMAIL_APP_PASSWORD 未配置，跳过发送。');
        return;
    }

    const recipients = to ? [to] : RECIPIENTS;

    try {
        const emailHtml = await render(
            DailyBriefingEmail({ date: briefing.date, items: briefing.items })
        );

        const mailOptions = {
            from: `"HOWSTODAY 零售资讯" <${process.env.GMAIL_USER}>`,
            to: recipients.join(', '),
            subject: `[HOWSTODAY] 每日零售资讯简报 - ${briefing.date}`,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] 邮件已成功发送至 ${recipients.join(', ')}，MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Email] 邮件发送失败:', error);
        throw error;
    }
}
