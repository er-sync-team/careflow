'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { HeartPulse, Languages, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopy, useLang } from '@/components/i18n-provider';
import type { Copy } from '@/lib/i18n/config';

const COPY: Copy<{
  nav: { href: string; label: string }[];
  banner: [string, string];
  menu: string;
  tagline: string;
  builtBy: string;
  noticeTitle: string;
  notice: string;
  noticeCall: [string, string];
}> = {
  en: {
    nav: [
      { href: '/assess', label: 'Start assessment' },
      { href: '/demo', label: 'Live matching demo' },
      { href: '/admin', label: 'For hospitals' },
      { href: '/testing', label: 'How we tested' },
    ],
    banner: ['Life-threatening emergency? Do not use this app. Call', 'now.'],
    menu: 'Toggle menu',
    tagline: 'The Right Care. The Right Place. The Right Time.',
    builtBy: 'Built by Team ER Sync as a hackathon demonstration.',
    noticeTitle: 'Important notice',
    notice:
      'CareFlow is a demonstration prototype. It does not provide medical diagnoses, is not clinically validated and is not a replacement for emergency medical services. Urgency categories are illustrative only. All facilities, capacity, waiting times and patient cases shown are fictional synthetic data and do not represent real hospitals.',
    noticeCall: ['In Saudi Arabia, call', 'for ambulance assistance.'],
  },
  ar: {
    nav: [
      { href: '/assess', label: 'ابدأ التقييم' },
      { href: '/demo', label: 'عرض المطابقة المباشر' },
      { href: '/admin', label: 'للمستشفيات' },
      { href: '/testing', label: 'كيف اختبرنا' },
    ],
    banner: ['حالة طارئة تهدد الحياة؟ لا تستخدم هذا التطبيق. اتصل بـ', 'فورا.'],
    menu: 'فتح القائمة',
    tagline: 'الرعاية الصحيحة. في المكان الصحيح. في الوقت الصحيح.',
    builtBy: 'من تطوير فريق ER Sync كنموذج تجريبي لهاكاثون.',
    noticeTitle: 'تنبيه مهم',
    notice:
      'كيرفلو نموذج تجريبي للعرض فقط. لا يقدم تشخيصا طبيا، ولم يتم التحقق منه سريريا، ولا يغني عن خدمات الإسعاف والطوارئ. فئات الأولوية للتوضيح فقط. جميع المنشآت والسعة وأوقات الانتظار وحالات المرضى المعروضة بيانات وهمية ولا تمثل مستشفيات حقيقية.',
    noticeCall: ['في المملكة العربية السعودية، اتصل بـ', 'لطلب الإسعاف.'],
  },
};

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)} dir="ltr">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <HeartPulse className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Care<span className="text-primary">Flow</span>
      </span>
    </Link>
  );
}

export function LanguageToggle({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const { lang, setLang } = useLang();
  const next = lang === 'en' ? 'ar' : 'en';
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
        tone === 'light'
          ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800'
          : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
        className,
      )}
    >
      <Languages className="h-4 w-4" />
      <span lang={next} style={next === 'ar' ? { fontFamily: 'var(--font-arabic)' } : undefined}>
        {next === 'ar' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useCopy(COPY);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="bg-red-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {t.banner[0]}
          <a href="tel:997" className="rounded bg-white/15 px-1.5 font-bold underline-offset-2 hover:underline">
            997
          </a>
          {t.banner[1]}
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {t.nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900',
                  pathname.startsWith(n.href) && 'bg-accent text-accent-foreground hover:bg-accent',
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <LanguageToggle className="md:ms-2" />
          <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-label={t.menu}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-white px-4 py-2 md:hidden">
          {t.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const t = useCopy(COPY);
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-slate-600">{t.tagline}</p>
          <p className="text-xs text-slate-500">{t.builtBy}</p>
        </div>
        <div className="text-sm text-slate-600 md:col-span-2">
          <p className="font-semibold text-slate-900">{t.noticeTitle}</p>
          <p className="mt-2">
            {t.notice} {t.noticeCall[0]} <a href="tel:997" className="font-semibold text-red-700">997</a> {t.noticeCall[1]}
          </p>
        </div>
      </div>
    </footer>
  );
}
