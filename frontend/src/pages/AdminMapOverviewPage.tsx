import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../services/api';
import { GeoPoint, Department } from '../services/types';
import { BENGALURU_CONFIG } from '../services/geocoding';
import { getStatusColor, createStatusMarkerIcon } from '../components/MapViewer';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  MapPin,
  Search,
  Filter,
  Layers,
  RotateCcw,
  Maximize2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  Compass,
} from 'lucide-react';

export const AdminMapOverviewPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: number]: L.Marker }>({});
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [activePointId, setActivePointId] = useState<number | null>(null);

  // Fetch points from analytics & departments
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([api.getAnalytics(), api.getDepartments()])
      .then(([analytics, depts]) => {
        if (!active) return;
        setPoints(analytics.geo_distribution || []);
        setDepartments(depts);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load geotagged complaints.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filtered complaints
  const filteredPoints = points.filter((pt) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = pt.tracking_id.toLowerCase().includes(q);
      const matchTitle = pt.title.toLowerCase().includes(q);
      const matchLoc = pt.locality?.toLowerCase().includes(q);
      const matchAddr = pt.address?.toLowerCase().includes(q);
      if (!matchTrack && !matchTitle && !matchLoc && !matchAddr) return false;
    }
    if (selectedDept !== 'all' && pt.department_name !== selectedDept) {
      return false;
    }
    if (selectedStatus !== 'all' && pt.status !== selectedStatus) {
      return false;
    }
    if (selectedPriority !== 'all' && pt.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(
        [BENGALURU_CONFIG.center.lat, BENGALURU_CONFIG.center.lng],
        BENGALURU_CONFIG.zoom.default
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const featureGroup = L.featureGroup().addTo(map);
      featureGroupRef.current = featureGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        featureGroupRef.current = null;
      }
    };
  }, []);

  // Render markers whenever filteredPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !featureGroupRef.current) return;

    const group = featureGroupRef.current;
    group.clearLayers();
    markersRef.current = {};

    filteredPoints.forEach((pt) => {
      if (!pt.latitude || !pt.longitude) return;

      const icon = createStatusMarkerIcon(pt.status, 34);
      const marker = L.marker([pt.latitude, pt.longitude], { icon });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'inherit';
      popupContent.style.padding = '4px';
      popupContent.style.maxWidth = '260px';
      popupContent.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: #2563EB;">#${pt.tracking_id}</div>
        <div style="font-size: 13px; font-weight: 700; color: #172B4D; margin: 4px 0 6px 0; line-height: 1.3;">
          ${pt.title}
        </div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
          <span style="font-size: 10px; padding: 2px 6px; background: #F1F5F9; color: #334155; border-radius: 4px; font-weight: 600;">
            ${pt.status}
          </span>
          ${
            pt.locality
              ? `<span style="font-size: 10px; padding: 2px 6px; background: #EFF6FF; color: #2563EB; border-radius: 4px; font-weight: 600; border: 1px solid #DBEAFE;">${pt.locality}</span>`
              : ''
          }
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 8px; line-height: 1.3;">
          ${pt.address || 'Bengaluru'}
        </div>
        <a href="/admin/complaints/${pt.id}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #17324D; color: #FFFFFF; font-size: 11px; font-weight: 600; border-radius: 6px; text-decoration: none;">
          <span>Open Triage Record &rarr;</span>
        </a>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setActivePointId(pt.id);
      });

      group.addLayer(marker);
      markersRef.current[pt.id] = marker;
    });

    if (filteredPoints.length > 1) {
      try {
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.12));
      } catch {
        // ignore bounds issue on single point
      }
    } else if (filteredPoints.length === 1) {
      mapInstanceRef.current.setView([filteredPoints[0].latitude, filteredPoints[0].longitude], 15);
    }
  }, [filteredPoints]);

  // Click on side list item -> Fly to marker & open popup
  const handleSelectPoint = (pt: GeoPoint) => {
    setActivePointId(pt.id);
    if (!mapInstanceRef.current || !pt.latitude || !pt.longitude) return;

    mapInstanceRef.current.flyTo([pt.latitude, pt.longitude], 16, {
      duration: 1.0,
      easeLinearity: 0.25,
    });

    const marker = markersRef.current[pt.id];
    if (marker) {
      marker.openPopup();
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || !featureGroupRef.current) return;
    try {
      const bounds = featureGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.15));
      }
    } catch {
      // ignore
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [BENGALURU_CONFIG.center.lat, BENGALURU_CONFIG.center.lng],
        BENGALURU_CONFIG.zoom.default,
        { duration: 1.0 }
      );
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setActivePointId(null);
  };

  // Stats calculation
  const totalGeotagged = points.length;
  const inProgressCount = points.filter((p) => p.status === 'In Progress').length;
  const resolvedCount = points.filter((p) => p.status === 'Resolved').length;
  const criticalCount = points.filter((p) => p.priority === 'urgent' || p.priority === 'high').length;

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)]">
      {/* Top Map Control Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#17324D] text-white flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#172B4D] leading-tight">
                Bengaluru Municipal Incident Map
              </h1>
              <p className="text-xs text-[#64748B]">
                Interactive geospatial grievance tracker across BBMP zones and wards.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#172B4D]">
              <span className="text-[#64748B]">Geotagged:</span>{' '}
              <span className="font-bold">{totalGeotagged}</span>
            </div>
            <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              <span className="text-blue-600">In Progress:</span>{' '}
              <span className="font-bold">{inProgressCount}</span>
            </div>
            <div className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-md text-green-800">
              <span className="text-green-600">Resolved:</span>{' '}
              <span className="font-bold">{resolvedCount}</span>
            </div>
            <div className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-md text-red-800">
              <span className="text-red-600">High / Urgent:</span>{' '}
              <span className="font-bold">{criticalCount}</span>
            </div>
          </div>

          {/* Map Zoom / View Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFitAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-semibold rounded-md shadow-xs transition-colors"
              title="Fit all markers in view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Fit Bounds</span>
            </button>
            <button
              type="button"
              onClick={handleRecenter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-semibold rounded-md shadow-xs transition-colors"
              title="Recenter to central Bengaluru"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Bengaluru Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map + Sidebar Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Filter and Incident List Sidebar (380px) */}
        <div className="w-full md:w-96 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 z-20 shadow-sm">
          {/* Search & Filters Controls */}
          <div className="p-3.5 border-b border-[#E2E8F0] space-y-2.5 bg-[#F8FAFC]">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracking ID, locality, title..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#172B4D] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#172B4D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] rounded text-[#172B4D] text-xs"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] rounded text-[#172B4D] text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="Submitted to CivicTrack">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Active Filters Pill & Clear Action */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-[#64748B] font-medium">
                Showing <strong className="text-[#172B4D]">{filteredPoints.length}</strong> of{' '}
                {points.length} incidents
              </span>
              {(searchQuery || selectedDept !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Incident List Scrollview */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2563EB] mb-2" />
                <span>Loading geotagged complaints...</span>
              </div>
            ) : filteredPoints.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] space-y-2">
                <MapPin className="w-6 h-6 text-[#94A3B8] mx-auto" />
                <div className="font-semibold text-[#172B4D]">No matching incidents found</div>
                <p className="text-[11px]">Try adjusting your search query or department filters.</p>
              </div>
            ) : (
              filteredPoints.map((pt) => {
                const isActive = activePointId === pt.id;
                const statusColor = getStatusColor(pt.status);

                return (
                  <div
                    key={pt.id}
                    onClick={() => handleSelectPoint(pt)}
                    className={`p-3 cursor-pointer transition-all hover:bg-[#F8FAFC] ${
                      isActive ? 'bg-[#EFF6FF] border-l-4 border-l-[#2563EB]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: statusColor }}
                        />
                        <span className="font-mono text-xs font-bold text-[#2563EB]">
                          #{pt.tracking_id}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {pt.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#172B4D] mt-1.5 line-clamp-1">
                      {pt.title}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                      <span className="truncate">{pt.address || 'Bengaluru'}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#F1F5F9] text-[10px]">
                      {pt.locality ? (
                        <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded font-semibold border border-[#DBEAFE]">
                          {pt.locality}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Bengaluru</span>
                      )}
                      <Link
                        to={`/admin/complaints/${pt.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#17324D] hover:text-[#2563EB] font-semibold"
                      >
                        <span>Triage</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Map Canvas Area */}
        <div className="flex-1 relative h-full">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Map Legend (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] p-3 rounded-lg shadow-md text-xs space-y-2 pointer-events-auto">
            <div className="font-bold text-[#172B4D] text-[11px] uppercase tracking-wider">
              Status Color Key
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16A34A] shrink-0" />
                <span className="text-[#172B4D]">Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2563EB] shrink-0" />
                <span className="text-[#172B4D]">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#D97706] shrink-0" />
                <span className="text-[#172B4D]">Under Review / Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#DC2626] shrink-0" />
                <span className="text-[#172B4D]">Urgent / Critical / Rejected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

