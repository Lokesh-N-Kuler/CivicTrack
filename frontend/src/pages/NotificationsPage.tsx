import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  AlertCircle,
  Inbox,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real-time status changes, dispatch notices, and administrative resolution notes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#2563EB] text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[#17324D] text-white font-bold'
              : 'text-[#64748B] hover:text-[#172B4D]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-[#17324D] text-white font-bold'
              : 'text-[#64748B] hover:text-[#172B4D]'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-3">
            <Inbox className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <div className="font-bold text-[#172B4D] text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <p>You'll receive live alerts here whenever your grievance is triaged, assigned, or resolved.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${
                  !item.is_read ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172B4D]">{item.title}</span>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.message}</p>
                  <div className="text-[11px] text-[#94A3B8] pt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  {item.complaint_id && (
                    <Link
                      to={`/complaints/${item.complaint_id}`}
                      className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

