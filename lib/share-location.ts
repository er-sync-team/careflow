import type { LatLng } from './types.ts';

export type ShareLang = 'en' | 'ar';

export const mapsLink = (p: LatLng) => `https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

/** Short emergency message with a Google Maps link to the current position. */
export function locationMessage(p: LatLng, lang: ShareLang, accuracyM?: number): string {
  const acc = accuracyM && Number.isFinite(accuracyM) ? Math.round(accuracyM) : null;
  return lang === 'ar'
    ? `حالة طارئة، أحتاج مساعدة. تم الاتصال أو سيتم الاتصال بالإسعاف 997. موقعي الحالي: ${mapsLink(p)}${acc ? ` (الدقة تقريبا ${acc} م)` : ''}`
    : `Emergency, I need help. 997 has been or is being called. My current location: ${mapsLink(p)}${acc ? ` (accuracy about ${acc} m)` : ''}`;
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
/** `sms:?&body=` works on both iOS and Android. */
export const smsUrl = (text: string) => `sms:?&body=${encodeURIComponent(text)}`;
