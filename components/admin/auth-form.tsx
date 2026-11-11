'use client';

import { useEffect, useState } from 'react';
import { Building2, KeyRound, Loader2, LockKeyhole } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Hospital } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DEMO_ADMIN_PASSWORD, DEMO_FACILITY_LETTERS, demoAdminEmail, demoHospitalLabel } from '@/lib/demo-scenarios';
import type { Copy, Lang } from '@/lib/i18n/config';
import { hospitalDistrict, hospitalName } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { Logo } from '@/components/site-chrome';
import { SyntheticTag } from '@/components/shared/badges';

const inputCls =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100';

const COPY: Copy<{
  errors: { exists: string; invalid: string; password: string; network: string; generic: string };
  title: string;
  intro: string;
  bullets: string[];
  signIn: string;
  createTab: string;
  email: string;
  password: string;
  passwordHint: string;
  create: string;
  signupNote: string;
  demoTitle: string;
  demoBody: string;
  demoFacility: string;
  fill: string;
  loadFailed: string;
  assignFailed: string;
  choose: string;
  permanent: string;
  primary: string;
  hospital: string;
  signOut: string;
  confirm: string;
}> = {
  en: {
    errors: {
      exists: 'An account with this email already exists. Please sign in.',
      invalid: 'Incorrect email or password.',
      password: 'Password must be at least 6 characters.',
      network: 'Network problem. Please check your connection and try again.',
      generic: 'Something went wrong. Please try again.',
    },
    title: 'Hospital administration',
    intro: "Manage your facility's waiting time, capacity and services, and follow incoming patients in real time.",
    bullets: [
      'Each account manages exactly one demonstration facility',
      'Updates instantly re-rank patient recommendations',
      'All facilities and cases are synthetic demo data',
    ],
    signIn: 'Sign in',
    createTab: 'Create admin account',
    email: 'Work email',
    password: 'Password',
    passwordHint: 'At least 6 characters',
    create: 'Create account',
    signupNote: 'After creating your account you will choose the demonstration facility you manage.',
    demoTitle: 'Demo administrator accounts',
    demoBody: 'Synthetic accounts for the hackathon demo. Each one manages a single facility.',
    demoFacility: 'Demo facility',
    fill: 'Fill demo login',
    loadFailed: 'We could not load facilities.',
    assignFailed: 'We could not assign this facility. Please try again.',
    choose: 'Choose the facility you manage',
    permanent: 'This assignment is permanent for your account. You will only be able to manage this facility.',
    primary: 'Primary care',
    hospital: 'Hospital with ED',
    signOut: 'Sign out',
    confirm: 'Confirm facility',
  },
  ar: {
    errors: {
      exists: 'يوجد حساب بهذا البريد الإلكتروني بالفعل. يرجى تسجيل الدخول.',
      invalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      password: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
      network: 'مشكلة في الاتصال. يرجى التحقق من الشبكة والمحاولة مرة أخرى.',
      generic: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    },
    title: 'إدارة المستشفى',
    intro: 'أدر وقت الانتظار والسعة والخدمات في منشأتك، وتابع المرضى القادمين لحظة بلحظة.',
    bullets: ['يدير كل حساب منشأة تجريبية واحدة فقط', 'التحديثات تعيد ترتيب توصيات المرضى فورا', 'جميع المنشآت والحالات بيانات تجريبية'],
    signIn: 'تسجيل الدخول',
    createTab: 'إنشاء حساب مسؤول',
    email: 'البريد الإلكتروني للعمل',
    password: 'كلمة المرور',
    passwordHint: '6 أحرف على الأقل',
    create: 'إنشاء الحساب',
    signupNote: 'بعد إنشاء حسابك ستختار المنشأة التجريبية التي تديرها.',
    demoTitle: 'حسابات المسؤولين التجريبية',
    demoBody: 'حسابات تجريبية لعرض الهاكاثون. يدير كل حساب منشأة واحدة.',
    demoFacility: 'المنشأة التجريبية',
    fill: 'تعبئة بيانات الدخول التجريبية',
    loadFailed: 'تعذر تحميل المنشآت.',
    assignFailed: 'تعذر ربط هذه المنشأة بحسابك. يرجى المحاولة مرة أخرى.',
    choose: 'اختر المنشأة التي تديرها',
    permanent: 'هذا الربط دائم لحسابك. ستتمكن من إدارة هذه المنشأة فقط.',
    primary: 'رعاية أولية',
    hospital: 'مستشفى بقسم طوارئ',
    signOut: 'تسجيل الخروج',
    confirm: 'تأكيد المنشأة',
  },
};

