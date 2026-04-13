import { useEffect } from 'react';
import type { LeafletMouseEvent } from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lon: number) => void;
}

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];
const TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ||
  '&copy; OpenStreetMap contributors';

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

export default function LocationPickerMap({ latitude, longitude, onPick }: Props) {
  const center: [number, number] =
    latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-xl border border-brand-300/60">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '18rem', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ClickHandler onPick={onPick} />
        <Recenter center={center} />
        {latitude != null && longitude != null && (
          <CircleMarker
            center={[latitude, longitude]}
            radius={8}
            pathOptions={{ color: '#73358B', fillColor: '#73358B', fillOpacity: 0.45 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
