'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Hospital, LatLng } from '@/lib/types';
import { directionsUrl } from '@/lib/geo';
import { hospitalDistrict, hospitalName } from '@/lib/i18n/terms';
import { useCopy, useLang } from '@/components/i18n-provider';

const COPY = {
  en: { you: 'Your location', wait: (n: number) => `wait ~${n} min (synthetic)`, directions: 'Open directions' },
  ar: { you: 'موقعك', wait: (n: number) => `الانتظار ~${n} دقيقة (بيانات تجريبية)`, directions: 'افتح الاتجاهات' },
};

export interface MapFacility {
  hospital: Hospital;
  rank?: number;
  eligible?: boolean;
}

function markerIcon(label: string, color: string, active: boolean) {
  const size = active ? 38 : 32;
  return L.divIcon({
    className: '',
    html: `<div class="cf-marker ${active ? 'is-active' : ''}" style="width:${size}px;height:${size}px;background:${color}">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0284c7;border:3px solid #fff;box-shadow:0 0 0 6px rgba(2,132,199,0.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function FacilityMapInner({
  facilities,
  origin,
  activeId,
  onSelect,
  className,
}: {
  facilities: MapFacility[];
  origin?: LatLng;
  activeId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const { lang } = useLang();
  const t = useCopy(COPY);
  const points = [...facilities.map((f) => ({ lat: f.hospital.lat, lng: f.hospital.lng })), ...(origin ? [origin] : [])];
  return (
    <MapContainer center={[21.57, 39.16]} zoom={12} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>{t.you}</Popup>
        </Marker>
      )}
      {facilities.map((f) => {
        const active = activeId === f.hospital.id;
        const color = f.eligible === false ? '#94a3b8' : f.hospital.facility_type === 'primary_care' ? '#059669' : '#0f766e';
        const label = f.rank ? String(f.rank) : f.hospital.facility_type === 'primary_care' ? 'PC' : 'H';
        return (
          <Marker
            key={f.hospital.id}
            position={[f.hospital.lat, f.hospital.lng]}
            icon={markerIcon(label, active ? '#0284c7' : color, active)}
            eventHandlers={{ click: () => onSelect?.(f.hospital.id) }}
            zIndexOffset={active ? 1000 : 0}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{hospitalName(f.hospital, lang)}</p>
                <p className="text-xs text-slate-600">
                  {hospitalDistrict(f.hospital, lang)} - {t.wait(f.hospital.wait_minutes)}
                </p>
                <a
                  className="text-xs font-semibold text-teal-700"
                  href={directionsUrl({ lat: f.hospital.lat, lng: f.hospital.lng }, origin)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.directions}
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
