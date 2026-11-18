import './globals.css';
import RegisterSW from './RegisterSW';
import type { ReactNode } from 'react';

export const metadata = { title: '우리 가족 달력', icons: { icon: [{ url: '/icon-192.png', sizes: '192x192' }, { url: '/icon-512.png', sizes: '512x512' }], apple: '/apple-touch-icon.png' }, appleWebApp: { capable: true, title: '가족 달력', statusBarStyle: 'default' as const } };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const, themeColor: '#2F3A4F' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Serif+KR:wght@500;600&family=Noto+Sans+KR:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
