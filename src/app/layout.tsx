import type { Metadata } from 'next';
import { Tajawal, Amiri } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

const amiri = Amiri({
  variable: '--font-amiri',
  subsets: ['arabic'],
  weight: ['700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'المحلل القانوني المصري | استخراج الدفوع والثغرات',
  description:
    'أداة تحليل المواد القانونية المصرية واستخراج الدفوع الشكلية والموضوعية والثغرات وأحكام النقض',
  icons: {
    icon: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${amiri.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
