import { BriefingItem } from '@/lib/services/deepseek';
import { ExternalLink, Calendar, MapPin, Tag } from 'lucide-react';

export function BriefingCard({ item }: { item: BriefingItem }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2
                ${item.region === 'EU' ? 'bg-blue-100 text-blue-800' :
                            item.region === 'US' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'}`}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.region}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                            {item.title}
                        </a>
                    </h3>
                </div>
                {item.imageUrl && (
                    <img src={item.imageUrl} alt="Thumbnail" className="w-20 h-20 object-cover rounded-lg ml-4 bg-gray-100" />
                )}
            </div>

            <div className="text-gray-600 text-sm mb-4 leading-relaxed space-y-3">
                <p><strong>The Recap:</strong> {item.recap || item.summary}</p>

                {item.highlights && item.highlights.length > 0 && (
                    <div>
                        <strong>Highlights:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            {item.highlights.map((hl, i) => (
                                <li key={i}>{hl}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {item.takeaways && (
                    <p><strong>Takeaways:</strong> {item.takeaways}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-500 text-xs">
                        <Tag className="w-3 h-3 mr-1 opacity-70" />
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted border-t border-gray-100 pt-4">
                <div className="flex items-center gap-4">
                    <span className="flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {item.source}
                    </span>
                    {item.originalDate && (
                        <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {item.originalDate}
                        </span>
                    )}
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent font-medium">
                    阅读原文 →
                </a>
            </div>
        </div>
    );
}
