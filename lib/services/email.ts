import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { DailyBriefingEmail } from '../emails/DailyBriefingEmail';
import { DailyBriefing } from './generator';

/**
 * 使用 Gmail + Nodemailer 发送简报邮件
 * 需要在 .env.local 中配置：
 *   GMAIL_USER=your-gmail@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 * NOTE: Gmail 需要开启「应用专用密码」，不是 Gmail 登录密码
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// 收件人列表，后续可扩展到 10 个
const RECIPIENTS = [
    '838048181@qq.com',
];

export async function sendBriefingEmail(briefing: DailyBriefing, to?: string) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('[Email] GMAIL_USER 或 GMAIL_APP_PASSWORD 未配置，跳过发送。');
        return;
    }

    const recipients = to ? [to] : RECIPIENTS;

    try {
        // 使用 react-email 的 render 将 React 组件渲染为 HTML 字符串
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
