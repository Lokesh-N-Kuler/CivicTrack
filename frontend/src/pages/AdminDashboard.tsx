import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ComplaintListItem } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Search,
  Filter,
  BarChart3,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  Shield,
  Layers
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
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
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isDemoFilter, setIsDemoFilter] = useState<string>('');

  // Overview metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
  });

  const fetchAnalyticsOverview = async () => {
    try {
      const data = await api.getAnalytics();
      setMetrics({
        total: data.total_complaints,
        open: data.open_complaints,
        inProgress: data.in_progress_complaints,
        escalated: data.escalated_count,
        resolved: data.resolved_complaints,
      });
    } catch (e) {
      console.error(e);
    }
  };

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
        department_id: departmentFilter ? Number(departmentFilter) : undefined,
        is_demo: isDemoFilter === 'true' ? true : isDemoFilter === 'false' ? false : undefined,
      });
      setComplaints(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsOverview();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, categoryFilter, priorityFilter, departmentFilter, isDemoFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Console Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
              Administrator Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Grievance Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review triage recommendations, assign departments, manage status transitions, and detect duplicates.
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Analytics</span>
          </Link>
          <Link
            to="/admin/authorities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Authorities</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Grievances</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.total}</div>
          <span className="text-[11px] text-slate-400">All registered</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-blue-600 block mb-1">Pending Triage</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">{metrics.open}</div>
          <span className="text-[11px] text-blue-600/80">Submitted / Review</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-600 block mb-1">In Progress</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">{metrics.inProgress}</div>
          <span className="text-[11px] text-amber-600/80">Field teams dispatched</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-rose-600 block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Demo Escalated
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-900">{metrics.escalated}</div>
          <span className="text-[11px] text-rose-600/80">Overdue SLA rules</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 block mb-1">Resolved</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{metrics.resolved}</div>
          <span className="text-[11px] text-emerald-600/80">Closed successfully</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, keyword, address, citizen name..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            Search Records
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Submitted to CivicTrack">Submitted to CivicTrack</option>
            <option value="Under Review">Under Review</option>
            <option value="Authority Recommended">Authority Recommended</option>
            <option value="Awaiting Official Submission">Awaiting Official Submission</option>
            <option value="Official Submission Confirmed">Official Submission Confirmed</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
          >
            <option value="">All Departments</option>
            <option value="1">Road Maintenance Department</option>
            <option value="2">Waste Management Department</option>
            <option value="3">Water Supply Department</option>
            <option value="4">Drainage and Sewage Department</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={isDemoFilter}
            onChange={(e) => {
              setIsDemoFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
          >
            <option value="">All Data Types</option>
            <option value="true">Demo Data Only</option>
            <option value="false">Live User Data Only</option>
          </select>

          {(statusFilter || departmentFilter || priorityFilter || isDemoFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setDepartmentFilter('');
                setPriorityFilter('');
                setIsDemoFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-blue-600 hover:underline font-medium text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Admin Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading administrative records...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No grievance records match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Tracking ID & Title</th>
                  <th className="py-3 px-4">Department & Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status & Escalation</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {c.tracking_id}
                        </span>
                        {c.is_demo && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {c.title}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{c.address}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        {c.department_name || (
                          <span className="text-amber-600 italic">Unassigned</span>
                        )}
                      </div>
                      <div className="text-slate-500 capitalize text-[11px]">
                        {c.category.replace(/_/g, ' ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={c.status} size="sm" />
                        {c.is_escalated && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Overdue Review ({c.hours_in_status}h)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                      >
                        <span>Manage Triage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({total} grievances)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
