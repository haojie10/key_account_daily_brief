'use client';

import { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BriefingPreviewModal } from './BriefingPreviewModal';
import { DailyBriefing } from '@/lib/services/generator';

export function ManualTrigger() {
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<DailyBriefing | null>(null);
    const router = useRouter();

    const handleTrigger = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Don't send email automatically for manual trigger (?email=false)
            const res = await fetch('/api/generate?email=false', { method: 'POST' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.data) {
                setPreviewData(data.data);
            } else {
                alert('生成成功，但未返回数据。请检查 API。');
            }
        } catch (error: any) {
            console.error(error);
            alert(`生成失败: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleTrigger}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium shadow-sm transition-all
            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600 hover:shadow-md'}`}
            >
                {loading ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        正在生成...
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4" />
                        手动触发生成
                    </>
                )}
            </button>

            {previewData && (
                <BriefingPreviewModal
                    briefing={previewData}
                    onClose={() => setPreviewData(null)}
                />
            )}
        </>
    );
}
