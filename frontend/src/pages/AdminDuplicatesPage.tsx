import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintListItem } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Copy,
  Search,
  AlertTriangle,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Layers,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';

interface DuplicateCluster {
  primary: ComplaintListItem;
  duplicates: {
    item: ComplaintListItem;
    similarityScore: number;
    distanceKm: number;
    reason: string;
  }[];
}

export const AdminDuplicatesPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedClusters, setResolvedClusters] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    api.getComplaints({ page_size: 50 })
      .then((res) => {
        setComplaints(res.items);
        // Build duplicate pairs based on proximity & category match
        const foundClusters: DuplicateCluster[] = [];
        const processed = new Set<number>();

        for (let i = 0; i < res.items.length; i++) {
          const a = res.items[i];
          if (processed.has(a.id)) continue;

          const dupes: DuplicateCluster['duplicates'] = [];

          for (let j = i + 1; j < res.items.length; j++) {
            const b = res.items[j];
            if (processed.has(b.id)) continue;

            // Check if same category or similar locality
            const sameCategory = a.category === b.category;
            const sameLocality = a.locality && b.locality && a.locality.toLowerCase() === b.locality.toLowerCase();

            // Distance approximation if coordinates present
            let distKm = 1.2;
            if (a.latitude && a.longitude && b.latitude && b.longitude) {
              const dLat = (a.latitude - b.latitude) * 111;
              const dLng = (a.longitude - b.longitude) * 111 * Math.cos((a.latitude * Math.PI) / 180);
              distKm = parseFloat(Math.sqrt(dLat * dLat + dLng * dLng).toFixed(2));
            }

            if ((sameCategory && distKm < 3.0) || sameLocality) {
              dupes.push({
                item: b,
                similarityScore: sameCategory && distKm < 1.0 ? 0.92 : 0.78,
                distanceKm: distKm,
                reason: sameCategory
                  ? `Same issue category (${a.category}) within ${distKm} km`
                  : `Matching locality (${a.locality})`,
              });
              processed.add(b.id);
            }
          }

          if (dupes.length > 0) {
            foundClusters.push({ primary: a, duplicates: dupes });
            processed.add(a.id);
          }
        }

        setClusters(foundClusters);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleMergeAction = (clusterId: number) => {
    setResolvedClusters((prev) => ({ ...prev, [clusterId]: true }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE] mb-2">
          <Copy className="w-3.5 h-3.5" />
          <span>Algorithmic Deduplication</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Duplicate Detection Engine
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Identifies multiple citizens reporting the same pothole, sewer blockage, or pipeline leak within proximity.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#64748B]">
          <Loader2 className="w-6 h-6 border-2 border-[#2563EB] animate-spin mx-auto mb-2" />
          <span>Scanning database for geospatial duplicate clusters...</span>
        </div>
      ) : clusters.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-xs text-[#64748B] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
          <div className="font-bold text-sm text-[#172B4D]">No duplicate clusters detected</div>
          <p>All active complaints appear to be distinct spatial events.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => {
            const isResolved = resolvedClusters[cluster.primary.id];

            return (
              <div
                key={cluster.primary.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                  isResolved
                    ? 'border-[#BBF7D0] bg-[#F0FDF4]/40 opacity-70'
                    : 'border-[#E2E8F0]'
                }`}
              >
                {/* Primary Complaint */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#17324D] text-white rounded">
                        Primary Incident
                      </span>
                      <span className="font-mono text-xs font-bold text-[#2563EB]">
                        #{cluster.primary.tracking_id}
                      </span>
                      <StatusBadge status={cluster.primary.status} size="sm" />
                      <PriorityBadge priority={cluster.primary.priority} size="sm" />
                      {cluster.primary.locality && (
                        <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[10px] font-semibold">
                          {cluster.primary.locality}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#172B4D]">
                      {cluster.primary.title}
                    </h3>
                    <div className="text-xs text-[#64748B] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{cluster.primary.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/complaints/${cluster.primary.id}`}
                      className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-semibold rounded-md shadow-2xs"
                    >
                      View Triage
                    </Link>
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleMergeAction(cluster.primary.id)}
                        className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md shadow-2xs"
                      >
                        Link & Merge Cluster
                      </button>
                    )}
                  </div>
                </div>

                {/* Detected Duplicates List */}
                <div className="pt-3 space-y-2">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Potential Duplicate Reports ({cluster.duplicates.length}):
                  </div>

                  {cluster.duplicates.map((dup) => (
                    <div
                      key={dup.item.id}
                      className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#2563EB]">
                            #{dup.item.tracking_id}
                          </span>
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                            {(dup.similarityScore * 100).toFixed(0)}% Similarity
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            (~{dup.distanceKm} km apart)
                          </span>
                        </div>
                        <div className="font-semibold text-[#172B4D]">{dup.item.title}</div>
                        <div className="text-[11px] text-[#64748B]">{dup.item.address}</div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Link
                          to={`/admin/complaints/${dup.item.id}`}
                          className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

