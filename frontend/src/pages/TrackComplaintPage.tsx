import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintDetail } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { MapViewer } from '../components/MapViewer';
import { Timeline } from '../components/Timeline';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  ArrowRight,
  Shield,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const TrackComplaintPage: React.FC = () => {
  const [trackingInput, setTrackingInput] = useState('');
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingInput.trim().replace(/^#/, '');
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setComplaint(null);

    try {
      // Find complaint matching tracking id
      const res = await api.getComplaints({ search: query, page_size: 1 });
      if (res.items.length === 0) {
        setError(`No grievance found with tracking ID "${query}". Please check the ID and try again.`);
        return;
      }
      // Fetch full details
      const detail = await api.getComplaint(res.items[0].id);
      setComplaint(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to locate grievance.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine active step index in progress bar (0 to 3)
  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'Submitted to CivicTrack':
        return 0;
      case 'Under Review':
      case 'Authority Recommended':
      case 'Assigned':
        return 1;
      case 'In Progress':
      case 'Official Submission Confirmed':
        return 2;
      case 'Resolved':
        return 3;
      case 'Rejected':
        return -1;
      default:
        return 1;
    }
  };

  const steps = [
    { title: 'Registered', desc: 'Logged with GPS coordinates' },
    { title: 'Triage & Department', desc: 'Reviewed by maintenance dispatch' },
    { title: 'In Progress', desc: 'Ground crew active on site' },
    { title: 'Resolved', desc: 'Repaired and verified' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Track Grievance Status
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Enter your CivicTrack tracking number (e.g. <code>CT-2026-000001</code>) to view live field status.
        </p>
      </div>

      {/* Tracking Input Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter tracking ID (e.g., CT-2026-000001)..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#172B4D] placeholder-[#94A3B8] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Status</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Suggestions */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#64748B]">
          <span>Try demo IDs:</span>
          {['CT-2026-000001', 'CT-2026-000003', 'CT-2026-000005', 'CT-2026-000010'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTrackingInput(id);
              }}
              className="font-mono text-[#2563EB] hover:underline"
            >
              #{id}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {complaint && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-6 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-extrabold text-[#2563EB]">
                  #{complaint.tracking_id}
                </span>
                <StatusBadge status={complaint.status} size="sm" />
                <PriorityBadge priority={complaint.priority} size="sm" />
                {complaint.locality && (
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[11px] font-semibold border border-[#DBEAFE]">
                    {complaint.locality}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-[#172B4D] mt-2">{complaint.title}</h2>
            </div>

            <Link
              to={`/complaints/${complaint.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17324D] hover:bg-[#0F2133] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
            >
              <span>Full Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stepper Progress Bar */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">
              Resolution Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((st, idx) => {
                const currentIdx = getStepIndex(complaint.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div
                    key={st.title}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      isPassed
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        : isCurrent
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1E40AF]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                      <span>{st.title}</span>
                    </div>
                    <div className="text-[11px] opacity-80">{st.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Department Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#172B4D]">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span>Geotagged Incident Location</span>
              </div>
              <p className="text-[#64748B]">{complaint.address}</p>
              {complaint.latitude && complaint.longitude && (
                <div className="pt-2">
                  <MapViewer
                    singleLocation={{
                      latitude: complaint.latitude,
                      longitude: complaint.longitude,
                      title: complaint.title,
                      trackingId: complaint.tracking_id,
                      address: complaint.address,
                      locality: complaint.locality || 'Bengaluru',
                      status: complaint.status,
                    }}
                    height="160px"
                    interactive={false}
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#172B4D]">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Assigned Authority</span>
                </div>
                <div className="text-sm font-bold text-[#172B4D]">
                  {complaint.department?.name || 'Department Triage Pending'}
                </div>
                <p className="text-[11px] text-[#64748B]">
                  {complaint.department?.description ||
                    'Evaluating priority and routing to nearest ward engineering division.'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Logged on: {new Date(complaint.created_at).toLocaleString()}</span>
                <Link
                  to={`/complaints/${complaint.id}`}
                  className="font-bold text-[#2563EB] hover:underline"
                >
                  Add Follow-up &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {complaint.history && complaint.history.length > 0 && (
            <div className="pt-4 border-t border-[#F1F5F9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                Audit Timeline & Action History
              </h3>
              <Timeline history={complaint.history} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

