import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintDetail, ExternalSubmission } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { EscalationBanner } from '../components/EscalationBanner';
import { Timeline } from '../components/Timeline';
import { MapViewer } from '../components/MapViewer';
import { OfficialSummaryModal } from '../components/OfficialSummaryModal';
import {
  FileText,
  MapPin,
  Calendar,
  Send,
  Building,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Actions
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [followupText, setFollowupText] = useState('');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
  const [isSimulatingGov, setIsSimulatingGov] = useState(false);
  const [simulationBanner, setSimulationBanner] = useState<ExternalSubmission | null>(null);

  const fetchComplaint = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getComplaint(Number(id));
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve grievance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !followupText.trim()) return;

    setIsSubmittingFollowup(true);
    try {
      await api.addFollowup(complaint.id, followupText.trim());
      setFollowupText('');
      fetchComplaint();
    } catch (err: any) {
      alert(`Followup error: ${err.message}`);
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  const handleSimulateGovSubmission = async () => {
    if (!complaint) return;
    setIsSimulatingGov(true);
    try {
      const record = await api.simulateOfficialSubmission(complaint.id, complaint.department_id || undefined);
      setSimulationBanner(record);
      fetchComplaint();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulatingGov(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading grievance records...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to View Grievance</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {error || 'This grievance could not be found or you do not have permission to view it.'}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex text-xs font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg"
        >
          Return to My Grievances
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <Link to="/dashboard" className="text-blue-600 hover:underline">
              Grievances
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
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(complaint.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {complaint.address}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} size="lg" />
        </div>
      </div>

      {/* Escalation Warning (if demo timer exceeded) */}
      <EscalationBanner
        isEscalated={complaint.is_escalated}
        reason={complaint.escalation_reason}
        hoursInStatus={complaint.hours_in_status}
        recommendedAction={complaint.recommended_escalation_action}
      />

      {/* Prominent Simulated Notice if simulation was run */}
      {simulationBanner && (
        <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-xl text-xs space-y-1 text-teal-950">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>{simulationBanner.disclaimer}</span>
          </div>
          <p>
            Simulated official reference: <strong className="font-mono">{simulationBanner.official_reference_number}</strong>.
            This was created by the local training gateway. No external government agency was contacted.
          </p>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details, Photos, Followup, Official Bridging */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Department card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Grievance Details
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px] font-medium">Assigned Department</span>
                <span className="font-bold text-slate-800 text-sm">
                  {complaint.department?.name || 'Pending assignment'}
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Category: <span className="capitalize">{complaint.category.replace(/_/g, ' ')}</span>
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                <span className="text-blue-700 block text-[11px] font-medium">Routing Rationale</span>
                <p className="text-slate-700 text-xs mt-0.5 leading-snug">
                  {complaint.recommendation_reason || 'Automated routing based on grievance classification.'}
                </p>
              </div>
            </div>
          </div>

          {/* Photo Attachments Gallery */}
          {complaint.images && complaint.images.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Attached Photo Evidence ({complaint.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.map((img) => (
                  <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden group">
                    <img
                      src={img.url}
                      alt={img.original_filename}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-1.5 bg-slate-50 text-[10px] text-slate-500 truncate">
                      {img.original_filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Government Submission & Bridging Section */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Government Portal Bridging & Verification
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Transparent
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              CivicTrack formats your grievance for easy submission onto official municipal portals.
              Generate a clean copy-paste summary or simulate a test submission.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSummaryModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Official Portal Summary</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateGovSubmission}
                disabled={isSimulatingGov}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 px-4 py-2 rounded-lg transition-colors"
                title="Simulate dispatch without sending real citizen data"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{isSimulatingGov ? 'Processing...' : 'Test Simulated Gateway'}</span>
              </button>
            </div>

            {/* List of recorded external references */}
            {complaint.external_submissions && complaint.external_submissions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  External Submission History
                </span>
                <div className="space-y-2">
                  {complaint.external_submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            #{sub.official_reference_number}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                            {sub.submission_type.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              sub.is_verified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.is_verified ? 'Verified' : 'Unverified reference'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Authority: {sub.authority_name || 'External'} &bull;{' '}
                          {new Date(sub.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-slate-600 italic">
                        {sub.disclaimer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Follow-up Input */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Add Citizen Follow-up Information
            </h3>
            <p className="text-xs text-slate-500">
              Provide additional context or field updates directly to the assigned department.
            </p>

            <form onSubmit={handleFollowupSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                placeholder="e.g. Water flow has increased since yesterday morning..."
                className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingFollowup || !followupText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingFollowup ? 'Posting...' : 'Post Follow-up'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Map, Timeline */}
        <div className="space-y-6">
          {/* Map Location */}
          {complaint.latitude && complaint.longitude && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Location Map
                </span>
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

          {/* Chronological Status Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resolution Timeline
              </h3>
              <span className="text-[11px] text-slate-400">
                {complaint.history.length} events
              </span>
            </div>

            <Timeline history={complaint.history} />
          </div>
        </div>
      </div>

      {/* Official Summary Modal */}
      <OfficialSummaryModal
        complaint={complaint}
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onReferenceRecorded={fetchComplaint}
      />
    </div>
  );
};
