import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/components/i18n-provider';
import { dirOf } from '@/lib/i18n/config';
import { getLang } from '@/lib/i18n/server';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700'] });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic', weight: ['400', '500', '700'] });

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
    <html lang={lang} dir={dirOf(lang)} className={`${inter.variable} ${jakarta.variable} ${plexArabic.variable}`}>
      <body className="font-sans">
        <LanguageProvider initialLang={lang}>
          {children}
          <Toaster richColors position="top-center" dir={dirOf(lang)} />
        </LanguageProvider>
      </body>
    </html>
  );
}
