'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface SendEmailButtonProps {
    id: string;
}

export function SendEmailButton({ id }: SendEmailButtonProps) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSend = async () => {
        if (status === 'sending') return;
        setStatus('sending');
        try {
            const res = await fetch(`/api/briefings/${id}/send`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to send');
            setStatus('success');
            // Reset status after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
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
            {status === 'error' && <><AlertCircle className="w-4 h-4" /> 发送失败</>}
        </button>
    );
}
