import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';
import { BriefingItem } from '../services/deepseek';

interface DailyBriefingEmailProps {
    date: string;
    items: BriefingItem[];
}

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};

const preheader = {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#333333',
    padding: '0 24px',
    marginBottom: '24px',
};

const sectionHeader = {
    padding: '0 24px',
    marginTop: '32px',
};

const sectionEmojiTitle = {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#555555',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px 0',
};

const storyTitle = {
    fontSize: '22px',
    fontWeight: 'bold' as const,
    color: '#000000',
    margin: '0 0 16px 0',
    lineHeight: '1.3',
};

const imagePlaceholder = {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: '16px',
};

const textContent = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333333',
    margin: '0 0 16px 0',
};

const highlightTitle = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#000000',
    margin: '24px 0 8px 0',
};

const bulletList = {
    margin: '0 0 16px 0',
    paddingLeft: '20px',
};

const bulletItem = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333333',
    marginBottom: '8px',
};

const sourceLink = {
    color: '#0066cc',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    marginTop: '48px',
    textAlign: 'center' as const,
    padding: '0 24px',
};

export const DailyBriefingEmail = ({
    date,
    items,
}: DailyBriefingEmailProps) => {
    const euItems = items.filter((i) => i.region === 'EU');
    const usItems = items.filter((i) => i.region === 'US');
    const globalItems = items.filter((i) => i.region === 'GLOBAL');

    const renderStory = (item: BriefingItem, index: number, emoji: string, sectionName: string) => (
        <Section key={index} style={{ marginBottom: '40px' }}>
            <Section style={sectionHeader}>
                <Text style={sectionEmojiTitle}>##### {emoji} {sectionName}</Text>
                <Heading as="h1" style={storyTitle}>
                    {item.title}
                </Heading>
            </Section>

            <Hr style={{ borderColor: '#eaeaea', margin: '16px 0' }} />

            <Section style={{ padding: '0 24px' }}>
                {item.imageUrl && (
                    <Img
                        src={item.imageUrl}
                        alt="Article Image"
                        style={imagePlaceholder}
                    />
                )}

                <Text style={textContent}>
                    <strong>The Recap: </strong>
                    {item.recap || item.summary}
                </Text>

                {item.highlights && item.highlights.length > 0 && (
                    <>
                        <Text style={highlightTitle}>Highlights:</Text>
                        <ul style={bulletList}>
                            {item.highlights.map((hl, i) => (
                                <li key={i} style={bulletItem}>{hl}</li>
                            ))}
                        </ul>
                    </>
                )}

                {item.takeaways && (
                    <>
                        <Text style={highlightTitle}>Takeaways:</Text>
                        <Text style={textContent}>{item.takeaways}</Text>
                    </>
                )}

                <Text style={textContent}>
                    <Link href={item.url} style={sourceLink}>
                        → Read the full article here
                    </Link>
                    <span style={{ color: '#888', fontSize: '14px', marginLeft: '8px' }}>
                        ({item.source})
                    </span>
                </Text>
            </Section>
        </Section>
    );

    return (
        <Html>
            <Head />
            <Preview>HOWSTODAY 每日零售资讯简报 - {date}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={{ padding: '0 24px', marginBottom: '24px' }}>
                        <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>HOWSTODAY {date}</Text>
                        <Text style={preheader}>
                            **早安。** 这里是今日专属零售资讯简报，包含 {items.length} 个全球重要事件与洞察。
                        </Text>
                    </Section>

                    <Hr style={{ borderColor: '#eaeaea', margin: '20px 0' }} />

                    {euItems.length > 0 && euItems.map((item, i) => renderStory(item, i, '🇪🇺', '欧洲零售动向'))}
                    {usItems.length > 0 && usItems.map((item, i) => renderStory(item, i, '🇺🇸', '北美市场观察'))}
                    {globalItems.length > 0 && globalItems.map((item, i) => renderStory(item, i, '🌍', '全球趋势'))}

                    <Hr style={{ borderColor: '#eaeaea', margin: '20px 0' }} />

                    <Section style={footer}>
                        <Text>
                            © {new Date().getFullYear()} HOWSTODAY Import & Export Co., Ltd.
                        </Text>
                        <Text>
                            此邮件由 AI 自动生成，为您提供每日决策参考。
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default DailyBriefingEmail;
