'use client';

import dynamic from 'next/dynamic';

export type { MapFacility } from './facility-map-inner';

export const FacilityMap = dynamic(() => import('./facility-map-inner'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />,
});
