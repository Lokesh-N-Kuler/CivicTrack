import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Settings,
  MapPin,
  Clock,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sliders,
  Bell,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [slaHours, setSlaHours] = useState('24');
  const [minLat, setMinLat] = useState('12.75');
  const [maxLat, setMaxLat] = useState('13.25');
  const [minLng, setMinLng] = useState('77.40');
  const [maxLng, setMaxLng] = useState('77.85');
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all demo complaints and test records to the baseline demonstration dataset?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemoData();
      alert('Demo data successfully reset! Page will refresh.');
      window.location.reload();
    } catch (e: any) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE] mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Geospatial boundaries, SLA escalation rules, Nominatim geocoding parameters, and demo controls.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Configuration preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Geospatial Bounds */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172B4D]">
              Bengaluru Municipal Boundary (BBMP / Greater Bengaluru)
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Complaints pinned outside these bounding coordinates trigger an advisory boundary warning.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                Min Latitude
              </label>
              <input
                type="text"
                value={minLat}
                onChange={(e) => setMinLat(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                Max Latitude
              </label>
              <input
                type="text"
                value={maxLat}
                onChange={(e) => setMaxLat(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                Min Longitude
              </label>
              <input
                type="text"
                value={minLng}
                onChange={(e) => setMinLng(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                Max Longitude
              </label>
              <input
                type="text"
                value={maxLng}
                onChange={(e) => setMaxLng(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[#172B4D]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: SLA Escalation Rules */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172B4D]">
              SLA & Escalation Rules
            </h2>
          </div>

          <div className="max-w-xs text-xs space-y-1">
            <label className="block text-[11px] font-semibold text-[#172B4D]">
              Demo Escalation Inactive Threshold (Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
                className="w-32 px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono text-[#172B4D]"
              />
              <span className="text-xs text-[#64748B]">hours</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] pt-1">
              Grievances remaining in 'In Progress' or 'Submitted' longer than this duration receive an escalated alert tag.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#17324D] hover:bg-[#0F2133] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Section 3: Demonstration Data Reset */}
      <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold">Demonstration Reset Controls</h2>
        </div>
        <p className="text-xs text-[#64748B]">
          Reset all demo grievances and test records back to the baseline demonstration dataset (preserves administrator account).
        </p>
        <button
          type="button"
          onClick={handleResetDemoData}
          disabled={isResetting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isResetting ? 'Resetting Data...' : 'Reset Demonstration Data'}</span>
        </button>
      </div>
    </div>
  );
};

