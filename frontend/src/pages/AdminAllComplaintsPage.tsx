import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintListItem, Department } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  FileText,
  Search,
  Filter,
  Building2,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export const AdminAllComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaints({
        page,
        page_size: 15,
        search: search.trim() || undefined,
        department_id: departmentId ? parseInt(departmentId, 10) : undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setComplaints(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error('Error fetching admin complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, departmentId, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
            All Municipal Grievances
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Comprehensive triage database across all departments, wards, and severity levels.
          </p>
        </div>

        <Link
          to="/admin/map"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17324D] hover:bg-[#0F2133] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span>Open Geospatial Map View</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking ID, title, locality, or address..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#172B4D]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

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
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Filter
            </button>

            {(search || departmentId || statusFilter || priorityFilter) && (
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

      {/* Complaints Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading complaints database...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-2">
            <FileText className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <div className="font-bold text-[#172B4D]">No complaints match filter criteria</div>
            <p>Try resetting the search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Title & Locality</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      #{c.tracking_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172B4D] line-clamp-1">{c.title}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                        <span className="truncate max-w-xs">{c.address}</span>
                        {c.locality && (
                          <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded text-[9px] font-semibold">
                            {c.locality}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#172B4D] font-medium">
                      {c.department_name || 'Routing...'}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#17324D] hover:text-[#2563EB] font-bold rounded shadow-2xs transition-colors"
                      >
                        <span>Triage</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

