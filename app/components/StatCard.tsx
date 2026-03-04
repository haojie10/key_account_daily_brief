import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <div className="p-2 bg-blue-50 rounded-lg text-primary">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {trend && <span className="text-xs text-green-600 font-medium">{trend}</span>}
            </div>
        </div>
    );
}
