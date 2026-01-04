import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import PasswordProtection from "@/components/PasswordProtection";

import { getTripData } from "@/lib/notion";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('journey_auth')?.value === 'true';

    if (!isAuthenticated) {
        return {
            title: "旅程準備中...",
            description: "Protected Journey View",
            icons: {
                icon: "/favicon.png",
            },
        };
    }

    try {
        const { metadata } = await getTripData();
        return {
            title: metadata.city ? `${metadata.title} - ${metadata.city}` : metadata.title,
            description: "基於 Notion 的動態旅遊看板渲染器",
            appleWebApp: {
                capable: true,
                statusBarStyle: "default",
            },
            icons: {
                icon: "/favicon.png",
            },
        };
    } catch (e) {
        return {
            title: "旅遊行程看板",
            description: "基於 Notion 的動態旅遊看板渲染器",
            icons: {
                icon: "/favicon.png",
            },
        };
    }
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#a31b24",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('journey_auth')?.value === 'true';

    return (
        <html lang="zh-TW">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icon.png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />
            </head>
            <body>
                {isAuthenticated ? (
                    <div className="app-container">
                        {children}
                    </div>
                ) : (
                    <PasswordProtection />
                )}
            </body>
        </html>
    );
}
