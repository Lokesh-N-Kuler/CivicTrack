import React from 'react';
import { ComplaintHistory } from '../services/types';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, Clock, MessageSquare, ArrowRight, Camera, FileText } from 'lucide-react';

interface Props {
  history: ComplaintHistory[];
}

export const Timeline: React.FC<Props> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        No status history recorded yet.
      </div>
    );
  }

  // Sort chronological ascending (oldest to newest) or descending
  const sorted = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return <ArrowRight className="w-4 h-4 text-blue-600" />;
      case 'citizen_followup':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'image_uploaded':
        return <Camera className="w-4 h-4 text-emerald-600" />;
      case 'official_submission_recorded':
        return <FileText className="w-4 h-4 text-teal-600" />;
      case 'initial_submission':
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((item, idx) => {
        const isLatest = idx === 0;
        const dateFormatted = new Date(item.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={item.id} className="relative group">
            {/* Timeline dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                isLatest
                  ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-100'
                  : 'bg-white border-slate-300'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-500" />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-slate-100 text-slate-600">
                    {getActionIcon(item.action_type)}
                  </span>
                  <StatusBadge status={item.new_status} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dateFormatted}</span>
                </div>
              </div>

              {item.previous_status && item.previous_status !== item.new_status && (
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <span className="line-through text-slate-400">{item.previous_status}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{item.new_status}</span>
                </div>
              )}

              {item.notes && (
                <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed bg-slate-50/70 p-2.5 rounded border border-slate-150">
                  {item.notes}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Actor: {item.acting_user_name || 'System Operator'}</span>
                <span className="capitalize">{item.action_type.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
