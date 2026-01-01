import React from 'react';
import { getTripData } from '@/lib/notion';
import { formatTripDate, resolveMapUrl } from '@/lib/utils';
import SetupGuide from '@/components/SetupGuide';
import CurrencyConverter from '@/components/CurrencyConverter';
import { Calendar, MapPin, Plane, Hotel, MessageSquare, Info, Train, ShoppingBag, Utensils } from 'lucide-react';
import Image from 'next/image';

import Link from 'next/link';

// 強制動態渲染，確保在 Zeabur/Vercel 等平台部署時能即時讀取環境變數
export const dynamic = 'force-dynamic';

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'transport': return <Train className="w-5 h-5" />;
    case 'hotel': return <Hotel className="w-5 h-5" />;
    case 'visit': return <MapPin className="w-5 h-5" />;
    case 'restaurant': return <Utensils className="w-5 h-5" />;
    case 'shopping': return <ShoppingBag className="w-5 h-5" />;
    default: return <Info className="w-5 h-5" />;
  }
};

export default async function Home() {
  // 1. 先明確檢查環境變數
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !dbId) {
    console.log("Missing Environment Variables");
    return <SetupGuide />;
  }

  let tripData;
  try {
    tripData = await getTripData();
  } catch (error: any) {
    // 2. 如果 Catch 到錯誤，顯示錯誤訊息而非 SetupGuide
    console.error("Notion API Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-900">
        <h1 className="text-2xl font-bold mb-4">系統發生錯誤</h1>
        <p className="mb-2">雖然偵測到環境變數，但在讀取 Notion 資料時發生問題。</p>
        <div className="bg-white p-4 rounded-lg shadow border border-red-200 w-full max-w-lg overflow-auto">
          <p className="font-mono text-sm whitespace-pre-wrap text-red-600">
            {error.message || JSON.stringify(error)}
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-600">請檢查您的 API Key 權限或 Database ID 是否正確。</p>
      </div>
    );
  }

  const { metadata, itinerary } = tripData;

  return (
    <main className="min-h-screen pb-24 bg-gray-50">
      {/* Top Bar */}
      <div className="top-bar">
        <h1 className="text-lg font-bold tracking-tight">{metadata.city} {metadata.title}</h1>
        <p className="text-xs opacity-90 mt-1">
          {formatTripDate(metadata.startDate, metadata.endDate)} • {metadata.timezone}
        </p>
      </div>

      <div className="mt-24 px-4 space-y-4">
        {/* 匯率換算器 - 方便購物時快速使用 */}
        <CurrencyConverter targetCurrency={metadata.exchangeRate} />

        {itinerary.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="animate-pulse">目前資料庫是空的，請在 Notion 加入 `journey` 類型的行程。</p>
          </div>
        ) : (
          itinerary.map((item, index) => {
            const dateObj = new Date(item.date);
            const timeStr = dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

            return (
              <div key={item.id} className="timeline-card animate-fade-in-up overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>

                {/* Page Cover Image */}
                {item.img && (
                  <div className="relative w-full h-40 -mt-4 -mx-4 mb-4">
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-2 mt-2">
                  <span className="text-sm font-bold text-red-600">{timeStr}</span>
                  <div className="bg-red-50 p-2 rounded-full text-red-600">
                    <CategoryIcon category={item.category} />
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1">{item.title}</h3>

                {item.maps && (
                  <a
                    href={resolveMapUrl(item.maps)}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 border border-blue-100 bg-blue-50 px-3 py-2 rounded-full active:bg-blue-100 transition-colors mt-2"
                  >
                    <MapPin className="w-3 h-3" />
                    查看地點 / 導航
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav glass px-2">
        <button className="nav-item active">
          <Calendar className="w-6 h-6" />
          <span>行程</span>
        </button>
        <button className="nav-item">
          <Hotel className="w-6 h-6" />
          <span>住宿</span>
        </button>
        <button className="nav-item">
          <MapPin className="w-6 h-6" />
          <span>景點</span>
        </button>
        <button className="nav-item">
          <Plane className="w-6 h-6" />
          <span>交通</span>
        </button>
        <button className="nav-item">
          <MessageSquare className="w-6 h-6" />
          <span>會話</span>
        </button>
        <button className="nav-item text-gray-400">
          <Info className="w-6 h-6" />
          <span>資訊</span>
        </button>
      </nav>
    </main>
  );
}
