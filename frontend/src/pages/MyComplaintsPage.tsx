import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintListItem } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  ClipboardList,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

export const MyComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaints({
        page,
        page_size: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setComplaints(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            My Registered Grievances
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Track, review updates, and record external municipal reference numbers.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Grievance</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tracking ID, or street address..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#172B4D]"
            >
              <option value="">All Statuses</option>
              <option value="Submitted to CivicTrack">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#172B4D]"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#17324D] hover:bg-[#0F2133] text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Search
            </button>

            {(search || statusFilter || categoryFilter || priorityFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Complaints List / Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading grievances...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-3">
            <ClipboardList className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <div className="font-bold text-[#172B4D] text-sm">No grievances found</div>
            <p className="max-w-md mx-auto">
              No matching records for your current filters. Clear the search filters or file a new report.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#2563EB]">
                      #{c.tracking_id}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                    <PriorityBadge priority={c.priority} size="sm" />
                    {c.locality && (
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[10px] font-semibold border border-[#DBEAFE]">
                        {c.locality}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#172B4D] hover:text-[#2563EB] transition-colors">
                    <Link to={`/complaints/${c.id}`}>{c.title}</Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="truncate max-w-xs">{c.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{c.department_name || 'Routing...'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    View Status &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <div>
              Showing page <strong className="text-[#172B4D]">{page}</strong> of{' '}
              <strong className="text-[#172B4D]">{totalPages}</strong> ({total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-1.5 border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

