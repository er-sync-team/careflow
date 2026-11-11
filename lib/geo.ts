import type { LatLng } from './types';

export const JEDDAH_CENTER: LatLng = { lat: 21.5700, lng: 39.1600 };

export const DEMO_LOCATIONS: { id: string; label: string; coords: LatLng }[] = [
  { id: 'rawdah', label: 'Al-Rawdah', coords: { lat: 21.5630, lng: 39.1520 } },
  { id: 'andalus', label: 'Al-Andalus', coords: { lat: 21.5370, lng: 39.1430 } },
  { id: 'safa', label: 'Al-Safa', coords: { lat: 21.5780, lng: 39.2030 } },
  { id: 'salamah', label: 'Al-Salamah', coords: { lat: 21.5960, lng: 39.1580 } },
  { id: 'obhur', label: 'North Obhur', coords: { lat: 21.7000, lng: 39.1080 } },
  { id: 'balad', label: 'Al-Balad (Historic District)', coords: { lat: 21.4870, lng: 39.1840 } },
];

export function directionsUrl(to: LatLng, from?: LatLng): string {
  const params = new URLSearchParams({ api: '1', destination: `${to.lat},${to.lng}` });
  if (from) params.set('origin', `${from.lat},${from.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
