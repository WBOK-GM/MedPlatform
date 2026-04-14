import { useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer
} from 'react-leaflet';

interface DoctorMarker {
  id: string;
  name: string;
  specialization: string;
  city?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  doctors: DoctorMarker[];
  emptyText: string;
}

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];
const TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ||
  '&copy; OpenStreetMap contributors';

function averageCenter(doctors: DoctorMarker[]): [number, number] {
  if (doctors.length === 0) return DEFAULT_CENTER;

  const sums = doctors.reduce(
    (acc, doctor) => ({
      lat: acc.lat + doctor.latitude,
      lon: acc.lon + doctor.longitude,
    }),
    { lat: 0, lon: 0 }
  );

  return [sums.lat / doctors.length, sums.lon / doctors.length];
}

export default function DoctorResultsMap({ doctors, emptyText }: Props) {
  const center = useMemo(() => averageCenter(doctors), [doctors]);

  if (doctors.length === 0) {
    return (
      <div className="flex h-[28rem] items-center justify-center rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-5 text-center text-sm text-secondary-graphite">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-300/60 shadow-soft">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '28rem', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {doctors.map((doctor) => (
          <CircleMarker
            key={doctor.id}
            center={[doctor.latitude, doctor.longitude]}
            radius={8}
            pathOptions={{ color: '#73358B', fillColor: '#73358B', fillOpacity: 0.45 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-brand-900">{doctor.name}</div>
                <div className="text-secondary-graphite">{doctor.specialization}</div>
                {doctor.city && <div className="text-secondary-graphite">{doctor.city}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
