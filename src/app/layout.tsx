import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';

import './globals.css';
import Header from '@/components/Header';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'PDF 工具 - 在线PDF和图片处理工具',
  description: '提供各种 PDF 和图片处理工具，满足您的文件处理需求',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider attribute="class" defaultTheme="system">
          <Header />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
