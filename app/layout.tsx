import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/components/i18n-provider';
import { dirOf } from '@/lib/i18n/config';
import { getLang } from '@/lib/i18n/server';

// Fonts load from Google Fonts in the browser. next/font/google in Next 13.5.1 fails to parse the current
// Google Fonts CSS at build time, which breaks the Netlify build.
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;700&display=swap';

export const metadata: Metadata = {
  title: 'CareFlow | Smart Emergency Routing',
  description: 'The Right Care. The Right Place. The Right Time. A demonstration healthcare navigation platform by Team ER Sync.',
  openGraph: {
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body className="font-sans">
        <LanguageProvider initialLang={lang}>
          {children}
          <Toaster richColors position="top-center" dir={dirOf(lang)} />
        </LanguageProvider>
      </body>
    </html>
  );
}
