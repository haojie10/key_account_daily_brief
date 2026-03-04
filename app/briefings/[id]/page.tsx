import { getBriefing } from '@/lib/storage';
import { BriefingCard } from '@/app/components/BriefingCard';
import { SendEmailButton } from '@/app/components/SendEmailButton';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BriefingDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params; // Next.js 15: params is a promise
    const briefing = await getBriefing(id);

    if (!briefing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">简报未找到</h1>
                <Link href="/" className="text-primary hover:text-accent font-medium flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> 返回首页
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/" className="text-gray-500 hover:text-primary transition-colors flex items-center text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> 返回仪表板
                </Link>
            </div>

            <header className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">
                        {briefing.date} 零售资讯简报
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            发布于 {briefing.date}
                        </span>
                        <span className="flex items-center">
                            <Tag className="w-4 h-4 mr-1" />
                            包含 {briefing.items.length} 条精选资讯
                        </span>
                    </div>
                </div>
                <div className="bg-orange-50 text-accent px-4 py-2 rounded-lg font-bold text-lg hidden md:block">
                    HOWSTODAY
                </div>
                <div className="md:hidden">
                    <SendEmailButton id={briefing.id} />
                </div>
                <div className="hidden md:block">
                    <SendEmailButton id={briefing.id} />
                </div>
            </header>

            <div className="space-y-6">
                {briefing.items.map((item: import('@/lib/services/deepseek').BriefingItem, index: number) => (
                    <BriefingCard key={index} item={item} />
                ))}
            </div>
        </div>
    );
}
