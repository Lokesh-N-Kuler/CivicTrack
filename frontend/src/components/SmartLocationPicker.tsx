import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Search,
  MapPin,
  Navigation,
  RotateCcw,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import {
  BENGALURU_CONFIG,
  isInsideBengaluru,
  searchLocations,
  reverseGeocode,
  GeocodingResult,
} from '../services/geocoding';

export interface LocationSelection {
  address: string;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  geocodingId?: string;
  selectionMethod: 'search' | 'map_click' | 'marker_drag' | 'geolocation' | 'manual';
}

interface Props {
  initialLocation?: {
    address?: string;
    locality?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  onLocationChange: (loc: LocationSelection) => void;
  height?: string;
  required?: boolean;
}

// Custom crisp SVG Pin Icon to eliminate any missing png asset issues
const createCustomPinIcon = (isWarning: boolean = false) => {
  const pinColor = isWarning ? '#D97706' : '#17324D';
  const pulseColor = isWarning ? '#F59E0B' : '#2563EB';

  const svgHtml = `
    <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 15.5 42.5 17.1 43.8C17.6 44.2 18.4 44.2 18.9 43.8C20.5 42.5 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${pinColor}"/>
        <circle cx="18" cy="17" r="7" fill="white"/>
        <circle cx="18" cy="17" r="4.5" fill="${pulseColor}"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-civic-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
};

export const SmartLocationPicker: React.FC<Props> = ({
  initialLocation,
  onLocationChange,
  height = '380px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>(initialLocation?.address || '');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Selected state
  const [currentAddress, setCurrentAddress] = useState<string>(initialLocation?.address || '');
  const [currentLocality, setCurrentLocality] = useState<string>(initialLocation?.locality || '');
  const [latitude, setLatitude] = useState<number | null>(initialLocation?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLocation?.longitude || null);
  const [selectionMethod, setSelectionMethod] = useState<
    'search' | 'map_click' | 'marker_drag' | 'geolocation' | 'manual'
  >('search');
  const [geocodingId, setGeocodingId] = useState<string | undefined>(undefined);
  const [isOutsideBBMP, setIsOutsideBBMP] = useState<boolean>(false);

  // Search debouncing ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update selection notification callback
  const emitChange = useCallback(
    (
      addr: string,
      loc: string,
      lat: number | null,
      lng: number | null,
      method: 'search' | 'map_click' | 'marker_drag' | 'geolocation' | 'manual',
      geoId?: string
    ) => {
      setCurrentAddress(addr);
      setCurrentLocality(loc);
      setLatitude(lat);
      setLongitude(lng);
      setSelectionMethod(method);
      setGeocodingId(geoId);

      const outside = lat !== null && lng !== null ? !isInsideBengaluru(lat, lng) : false;
      setIsOutsideBBMP(outside);

      onLocationChange({
        address: addr,
        locality: loc,
        latitude: lat,
        longitude: lng,
        selectionMethod: method,
        geocodingId: geoId,
      });
    },
    [onLocationChange]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = initialLocation?.latitude || BENGALURU_CONFIG.center.lat;
      const initialLng = initialLocation?.longitude || BENGALURU_CONFIG.center.lng;
      const initialZoom = initialLocation?.latitude ? 16 : BENGALURU_CONFIG.zoom.default;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([initialLat, initialLng], initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create initial marker if coordinates provided
      if (initialLocation?.latitude && initialLocation?.longitude) {
        const marker = L.marker([initialLocation.latitude, initialLocation.longitude], {
          icon: createCustomPinIcon(!isInsideBengaluru(initialLocation.latitude, initialLocation.longitude)),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', async (e: any) => {
          const pos = e.target.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(6));
          const lng = parseFloat(pos.lng.toFixed(6));
          const result = await reverseGeocode(lat, lng);
          emitChange(result.address, result.locality, lat, lng, 'marker_drag', result.placeId);
        });

        markerRef.current = marker;
      }

      // Click on map to place/move marker and reverse geocode
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        const isOutside = !isInsideBengaluru(lat, lng);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.setIcon(createCustomPinIcon(isOutside));
        } else {
          const marker = L.marker([lat, lng], {
            icon: createCustomPinIcon(isOutside),
            draggable: true,
          }).addTo(map);

          marker.on('dragend', async (ev: any) => {
            const pos = ev.target.getLatLng();
            const nlat = parseFloat(pos.lat.toFixed(6));
            const nlng = parseFloat(pos.lng.toFixed(6));
            const res = await reverseGeocode(nlat, nlng);
            emitChange(res.address, res.locality, nlat, nlng, 'marker_drag', res.placeId);
          });

          markerRef.current = marker;
        }

        const result = await reverseGeocode(lat, lng);
        emitChange(result.address, result.locality, lat, lng, 'map_click', result.placeId);
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

  // Update marker & view when position changes
  const updateMapPosition = (lat: number, lng: number, zoomLevel: number = 16) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const isOutside = !isInsideBengaluru(lat, lng);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createCustomPinIcon(isOutside));
    } else {
      const marker = L.marker([lat, lng], {
        icon: createCustomPinIcon(isOutside),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', async (ev: any) => {
        const pos = ev.target.getLatLng();
        const nlat = parseFloat(pos.lat.toFixed(6));
        const nlng = parseFloat(pos.lng.toFixed(6));
        const res = await reverseGeocode(nlat, nlng);
        emitChange(res.address, res.locality, nlat, nlng, 'marker_drag', res.placeId);
      });

      markerRef.current = marker;
    }

    map.flyTo([lat, lng], zoomLevel, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  };

  // Debounced search query handler
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setGeoError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const results = await searchLocations(value, controller.signal);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching location suggestions:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 380);
  };

  // Select a suggestion
  const handleSelectSuggestion = (item: GeocodingResult) => {
    setSearchQuery(item.displayName);
    setShowSuggestions(false);
    updateMapPosition(item.latitude, item.longitude, 16);
    emitChange(
      item.displayName,
      item.locality,
      item.latitude,
      item.longitude,
      'search',
      item.placeId
    );
  };

  // Use Current Location (Geolocation API)
  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        updateMapPosition(lat, lng, 16);
        const result = await reverseGeocode(lat, lng);
        setSearchQuery(result.address);
        emitChange(
          result.address,
          result.locality,
          lat,
          lng,
          'geolocation',
          result.placeId
        );
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access or search an address manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or use the search bar.';
        }
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Recenter Map to Bengaluru City Center
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [BENGALURU_CONFIG.center.lat, BENGALURU_CONFIG.center.lng],
        BENGALURU_CONFIG.zoom.default,
        { duration: 1.0 }
      );
    }
  };

  // Clear selected location
  const handleClearLocation = () => {
    setSearchQuery('');
    setCurrentAddress('');
    setCurrentLocality('');
    setLatitude(null);
    setLongitude(null);
    setGeocodingId(undefined);
    setIsOutsideBBMP(false);
    setGeoError(null);

    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    onLocationChange({
      address: '',
      locality: '',
      latitude: null,
      longitude: null,
      selectionMethod: 'manual',
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Input Bar with Autocomplete */}
      <div ref={searchContainerRef} className="relative z-20">
        <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
          Search Location in Bengaluru
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Type address or locality (e.g., Indiranagar, 100 Feet Road, Koramangala)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172B4D] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#172B4D]"
              title="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-64 overflow-y-auto z-50 divide-y divide-[#F1F5F9]">
            <div className="px-3 py-1.5 bg-[#F8FAFC] text-[11px] font-medium text-[#64748B] flex items-center justify-between">
              <span>Matching Locations in Bengaluru</span>
              <span className="text-[10px] text-[#94A3B8]">{suggestions.length} results</span>
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={item.placeId || idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#EFF6FF] transition-colors flex items-start gap-2.5 group"
              >
                <MapPin className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#172B4D] truncate">
                    {item.locality || 'Bengaluru'}
                  </div>
                  <div className="text-[11px] text-[#64748B] line-clamp-1">
                    {item.displayName}
                  </div>
                </div>
                {!item.isWithinBengaluru && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded shrink-0">
                    Out of bounds
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#17324D] font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
            title="Detect GPS coordinates"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-[#2563EB]" />
            )}
            <span>Use My Current Location</span>
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#172B4D] rounded-md shadow-sm transition-all"
            title="Recenter to Bengaluru city center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bengaluru Center</span>
          </button>
        </div>

        {latitude !== null && longitude !== null && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Location</span>
          </button>
        )}
      </div>

      {/* Error / Warning Alert Messages */}
      {geoError && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {isOutsideBBMP && latitude !== null && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">BBMP Jurisdiction Warning:</span> Selected location appears to be outside the supported Bengaluru municipal service boundary (BBMP). Complaints outside jurisdiction may experience delayed routing.
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-[#E2E8F0] shadow-sm bg-[#F8FAFC]">
        <div
          ref={mapContainerRef}
          style={{ height }}
          className="w-full z-10"
        />

        {/* Map overlay helper pill */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <div className="px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-full shadow-sm text-[11px] font-medium text-[#17324D] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Click map or drag pin to fine-tune</span>
          </div>
        </div>
      </div>

      {/* Selected Location Summary Panel */}
      {latitude !== null && longitude !== null ? (
        <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#172B4D] flex items-center gap-2 flex-wrap">
                  <span>Selected Location</span>
                  {currentLocality && (
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[11px] font-semibold border border-[#DBEAFE]">
                      {currentLocality}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded text-[10px] font-medium uppercase tracking-wider">
                    {selectionMethod === 'search'
                      ? 'Search Selected'
                      : selectionMethod === 'map_click'
                      ? 'Map Click'
                      : selectionMethod === 'marker_drag'
                      ? 'Marker Drag'
                      : selectionMethod === 'geolocation'
                      ? 'GPS Geolocation'
                      : 'Manual'}
                  </span>
                </div>
                <div className="text-xs text-[#64748B] mt-0.5 break-words">
                  {currentAddress || 'Coordinates selected on map'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#64748B]">
            <div>
              <span className="text-[#94A3B8]">Latitude:</span>{' '}
              <span className="font-semibold text-[#172B4D]">{latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-[#94A3B8]">Longitude:</span>{' '}
              <span className="font-semibold text-[#172B4D]">{longitude.toFixed(6)}</span>
            </div>
            {geocodingId && (
              <div className="truncate max-w-[200px]">
                <span className="text-[#94A3B8]">OSM ID:</span> {geocodingId}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-lg text-center text-xs text-[#64748B]">
          <MapPin className="w-4 h-4 text-[#94A3B8] mx-auto mb-1" />
          <span>No location selected. Search an address above or click on the map to place a pin.</span>
        </div>
      )}
    </div>
  );
};

