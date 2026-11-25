import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComplaintDetail, Authority } from '../services/types';
import { Copy, Check, Download, ExternalLink, ShieldAlert, X, FileText } from 'lucide-react';

interface Props {
  complaint: ComplaintDetail;
  isOpen: boolean;
  onClose: () => void;
  onReferenceRecorded?: () => void;
}

export const OfficialSummaryModal: React.FC<Props> = ({
  complaint,
  isOpen,
  onClose,
  onReferenceRecorded,
}) => {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<{ plain_text: string; markdown: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referenceInput, setReferenceInput] = useState('');
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);
  const [refSuccessMessage, setRefSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getAuthorities(complaint.department_id || undefined, complaint.category)
        .then((authList) => {
          setAuthorities(authList);
          if (authList.length > 0) {
            setSelectedAuthorityId(authList[0].id);
          }
        })
        .catch(console.error);

      api.getOfficialSummary(complaint.id)
        .then(setSummary)
        .catch(console.error);
    }
  }, [isOpen, complaint.id, complaint.department_id, complaint.category]);

  const handleAuthorityChange = (authId: number) => {
    setSelectedAuthorityId(authId);
    api.getOfficialSummary(complaint.id, authId)
      .then(setSummary)
      .catch(console.error);
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.plain_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary.plain_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CivicTrack_${complaint.tracking_id}_OfficialSummary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;

    setIsSubmittingRef(true);
    try {
      await api.recordOfficialSubmission(complaint.id, {
        official_reference_number: referenceInput.trim(),
        authority_id: selectedAuthorityId,
      });
      setRefSuccessMessage('Official reference recorded! It is marked as Unverified until confirmed by authorities.');
      setReferenceInput('');
      if (onReferenceRecorded) onReferenceRecorded();
    } catch (err: any) {
      alert(`Failed to save reference: ${err.message}`);
    } finally {
      setIsSubmittingRef(false);
    }
  };

  if (!isOpen) return null;

  const currentAuthority = authorities.find((a) => a.id === selectedAuthorityId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                Official Portal Submission Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Generate formatted summary & submit to verified municipal channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Transparent Boundary Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">CivicTrack Routing Protocol:</span>
              <p>
                CivicTrack does not automatically scrape or secretly file complaints to external government portals.
                Copy this pre-formatted summary, open the authority's verified portal in a new tab, paste the grievance,
                and return to record your official receipt number below.
              </p>
            </div>
          </div>

          {/* Authority Selection */}
          {authorities.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Authority / Department Directory:
              </label>
              <select
                value={selectedAuthorityId}
                onChange={(e) => handleAuthorityChange(Number(e.target.value))}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.jurisdiction}) — {a.is_verified ? 'Verified' : 'Demo Directory Entry'}
                  </option>
                ))}
              </select>

              {currentAuthority && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500">Official Portal: </span>
                    {currentAuthority.official_portal_url ? (
                      <span className="font-mono text-blue-700">{currentAuthority.official_portal_url}</span>
                    ) : (
                      <span className="italic text-slate-400">Not configured / Unverified</span>
                    )}
                  </div>
                  {currentAuthority.official_portal_url && (
                    <a
                      href={currentAuthority.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      Open Portal in New Tab
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Copyable Summary Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Pre-formatted Grievance Summary:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={summary?.plain_text || 'Loading formatted grievance summary...'}
              rows={8}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Record Official Reference Number */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Record Official External Reference
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              After submitting on the government portal, enter the reference/acknowledgment number you received.
            </p>

            {refSuccessMessage ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{refSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleRecordReference} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. GOV-2026-887410"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingRef || !referenceInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSubmittingRef ? 'Saving...' : 'Record Reference'}
                </button>
              </form>
            )}
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Note: Citizen-recorded numbers are cataloged as "Unverified" pending review.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-700 px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
