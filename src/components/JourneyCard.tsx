import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plane, Hotel, MapPin, Utensils, ShoppingBag, Info, ExternalLink } from 'lucide-react';
import { ItineraryItem } from '@/lib/notion';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';

// Mapping category strings (from Notion select) to Icons
const TYPE_ICONS: Record<string, any> = {
    transport: Plane,
    hotel: Hotel,
    visit: MapPin,
    restaurant: Utensils,
    shopping: ShoppingBag,
};

const TYPE_COLORS: Record<string, string> = {
    transport: 'bg-blue-100 text-blue-600',
    hotel: 'bg-indigo-100 text-indigo-600',
    visit: 'bg-emerald-100 text-emerald-600',
    restaurant: 'bg-orange-100 text-orange-600',
    shopping: 'bg-pink-100 text-pink-600',
};

interface JourneyCardProps {
    item: ItineraryItem;
    isPast?: boolean;
    hideImage?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ item, isPast = false, hideImage = false }) => {
    const CategoryIcon = TYPE_ICONS[item.category] || Info;
    const colorClass = TYPE_COLORS[item.category] || 'bg-gray-100 text-gray-600';

    // Helper to render the priority icon: item.icon (Notion) > Category Icon
    const renderIcon = () => {
        if (item.icon) {
            // Check if it's a URL (image) or Emoji
            if (item.icon.startsWith('http') || item.icon.startsWith('data:')) {
                return <img src={item.icon} alt="" className="w-4 h-4 object-contain" />;
            }
            // Assume it's an emoji char
            return <span className="text-sm leading-none">{item.icon}</span>;
        }
        return <CategoryIcon size={16} />;
    };

    // State for page content
    const [blocks, setBlocks] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBlocks = async () => {
        if (blocks || !item.hasContent) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/notion/page/${item.id}`);
            if (res.ok) {
                const data = await res.json();
                setBlocks(data.blocks);
            }
        } catch (error) {
            console.error("Failed to load blocks", error);
        } finally {
            setIsLoading(false);
        }
    };



    const dateObj = parseISO(item.date);
    const timeStr = format(dateObj, 'HH:mm');
    const dateStr = format(dateObj, 'yyyy-MM-dd');

    return (
        <div className={cn(
            "relative mb-4 rounded-2xl bg-white/80 border border-white/40 shadow-sm backdrop-blur-md transition-all duration-300 overflow-hidden group",
            isPast && "opacity-60 grayscale-[0.5]"
        )}>
            {/* List View Cover Image */}
            {item.img && !hideImage && (
                <div className="h-32 w-full relative overflow-hidden">
                    <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
            )}

            <Dialog onOpenChange={(open) => {
                if (open) fetchBlocks();
            }}>
                <DialogTrigger asChild>
                    <div className={cn("p-4 flex gap-4 cursor-pointer hover:bg-white/50 transition-colors", item.img && !hideImage ? "" : "pt-4")}>
                        {/* Time & Line */}
                        <div className="flex flex-col items-center min-w-[3.5rem]">
                            <span className="text-sm font-bold text-slate-500 font-mono">{timeStr}</span>
                            <div className="flex-1 w-0.5 bg-slate-200 my-2 rounded-full min-h-[2rem]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={cn("inline-flex items-center justify-center p-1.5 rounded-lg shadow-sm shrink-0", colorClass)}>
                                            {renderIcon()}
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.title}</h3>
                                    </div>
                                </div>
                                {item.maps && (
                                    <a
                                        href={item.maps}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                )}
                            </div>

                            {item.description && (
                                <p className="text-sm text-slate-500 mt-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogTrigger>

                <DialogContent className="max-w-sm w-[90vw] p-0 overflow-hidden rounded-3xl gap-0 border-0 shadow-2xl bg-white max-h-[85vh] flex flex-col">
                    <DialogHeader className="hidden">
                        <DialogTitle>{item.title}</DialogTitle>
                        <DialogDescription>{dateStr}</DialogDescription>
                    </DialogHeader>

                    {/* Dialog Cover */}
                    {item.img ? (
                        <div className="h-48 w-full relative">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white flex items-end gap-3">
                                <div className={cn("inline-flex items-center justify-center p-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 shrink-0")}>
                                    {renderIcon()}
                                </div>
                                <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-sm mb-0.5">{item.title}</h2>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 pb-2 text-left flex items-center gap-3">
                            <div className={cn("inline-flex items-center justify-center p-2 rounded-xl shrink-0", colorClass)}>
                                {renderIcon()}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">{item.title}</h2>
                        </div>
                    )}

                    <div className="p-6 pt-4 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                            <div className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                                {timeStr}
                            </div>
                            <span className="text-sm border-l border-slate-200 pl-2">{dateStr}</span>
                        </div>



                        {/* Content Section */}
                        <div className="text-slate-600 leading-relaxed text-sm">
                            {/* Always show description if available */}
                            {item.description && (
                                <div className="mb-4 text-base p-3 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">{item.description}</div>
                            )}

                            {isLoading && (
                                <div className="flex items-center justify-center py-8 space-x-2 text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            )}

                            {/* Render Blocks */}
                            {blocks && blocks.length > 0 && (
                                <NotionBlockRenderer blocks={blocks} />
                            )}
                        </div>

                        {/* Button Map */}
                        {item.maps && (
                            <Button asChild className="w-full rounded-xl gap-2 font-bold h-12 text-base shadow-lg shadow-blue-200/50 bg-blue-600 hover:bg-blue-700 mt-6" size="lg">
                                <a href={item.maps} target="_blank" rel="noreferrer">
                                    <MapPin size={18} />
                                    開啟地圖
                                </a>
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
