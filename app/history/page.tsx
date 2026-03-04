import { getBriefings } from '@/lib/storage';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const briefings = await getBriefings();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">简报历史归档</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {briefings.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {briefings.map((briefing) => (
                            <div key={briefing.date} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-full text-primary">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {briefing.date} 零售资讯简报
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            包含 {briefing.items.length} 条资讯 • 扫描 {briefing.stats.totalScanned} 个来源
                                        </p>
                                    </div>
                                </div>
                                {/* We don't have a detail page implementation fully yet (just route), 
                            but we can link to a detail page if we implement it. 
                            For now, linking to root or specific page if implemented. 
                            User requirement: "Reserve Manual Trigger and History Record".
                            I'll link to a detail page placeholder or recycle page logic.
                            I implemented `app/api/briefings/[id]` but not `app/briefings/[id]/page.tsx`.
                            I should implement the detail page next.
                        */}
                                <span className="text-muted text-sm flex items-center">
                                    查看详情 <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        暂无历史记录
                    </div>
                )}
            </div>
        </div>
    );
}
