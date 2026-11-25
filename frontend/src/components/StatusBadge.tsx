import React from 'react';
import { ComplaintStatus } from '../services/types';
import { CheckCircle2, Clock, AlertCircle, Send, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';

interface Props {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (status) {
    case 'Resolved':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;
    case 'In Progress':
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    case 'Assigned':
      bg = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = ArrowRight;
      break;
    case 'Official Submission Confirmed':
      bg = 'bg-teal-50 text-teal-800 border-teal-200';
      Icon = ShieldCheck;
      break;
    case 'Awaiting Official Submission':
      bg = 'bg-orange-50 text-orange-800 border-orange-200';
      Icon = Send;
      break;
    case 'Authority Recommended':
      bg = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      Icon = ArrowRight;
      break;
    case 'Under Review':
      bg = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = Clock;
      break;
    case 'Rejected':
      bg = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = XCircle;
      break;
    case 'Follow-up Required':
      bg = 'bg-purple-50 text-purple-800 border-purple-200';
      Icon = AlertCircle;
      break;
    case 'Submitted to CivicTrack':
    default:
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = Clock;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{status}</span>
    </span>
  );
};
