'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isSameDay, isBefore, startOfDay, addDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TripMetadata, ItineraryItem } from '@/lib/notion';
import { parseNotionDateTime, cn } from '@/lib/utils';
import { JourneyCard } from './JourneyCard';
// import { LoginScreen } from './LoginScreen'; // Removed
import { TopBar } from './TopBar';
// import Cookies from 'js-cookie'; // Removed
import { BottomNav, TabType } from './BottomNav';
import { CurrencyWidget } from './CurrencyWidget';
import { TimeZoneWidget } from './TimeZoneWidget';
import { Phone, ShieldAlert } from 'lucide-react';
import { NotionBlockRenderer } from './NotionBlockRenderer';
import { PullToRefresh } from './PullToRefresh';

interface JourneyDashboardProps {
    data: {
        metadata: TripMetadata;
        itinerary: ItineraryItem[];
    };
    requiredPassword?: string | null;
}

// Helper to ensure we treat strings as local time (stripping timezones)
const toFloatingDate = (dateStr: string): Date => {
    const { dateTimeStr } = parseNotionDateTime(dateStr);
    // dateTimeStr is "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
    // If we pass this to parseISO (without Z), it create a local date
    return parseISO(dateTimeStr);
};

export default function JourneyDashboard({ data, requiredPassword }: JourneyDashboardProps) {
    const { metadata, itinerary } = data;

    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [isAtTop, setIsAtTop] = useState(true);

    // Current time for "Now" logic
    // In a real app, you might want this to update every minute, but for now fixed on mount is fine
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
    }, []);

    // Sort by date (already sorted in notion.ts but good safety)
    const sortedJourneys = useMemo(() =>
        [...itinerary].sort((a, b) => {
            return toFloatingDate(a.date).getTime() - toFloatingDate(b.date).getTime();
        }),
        [itinerary]);

    // Group by Day
    const groupedJourneys = useMemo(() => {
        const groups: Record<string, ItineraryItem[]> = {};
        sortedJourneys.forEach(item => {
            // Use the notion-parsed date string YYYY-MM-DD key
            const { date } = parseNotionDateTime(item.date);
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [sortedJourneys]);

    const allDates = useMemo(() => Object.keys(groupedJourneys).sort(), [groupedJourneys]);

    // Initialize expanded state for Today
    useEffect(() => {
        if (!now) return;
        const todayKey = format(now, 'yyyy-MM-dd');
        if (allDates.includes(todayKey)) {
            setExpandedDays(prev => ({
                ...prev,
                [todayKey]: true
            }));
        } else {
            // If today not in list, maybe expand the first upcoming day?
            // For now, let's just expand the first day if nothing else matches
            if (allDates.length > 0 && !Object.keys(expandedDays).length) {
                setExpandedDays({ [allDates[0]]: true });
            }
        }
    }, [allDates, now]); // Run when dates ready or now loaded

    const toggleDay = (dateStr: string) => {
        setExpandedDays(prev => ({
            ...prev,
            [dateStr]: !prev[dateStr]
        }));
    };

    // -- Render Logic --

    // 1. UNIFIED HOME TAB
    const renderHome = () => {
        return (
            <div className="pb-32 pt-4">
                {/* Widgets Row */}
                <div className="mx-4 mb-6 flex gap-4 h-28">
                    <div className="w-2/3">
                        <CurrencyWidget
                            currencyCode={metadata.exchangeRate || 'JPY'}
                        />
                    </div>
                    <div className="w-1/3">
                        <TimeZoneWidget
                            gmtOffset={metadata.timezone || '+9'}
                        />
                    </div>
                </div>

                {/* The List Logic */}
                <div className="px-4 space-y-4">
                    {allDates.map((dateStr, index) => {
                        const isExpanded = !!expandedDays[dateStr];
                        const dayItems = groupedJourneys[dateStr];
                        const dateObj = parseISO(dateStr); // safe for YYYY-MM-DD
                        const isToday = now ? isSameDay(dateObj, now) : false;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "rounded-2xl transition-all duration-300 overflow-hidden border shadow-sm",
                                    isExpanded ? "bg-white/60 border-blue-100 shadow-md" : "bg-white/40 border-white/60 hover:bg-white/60"
                                )}
                            >
                                {/* Header / Big Card Trigger */}
                                <button
                                    onClick={() => toggleDay(dateStr)}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-bold uppercase tracking-widest",
                                                isToday ? "text-blue-600" : "text-slate-400"
                                            )}>
                                                第 {index + 1} 天
                                            </span>
                                            {isToday && (
                                                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    今天
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={cn(
                                            "text-lg font-semibold",
                                            isToday ? "text-blue-900" : "text-slate-700"
                                        )}>
                                            {format(dateObj, 'MMM do', { locale: zhTW })} - {format(dateObj, 'EEEE', { locale: zhTW })}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-400 font-medium">
                                            {dayItems.length} 個行程
                                        </span>
                                        <div className={cn(
                                            "p-1 rounded-full transition-transform duration-300",
                                            isExpanded ? "bg-blue-50 text-blue-600 rotate-180" : "text-slate-400"
                                        )}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100/50 mt-1">
                                                <div className="h-2" /> {/* Spacer */}
                                                {dayItems.map(item => {
                                                    const itemTime = toFloatingDate(item.date);
                                                    // Check if item time is strictly before "Now" time
                                                    // This requires careful comparison of floating date vs real date
                                                    // If "now" is 2026-01-02 14:00 local, and item is 2026-01-02 09:00 (floating), it is past.
                                                    const isPast = now ? isBefore(itemTime, now) : false;

                                                    return (
                                                        <JourneyCard
                                                            key={item.id}
                                                            item={item}
                                                            isPast={isPast}
                                                            hideImage={true} // Only icons, no images in list
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 3. FILTERED TABS
    const renderFiltered = (filterType: string | 'visit_group') => {
        let filteredItems = sortedJourneys;

        if (filterType === 'visit_group') {
            // 'visit', 'shopping', 'restaurant' are mapped to Visit tab
            filteredItems = sortedJourneys.filter(j => ['visit', 'shopping', 'restaurant'].includes(j.category));
        } else {
            filteredItems = sortedJourneys.filter(j => j.category === filterType);
        }

        return (
            <div className="pb-32 pt-4 px-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p>此分類目前沒有行程。</p>
                    </div>
                ) : (
                    filteredItems.reduce((groups, item) => {
                        const { date } = parseNotionDateTime(item.date);
                        const lastGroup = groups[groups.length - 1];
                        if (lastGroup && lastGroup.date === date) {
                            lastGroup.items.push(item);
                        } else {
                            groups.push({ date: date, items: [item] });
                        }
                        return groups;
                    }, [] as { date: string, items: typeof filteredItems }[]).map((group) => (
                        <div key={group.date} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">
                                        {format(parseISO(group.date), 'MM/dd EEEE', { locale: zhTW })}
                                    </span>
                                </div>
                                <div className="h-px bg-slate-200/60 flex-1" />
                            </div>

                            <div className="space-y-3">
                                {group.items.map(item => (
                                    <div key={item.id}>
                                        <JourneyCard item={item} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    // 4. INFO TAB (Placeholder content or adapted)
    // 4. INFO TAB
    const renderInfo = () => (
        <div className="pb-32 pt-4 px-4">
            {metadata.infoPage ? (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60">
                    <NotionBlockRenderer blocks={metadata.infoPage.blocks} />
                </div>
            ) : (
                <div className="p-8 pb-32 flex flex-col items-center justify-center text-center text-slate-500 space-y-8">
                    <ShieldAlert size={48} className="text-slate-300" />
                    <p>尚無緊急資訊</p>
                </div>
            )}
        </div>
    );



    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
            <div className="max-w-[768px] mx-auto min-h-screen bg-[#F8FAFC] shadow-2xl relative transition-colors duration-300">
                <TopBar
                    title={metadata.city ? `${metadata.title} - ${metadata.city}` : metadata.title}
                    subtitle={
                        metadata.startDate && metadata.endDate
                            ? format(parseISO(metadata.startDate), 'MMM do', { locale: zhTW }) + ' - ' + format(parseISO(metadata.endDate), 'MMM do', { locale: zhTW })
                            : ''
                    }
                />

                <main
                    className="absolute inset-0 overflow-y-auto pt-20"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        setIsAtTop(target.scrollTop <= 0);
                    }}
                >
                    <PullToRefresh isPullable={isAtTop}>
                        <div className="min-h-full">
                            {activeTab === 'home' && renderHome()}
                            {activeTab === 'visit' && renderFiltered('visit_group')}
                            {activeTab === 'hotel' && renderFiltered('hotel')}
                            {activeTab === 'transport' && renderFiltered('transport')}
                            {activeTab === 'info' && renderInfo()}
                        </div>
                    </PullToRefresh>
                </main>

                <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
    );
}
