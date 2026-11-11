import { cookies } from 'next/headers';
import { LANG_COOKIE, isLang, type Lang } from './config';

export function getLang(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value;
  return isLang(v) ? v : 'en';
}
