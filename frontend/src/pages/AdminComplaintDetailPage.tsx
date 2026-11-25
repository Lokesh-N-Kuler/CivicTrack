import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintDetail, Department, ComplaintStatus, ComplaintPriority } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { EscalationBanner } from '../components/EscalationBanner';
import { Timeline } from '../components/Timeline';
import { MapViewer } from '../components/MapViewer';
import {
  Shield,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Save,
  MessageSquare,
  Copy,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';

const VALID_STATUSES: ComplaintStatus[] = [
  'Submitted to CivicTrack',
  'Under Review',
  'Authority Recommended',
  'Awaiting Official Submission',
  'Official Submission Confirmed',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
  'Follow-up Required',
];

export const AdminComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Administrative form state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');

  const fetchComplaintAndDepts = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [complaintData, deptsData] = await Promise.all([
        api.getComplaint(Number(id)),
        api.getDepartments(true),
      ]);
      setComplaint(complaintData);
      setDepartments(deptsData);

      setSelectedStatus(complaintData.status);
      setSelectedDeptId(complaintData.department_id || undefined);
      setSelectedPriority(complaintData.priority);
      setAdminNotes(complaintData.admin_notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintAndDepts();
  }, [id]);

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const updated = await api.updateComplaintAdmin(complaint.id, {
        status: selectedStatus !== complaint.status ? selectedStatus : undefined,
        department_id: selectedDeptId !== complaint.department_id ? selectedDeptId : undefined,
        priority: selectedPriority !== complaint.priority ? selectedPriority : undefined,
        admin_notes: adminNotes,
        status_note: statusNote.trim() || undefined,
      });

      setComplaint(updated);
      setStatusNote('');
      setSuccessMessage('Operational changes and audit history recorded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update administrative records.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading grievance triage details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Record</h2>
        <p className="text-xs text-slate-600">{error || 'Record does not exist.'}</p>
        <Link to="/admin" className="text-xs font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg">
          Back to Admin Console
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <Link to="/admin" className="text-blue-600 hover:underline">
              Admin Console
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-mono font-bold text-slate-700">#{complaint.tracking_id}</span>
            {complaint.is_demo && (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                DEMO DATA
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{complaint.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Citizen: {complaint.citizen_name} ({complaint.citizen_email})
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(complaint.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} size="lg" />
        </div>
      </div>

      {/* Escalation Warning */}
      <EscalationBanner
        isEscalated={complaint.is_escalated}
        reason={complaint.escalation_reason}
        hoursInStatus={complaint.hours_in_status}
        recommendedAction={complaint.recommended_escalation_action}
      />

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Form, Duplicate suggestions, Photos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Administrative Action Control Panel */}
          <form
            onSubmit={handleAdminUpdate}
            className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Triage Actions & Department Reassignment
                </h3>
              </div>
              <span className="text-xs text-slate-400">Recorded in Audit Trail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Transition */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {VALID_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Correction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Department
                </label>
                <select
                  value={selectedDeptId || ''}
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Update */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjust Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Note attached to this change */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Field Note for this change (visible to citizen)
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched asphalt hot-mix team; scheduled for 2:00 PM."
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Internal Admin Notes (Staff eyes only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Administrative Notes (Private - Staff Only)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal dispatch notes, contractor vendor contract ID, etc."
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save & Record Audit'}</span>
              </button>
            </div>
          </form>

          {/* Possible Duplicate Complaints (Human Review Panel) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Possible Duplicate Complaints (Human Review)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Matches based on category, coordinates & text
              </span>
            </div>

            {complaint.possible_duplicates && complaint.possible_duplicates.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600">
                  The following grievances may refer to the same incident. Per CivicTrack policy, duplicate matches are surfaced for human verification; complaints are never automatically purged or merged.
                </p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {complaint.possible_duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-3 bg-slate-50/70 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">#{dup.tracking_id}</span>
                          <span className="font-semibold text-slate-800">{dup.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Status: <strong>{dup.status}</strong></span>
                          <span>Score: <strong>{(dup.similarity_score * 100).toFixed(0)}% match</strong></span>
                          {dup.distance_km !== null && dup.distance_km !== undefined && (
                            <span>Proximity: <strong>{dup.distance_km} km away</strong></span>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/admin/complaints/${dup.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 self-start sm:self-center"
                      >
                        <span>Inspect Match</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                No duplicate or clustered complaints detected in proximity to this location.
              </p>
            )}
          </div>

          {/* Description & Photo Attachments */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Citizen Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>

            {complaint.images && complaint.images.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-600 block mb-2">
                  Photo Evidence ({complaint.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.images.map((img) => (
                    <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <img src={img.url} alt={img.original_filename} className="w-full h-32 object-cover" />
                      <div className="p-1 bg-slate-50 text-[10px] text-slate-500 truncate">
                        {img.original_filename}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location Map & Timeline */}
        <div className="space-y-6">
          {/* Map */}
          {complaint.latitude && complaint.longitude && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Incident GPS Pin</span>
                <span className="font-mono text-slate-500">
                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                </span>
              </div>
              <MapViewer
                singleLocation={{
                  latitude: complaint.latitude,
                  longitude: complaint.longitude,
                  title: complaint.title,
                  trackingId: complaint.tracking_id,
                  address: complaint.address,
                }}
                height="220px"
              />
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Audit Timeline ({complaint.history.length})
              </h3>
            </div>
            <Timeline history={complaint.history} />
          </div>
        </div>
      </div>
    </div>
  );
};
