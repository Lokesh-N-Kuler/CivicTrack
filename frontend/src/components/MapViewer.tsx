import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoPoint } from '../services/types';
import { BENGALURU_CONFIG } from '../services/geocoding';

interface SingleLocation {
  latitude: number;
  longitude: number;
  title: string;
  trackingId?: string;
  address?: string;
  locality?: string;
  status?: string;
}

interface Props {
  singleLocation?: SingleLocation;
  multiPoints?: GeoPoint[];
  height?: string;
  interactive?: boolean;
  onMarkerClick?: (trackingId: string) => void;
}

export const getStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'resolved':
      return '#16A34A';
    case 'in progress':
      return '#2563EB';
    case 'rejected':
      return '#DC2626';
    case 'urgent':
      return '#DC2626';
    default:
      return '#D97706'; // Amber for submitted, under review, assigned
  }
};

export const createStatusMarkerIcon = (status?: string, size: number = 32) => {
  const color = getStatusColor(status);
  const width = size;
  const height = Math.round(size * 1.25);

  const svg = `
    <div style="position: relative; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center;">
      <svg width="${width}" height="${height}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
        <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 15.5 42.5 17.1 43.8C17.6 44.2 18.4 44.2 18.9 43.8C20.5 42.5 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${color}"/>
        <circle cx="18" cy="17" r="7.5" fill="white"/>
        <circle cx="18" cy="17" r="4.5" fill="${color}"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-status-pin',
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 4],
  });
};

export const MapViewer: React.FC<Props> = ({
  singleLocation,
  multiPoints,
  height = '300px',
  interactive = true,
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      let centerLat = BENGALURU_CONFIG.center.lat;
      let centerLng = BENGALURU_CONFIG.center.lng;
      let zoom = BENGALURU_CONFIG.zoom.default;

      if (singleLocation && singleLocation.latitude && singleLocation.longitude) {
        centerLat = singleLocation.latitude;
        centerLng = singleLocation.longitude;
        zoom = 15;
      } else if (multiPoints && multiPoints.length > 0) {
        centerLat = multiPoints[0].latitude;
        centerLng = multiPoints[0].longitude;
        zoom = 12;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        attributionControl: true,
      }).setView([centerLat, centerLng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Render single location
      if (singleLocation && singleLocation.latitude && singleLocation.longitude) {
        const icon = createStatusMarkerIcon(singleLocation.status, 34);
        const marker = L.marker([singleLocation.latitude, singleLocation.longitude], {
          icon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; max-width: 240px; padding: 2px;">
            <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">
              ${singleLocation.trackingId ? `#${singleLocation.trackingId}` : 'Incident Location'}
            </div>
            <div style="font-weight: 600; color: #172B4D; margin: 3px 0;">${singleLocation.title}</div>
            ${
              singleLocation.locality
                ? `<div style="display: inline-block; padding: 1px 6px; background: #EFF6FF; color: #2563EB; font-size: 10px; font-weight: 600; border-radius: 4px; margin-bottom: 4px;">${singleLocation.locality}</div>`
                : ''
            }
            ${
              singleLocation.address
                ? `<div style="font-size: 11px; color: #64748b; line-height: 1.3;">${singleLocation.address}</div>`
                : ''
            }
          </div>
        `);
      }

      // Render multiple markers
      if (multiPoints && multiPoints.length > 0) {
        const group = L.featureGroup();
        multiPoints.forEach((pt) => {
          if (pt.latitude && pt.longitude) {
            const icon = createStatusMarkerIcon(pt.status, 30);
            const marker = L.marker([pt.latitude, pt.longitude], { icon });

            marker.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; max-width: 240px; padding: 2px;">
                <div style="font-size: 11px; font-weight: 700; color: #2563eb;">#${pt.tracking_id}</div>
                <div style="font-weight: 600; color: #172B4D; margin: 3px 0;">${pt.title}</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px;">
                  <span style="font-size: 10px; padding: 1px 6px; background: #F1F5F9; color: #475569; border-radius: 3px; font-weight: 600;">
                    ${pt.status}
                  </span>
                  ${
                    pt.locality
                      ? `<span style="font-size: 10px; padding: 1px 6px; background: #EFF6FF; color: #2563EB; border-radius: 3px; font-weight: 600;">${pt.locality}</span>`
                      : ''
                  }
                </div>
                ${pt.address ? `<div style="font-size: 11px; color: #64748b;">${pt.address}</div>` : ''}
              </div>
            `);

            if (onMarkerClick) {
              marker.on('click', () => onMarkerClick(pt.tracking_id));
            }

            group.addLayer(marker);
          }
        });
        group.addTo(map);

        if (multiPoints.length > 1) {
          try {
            map.fitBounds(group.getBounds().pad(0.15));
          } catch {
            // ignore empty bounds
          }
        }
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [singleLocation, multiPoints, interactive, onMarkerClick]);

  return (
    <div className="border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm relative z-0">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />
    </div>
  );
};
