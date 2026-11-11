export type Lang = 'en' | 'ar';

export const LANG_COOKIE = 'careflow_lang';

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'ar';

export const dirOf = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export type Copy<T> = Record<Lang, T>;
