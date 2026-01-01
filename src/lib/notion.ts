import { Client } from '@notionhq/client';

export interface TripMetadata {
    title: string;
    city: string;
    startDate: string;
    endDate: string;
    exchangeRate: string;
    timezone: string;
}

export interface ItineraryItem {
    id: string;
    type: string;
    title: string;
    category: string;
    date: string;
    maps: string;
    img: string | null;
}

export async function getTripData() {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
        throw new Error(`Missing Notion credentials. API Key: ${apiKey ? 'set' : 'missing'}, DB ID: ${databaseId ? 'set' : 'missing'}`);
    }

    const notion = new Client({
        auth: apiKey,
    });

    // 使用最新的 Notion API (v2025-09-03) 語法: dataSources.query
    // 注意: database_id 參數已變更為 data_source_id
    const response = await notion.dataSources.query({
        data_source_id: databaseId,
    });

    const results = response.results as any[];

    // 解析元數據 (Metadata)
    const countryRow = results.find(r => r.properties.type?.select?.name === 'country');
    const cityRow = results.find(r => r.properties.type?.select?.name === 'city');
    const exchangeRow = results.find(r => r.properties.type?.select?.name === 'exchange');
    const gmtRow = results.find(r => r.properties.type?.select?.name === 'gmt');

    const metadata: TripMetadata = {
        title: countryRow?.properties.title?.title[0]?.plain_text || '我的旅遊行程',
        city: cityRow?.properties.title?.title[0]?.plain_text || '',
        startDate: countryRow?.properties.date?.date?.start || '',
        endDate: countryRow?.properties.date?.date?.end || '',
        exchangeRate: exchangeRow?.properties.title?.title[0]?.plain_text || 'JPY',
        timezone: gmtRow?.properties.title?.title[0]?.plain_text || 'GMT+8',
    };

    // 篩選並排序行程項目 (Journey)
    const itinerary: ItineraryItem[] = results
        .filter(r => r.properties.type?.select?.name === 'journey')
        .map(page => {
            let coverUrl = null;
            if (page.cover) {
                if (page.cover.type === 'external') {
                    coverUrl = page.cover.external.url;
                } else if (page.cover.type === 'file') {
                    coverUrl = page.cover.file.url;
                }
            }

            return {
                id: page.id,
                type: 'journey',
                title: page.properties.title?.title[0]?.plain_text || '未命名項目',
                category: page.properties.category?.select?.name || 'other',
                date: page.properties.date?.date?.start || '',
                maps: page.properties.maps?.url || '',
                img: coverUrl,
            };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { metadata, itinerary };
}
