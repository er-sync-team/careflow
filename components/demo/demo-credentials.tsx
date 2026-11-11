'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DEMO_ADMIN_PASSWORD, demoAdminEmail, demoHospitalLabel } from '@/lib/demo-scenarios';
import { hospitalName } from '@/lib/i18n/terms';
import type { Copy } from '@/lib/i18n/config';
import type { Hospital } from '@/lib/types';
import { useCopy, useLang } from '@/components/i18n-provider';

const COPY: Copy<{ title: string; password: string; error: string; primary: string; hospital: string; signIn: string }> = {
  en: {
    title: 'Demo administrator accounts',
    password: 'Password for every account:',
    error: '{t.error}',
    primary: 'Primary care',
    hospital: 'Hospital with emergency department',
    signIn: 'Sign in',
  },
  ar: {
    title: 'حسابات المسؤولين التجريبية',
    password: 'كلمة المرور لجميع الحسابات:',
    error: 'تعذر تحميل قائمة المنشآت. يرجى تحديث الصفحة.',
    primary: 'رعاية أولية',
    hospital: 'مستشفى بقسم طوارئ',
    signIn: 'تسجيل الدخول',
  },
};

export function DemoCredentials() {
  const { lang } = useLang();
  const t = useCopy(COPY);
  const [facilities, setFacilities] = useState<Pick<Hospital, 'id' | 'name' | 'name_ar' | 'district' | 'facility_type'>[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('hospitals')
      .select('id, name, name_ar, district, facility_type')
      .order('id')
      .then(({ data, error }) => {
        if (error || !Array.isArray(data)) setError(true);
        else setFacilities(data);
      });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <p className="flex items-center gap-2 font-display font-bold text-slate-900">
          <KeyRound className="h-4 w-4 text-primary" /> {t.title}
        </p>
        <p className="text-sm text-slate-600">
          {t.password} <span dir="ltr" className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-900">{DEMO_ADMIN_PASSWORD}</span>
        </p>
      </div>
      {error && <p className="px-5 py-4 text-sm text-red-700">{t.error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <tbody>
            {facilities.map((f) => (
              <tr key={f.id} className="border-t border-border first:border-t-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">
                    {demoHospitalLabel(f.id, lang) && (
                      <span className="me-2 rounded bg-teal-100 px-1.5 py-0.5 text-xs font-bold text-teal-800">{demoHospitalLabel(f.id, lang)}</span>
                    )}
                    {hospitalName(f, lang)}
                  </p>
                  <p className="text-xs text-slate-500">{f.facility_type === 'primary_care' ? t.primary : t.hospital}</p>
                </td>
                <td dir="ltr" className="px-5 py-3 text-start font-mono text-xs text-slate-700 rtl:text-end">{demoAdminEmail(f.id)}</td>
                <td className="px-5 py-3 text-end">
                  <a
                    href={`/admin?facility=${f.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 underline-offset-2 hover:underline"
                  >
                    {t.signIn} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
