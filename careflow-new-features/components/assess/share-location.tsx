'use client';

import { useState } from 'react';
import { Loader2, MapPin, MessageCircle, MessageSquare, Share2 } from 'lucide-react';
import type { Copy } from '@/lib/i18n/config';
import { useLang } from '@/components/i18n-provider';
import { locationMessage, mapsLink, smsUrl, whatsappUrl } from '@/lib/share-location';

type State =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'ready'; text: string; link: string }
  | { kind: 'error'; reason: 'denied' | 'unavailable' };

const COPY: Copy<{
  title: string;
  hint: string;
  button: string;
  locating: string;
  ready: string;
  whatsapp: string;
  sms: string;
  share: string;
  open: string;
  denied: string;
  unavailable: string;
}> = {
  en: {
    title: 'Tell family where you are',
    hint: 'Sends a Google Maps link to your current location. Call 997 first.',
    button: 'Share my location',
    locating: 'Finding your location...',
    ready: 'Location ready. Choose how to send it:',
    whatsapp: 'WhatsApp',
    sms: 'Text message',
    share: 'More options',
    open: 'Check on map',
    denied: 'Location permission was not given. Tell the 997 dispatcher your address or the nearest landmark.',
    unavailable: 'Your location could not be found. Tell the 997 dispatcher your address or the nearest landmark.',
  },
  ar: {
    title: 'أخبر أهلك بمكانك',
    hint: 'يرسل رابط خرائط Google لموقعك الحالي. اتصل بـ 997 أولا.',
    button: 'شارك موقعي',
    locating: 'جار تحديد موقعك...',
    ready: 'الموقع جاهز. اختر طريقة الإرسال:',
    whatsapp: 'واتساب',
    sms: 'رسالة نصية',
    share: 'خيارات أخرى',
    open: 'عرض على الخريطة',
    denied: 'لم يتم السماح بالوصول للموقع. أخبر موظف الإسعاف 997 بعنوانك أو أقرب معلم.',
    unavailable: 'تعذر تحديد موقعك. أخبر موظف الإسعاف 997 بعنوانك أو أقرب معلم.',
  },
};

export function ShareLocation() {
  const { lang } = useLang();
  const t = COPY[lang];
  const [state, setState] = useState<State>({ kind: 'idle' });
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ kind: 'error', reason: 'unavailable' });
      return;
    }
    setState({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setState({ kind: 'ready', text: locationMessage(p, lang, pos.coords.accuracy), link: mapsLink(p) });
      },
      (err) => setState({ kind: 'error', reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const nativeShare = async (text: string) => {
    try {
      await navigator.share({ text });
    } catch {
      /* user closed the share sheet */
    }
  };

  const linkBtn = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors';

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
      <p className="flex items-center gap-2 font-semibold text-red-950">
        <MapPin className="h-4 w-4 text-red-600" /> {t.title}
      </p>
      <p className="mt-1 text-xs text-red-900/80">{t.hint}</p>

      {(state.kind === 'idle' || state.kind === 'error') && (
        <button type="button" onClick={locate} className={`${linkBtn} mt-3 bg-red-700 text-white hover:bg-red-800`}>
          <MapPin className="h-4 w-4" /> {t.button}
        </button>
      )}
      {state.kind === 'locating' && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-900">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.locating}
        </p>
      )}
      {state.kind === 'error' && <p className="mt-3 text-sm text-red-900">{state.reason === 'denied' ? t.denied : t.unavailable}</p>}
      {state.kind === 'ready' && (
        <div className="mt-3">
          <p className="text-sm text-red-950">{t.ready}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={whatsappUrl(state.text)} target="_blank" rel="noopener noreferrer" className={`${linkBtn} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <MessageCircle className="h-4 w-4" /> {t.whatsapp}
            </a>
            <a href={smsUrl(state.text)} className={`${linkBtn} bg-sky-700 text-white hover:bg-sky-800`}>
              <MessageSquare className="h-4 w-4" /> {t.sms}
            </a>
            {canNativeShare && (
              <button type="button" onClick={() => nativeShare(state.text)} className={`${linkBtn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                <Share2 className="h-4 w-4" /> {t.share}
              </button>
            )}
            <a href={state.link} target="_blank" rel="noopener noreferrer" className={`${linkBtn} text-red-800 underline underline-offset-2`}>
              {t.open}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
