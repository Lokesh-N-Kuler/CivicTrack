import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { ComplaintListItem } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Search,
  Bell,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    let active = true;

    // Fetch profile stats
    api.getProfile()
      .then((data) => {
        if (!active) return;
        setStats({
          total: data.stats.total_complaints,
          open: data.stats.open_complaints,
          inProgress: data.stats.in_progress_complaints,
          resolved: data.stats.resolved_complaints,
        });
      })
      .catch((err) => console.error('Failed to load profile stats:', err));

    // Fetch recent complaints
    api.getComplaints({ page: 1, page_size: 6 })
      .then((res) => {
        if (!active) return;
        setComplaints(res.items);
      })
      .catch((err) => console.error('Failed to load complaints:', err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const submittedCount = stats.open;
  const inProgressCount = stats.inProgress;
  const resolvedCount = stats.resolved;
  const totalCount = stats.total;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Personalized Greeting & Primary CTA Hero */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE]">
            <MapPin className="w-3.5 h-3.5" />
            <span>Bengaluru Civic Services (BBMP / BWSSB / BESCOM)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            {getGreeting()}, {user?.full_name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
            Welcome to CivicTrack. Report potholes, drainage overflow, water leakage, or garbage accumulation and monitor live field dispatch updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/track"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Search className="w-4 h-4 text-[#2563EB]" />
            <span>Track Grievance</span>
          </Link>

          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-xs transition-all hover:shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a Civic Issue</span>
          </Link>
        </div>
      </div>

      {/* 2. Four Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-[#17324D]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#172B4D]">{totalCount}</div>
          <div className="text-[11px] text-[#64748B]">Registered grievances on file</div>
        </div>

        {/* Card 2: Submitted */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Submitted</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706]">{submittedCount}</div>
          <div className="text-[11px] text-[#64748B]">Awaiting field crew triage</div>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2563EB]">{inProgressCount}</div>
          <div className="text-[11px] text-[#64748B]">Active ground repair work</div>
        </div>

        {/* Card 4: Resolved */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#16A34A]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#16A34A]">{resolvedCount}</div>
          <div className="text-[11px] text-[#64748B]">Successfully completed repairs</div>
        </div>
      </div>

      {/* 3. Main Grid: Recent Complaints + Activity Timeline & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Complaints Table / Cards */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172B4D]">Recent Grievances</h2>
              <p className="text-xs text-[#64748B]">Your latest logged issues and resolution progress</p>
            </div>
            <Link
              to="/complaints"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading your complaints...</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] space-y-3">
                <FileText className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <div className="font-semibold text-[#172B4D]">No complaints registered yet</div>
                <p className="text-[#64748B] max-w-sm mx-auto">
                  Have you noticed a pothole, broken pipeline, or overflowing bin? Click below to file your first civic report.
                </p>
                <Link
                  to="/complaints/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report a Problem</span>
                </Link>
              </div>
            ) : (
              complaints.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="p-4 hover:bg-[#F8FAFC] transition-colors block group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#2563EB] group-hover:underline">
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

                      <h3 className="text-sm font-bold text-[#172B4D] mt-1.5 line-clamp-1 group-hover:text-[#2563EB] transition-colors">
                        {c.title}
                      </h3>

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[#64748B] flex-wrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="truncate max-w-[200px]">{c.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{c.department_name || 'Routing...'}</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Activity Timeline & Notifications */}
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B4D]">Recent Activity Timeline</h2>
              <span className="text-[11px] text-[#64748B]">Live Updates</span>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#E2E8F0]">
              {complaints.slice(0, 4).map((c, idx) => (
                <div key={c.id || idx} className="relative flex items-start gap-3 pl-7">
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-[#2563EB] ring-4 ring-white" />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-bold text-[#172B4D]">
                      #{c.tracking_id} updated
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-1">
                      Status moved to <strong className="text-[#172B4D]">{c.status}</strong>
                    </p>
                    <span className="text-[10px] text-[#94A3B8]">
                      {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Widget */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#172B4D]">Notifications</h2>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#64748B]">
                  No new notifications.
                </div>
              ) : (
                notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172B4D]">{n.title}</span>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] text-[#2563EB] hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B]">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/notifications"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                View all notifications &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
