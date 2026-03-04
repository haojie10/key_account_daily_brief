import { getBriefings } from '@/lib/storage';
import { BriefingCard } from '@/app/components/BriefingCard';
import { ManualTrigger } from '@/app/components/ManualTrigger';
import { StatCard } from '@/app/components/StatCard';
import { Globe, TrendingUp, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const briefings = await getBriefings();
  const latestBriefing = briefings[0]; // storage unshifts new ones to top

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">今日零售简报</h1>
          <p className="text-gray-500 mt-1">
            {latestBriefing ? `生成于 ${latestBriefing.date}` : '暂无今日数据，请点击生成'}
          </p>
        </div>
        <ManualTrigger />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="今日抓取来源"
          value={latestBriefing?.stats.totalScanned || 0}
          icon={Globe}
        />
        <StatCard
          label="生成资讯条目"
          value={latestBriefing?.items.length || 0}
          icon={TrendingUp}
          trend={latestBriefing ? "Status: Ready" : "Status: Waiting"}
        />
        <StatCard
          label="LLM 引擎"
          value="DeepSeek V3"
          icon={Zap}
          trend="Online"
        />
      </div>

      {/* Content Section */}
      {latestBriefing ? (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-primary border-l-4 border-accent pl-3">
            核心资讯聚合
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestBriefing.items.map((item: import('@/lib/services/deepseek').BriefingItem, index: number) => (
              <BriefingCard key={index} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">暂无简报数据，请点击右上方“手动触发生成”按钮。</p>
        </div>
      )}
    </div>
  );
}
