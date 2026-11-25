import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

// Fix Leaflet default icon URLs in Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const MapPicker: React.FC<Props> = ({
  latitude,
  longitude,
  onChange,
  height = '320px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default coordinate: City center (e.g., 37.7749, -122.4194)
  const defaultLat = latitude || 37.7749;
  const defaultLng = longitude || -122.4194;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create initial marker if coords passed
      if (latitude && longitude) {
        markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);
      }

      // Click to pick location
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          markerRef.current = L.marker([roundedLat, roundedLng], { icon: defaultIcon }).addTo(map);
        }

        onChange(roundedLat, roundedLng);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          onChange(lat, lng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }
        },
        (err) => {
          console.warn('Geolocation failed or denied:', err);
          // Fallback to sample point
          onChange(37.7749, -122.4194);
        }
      );
    }
  };

  return (
    <div className="relative border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />
      
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="bg-white/95 hover:bg-white text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded shadow-sm border border-slate-200 flex items-center gap-1.5 transition-colors"
          title="Detect Current Location"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>My Location</span>
        </button>
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          Click anywhere on the map to place precise GPS coordinates.
        </span>
        {latitude && longitude ? (
          <span className="font-mono text-slate-700 font-medium">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        ) : (
          <span className="text-slate-400 italic">No coordinates selected</span>
        )}
      </div>
    </div>
  );
};