function friendlyAuthError(message: string, lang: Lang) {
  const e = COPY[lang].errors;
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) return e.exists;
  if (m.includes('invalid login')) return e.invalid;
  if (m.includes('password')) return e.password;
  if (m.includes('fetch') || m.includes('network')) return e.network;
  return e.generic;
}

export function AuthForm({ initialFacility }: { initialFacility?: string }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(initialFacility ? demoAdminEmail(initialFacility) : '');
  const [password, setPassword] = useState(initialFacility ? DEMO_ADMIN_PASSWORD : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Pick<Hospital, 'id' | 'name' | 'name_ar' | 'district'>[]>([]);
  const [demoId, setDemoId] = useState(initialFacility ?? 'H06');

  useEffect(() => {
    supabase
      .from('hospitals')
      .select('id, name, name_ar, district')
      .order('id')
      .then(({ data }) => {
        if (Array.isArray(data)) setFacilities(data);
      });
  }, []);

  const fillDemo = () => {
    setMode('signin');
    setError(null);
    setEmail(demoAdminEmail(demoId));
    setPassword(DEMO_ADMIN_PASSWORD);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setError(friendlyAuthError(error.message, lang));
  };

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-xl md:grid-cols-2">
      <div className="relative hidden bg-slate-900 p-10 text-white md:block">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative space-y-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-slate-300">
            {t.intro}
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            {t.bullets.map((b) => (
              <li key={b}>- {b}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-8 sm:p-10">
        <Logo />
        <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn('rounded-lg py-2 transition-all', mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              {m === 'signin' ? t.signIn : t.createTab}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
              {t.email}
            </label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className={inputCls} placeholder="admin@hospital.demo" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className={inputCls}
              placeholder={t.passwordHint}
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <button
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {mode === 'signin' ? t.signIn : t.create}
          </button>
          {mode === 'signup' && <p className="text-xs text-slate-500">{t.signupNote}</p>}
        </form>
        {facilities.length > 0 && (
          <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-sky-900">
              <KeyRound className="h-4 w-4" /> {t.demoTitle}
            </p>
            <p className="mt-1 text-xs text-sky-800">{t.demoBody}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="demo-facility" className="sr-only">
                {t.demoFacility}
              </label>
              <select
                id="demo-facility"
                value={demoId}
                onChange={(e) => setDemoId(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-200"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {DEMO_FACILITY_LETTERS[f.id] ? `${demoHospitalLabel(f.id, lang)}: ` : ''}
                    {hospitalName(f, lang)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fillDemo}
                className="h-10 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-800"
              >
                {t.fill}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FacilityClaim({ onAssigned }: { onAssigned: (id: string) => void }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('hospitals')
      .select('*')
      .order('id')
      .then(({ data, error }) => {
        if (error || !Array.isArray(data)) setError(COPY[lang].loadFailed);
        else setHospitals(data as Hospital[]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claim = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc('claim_demo_facility', { p_hospital_id: selected });
    setBusy(false);
    if (error || typeof data !== 'string') {
      setError(t.assignFailed);
      return;
    }
    onAssigned(data);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{t.choose}</h1>
        <SyntheticTag />
      </div>
      <p className="mt-2 text-sm text-slate-600">{t.permanent}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {hospitals.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelected(h.id)}
            className={cn(
              'rounded-2xl border p-4 text-start transition-all',
              selected === h.id ? 'border-primary bg-accent ring-2 ring-teal-100' : 'border-border hover:border-slate-300',
            )}
          >
            <p className="font-semibold text-slate-900">{hospitalName(h, lang)}</p>
            <p className="text-xs text-slate-500">
              {hospitalDistrict(h, lang)} - {h.facility_type === 'primary_care' ? t.primary : t.hospital}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="mt-6 flex justify-between gap-3">
        <button onClick={() => supabase.auth.signOut()} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          {t.signOut}
        </button>
        <button
          onClick={claim}
          disabled={!selected || busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.confirm}
        </button>
      </div>
    </div>
  );
}
