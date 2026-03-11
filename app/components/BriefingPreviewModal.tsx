'use client';

import { useState } from 'react';
import { DailyBriefing } from '@/lib/services/generator';
import { BriefingCard } from './BriefingCard';
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface BriefingPreviewModalProps {
    briefing: DailyBriefing;
    onClose: () => void;
}

export function BriefingPreviewModal({ briefing, onClose }: BriefingPreviewModalProps) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSend = async () => {
        if (status === 'sending') return;
        setStatus('sending');
        try {
            const res = await fetch('/api/email/force-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefing }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send');
            }

            setStatus('success');
            // Auto close after success? Or just show success state.
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">简报预览</h2>
                        <p className="text-gray-500 text-sm mt-1">{briefing.date} • {briefing.items.length} 条资讯</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSend}
                            disabled={status === 'sending' || status === 'success'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-white
                                ${status === 'success' ? 'bg-green-600' :
                                    status === 'error' ? 'bg-red-600' :
                                        'bg-primary hover:bg-blue-800'
                                }
                                ${status === 'sending' ? 'opacity-70 cursor-wait' : ''}
                            `}
                        >
                            {status === 'idle' && <><Mail className="w-4 h-4" /> 发送邮件</>}
                            {status === 'sending' && <><Mail className="w-4 h-4 animate-pulse" /> 发送中...</>}
                            {status === 'success' && <><CheckCircle className="w-4 h-4" /> 发送成功</>}
                            {status === 'error' && <><AlertCircle className="w-4 h-4" /> 重试</>}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 bg-gray-50 flex-1">
                    {briefing.items.map((item, index) => (
                        <BriefingCard key={index} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
