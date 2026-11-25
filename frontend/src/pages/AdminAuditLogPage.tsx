import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AuditLogItem } from '../services/types';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs(page, 20, actionFilter || undefined);
      setLogs(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / 20) || 1;

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE_COMPLAINT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE_COMPLAINT_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGIN_SUCCESS':
      case 'REGISTER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOGIN_FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'RESET_DEMO_DATA':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin" className="text-xs text-blue-600 hover:underline">
              Admin Console
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs text-slate-600 font-medium">Compliance Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Governance & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable system audit logs tracking complaint modifications, security events, and triage decisions.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg p-2 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="">All Actions</option>
            <option value="CREATE_COMPLAINT">CREATE_COMPLAINT</option>
            <option value="UPDATE_COMPLAINT_ADMIN">UPDATE_COMPLAINT_ADMIN</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="REGISTER">REGISTER</option>
            <option value="RESET_DEMO_DATA">RESET_DEMO_DATA</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading audit log records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Audit Details</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-sans text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-sans text-xs">
                      {log.user_email || <span className="text-slate-400 italic">System Process</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="text-blue-600 ml-1">#{log.resource_id}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-sans text-xs max-w-sm truncate">
                      {log.details || '-'}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 text-xs">
                      {log.ip_address || '127.0.0.1'}
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
              Showing page {page} of {totalPages} ({total} entries)
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
