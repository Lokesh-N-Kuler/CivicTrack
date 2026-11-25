import React from 'react';
import { ComplaintPriority } from '../services/types';
import { AlertTriangle, AlertCircle, ArrowDown, Minus } from 'lucide-react';

interface Props {
  priority: ComplaintPriority | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<Props> = ({ priority, size = 'md' }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Minus;

  switch (priority.toLowerCase()) {
    case 'urgent':
      style = 'bg-red-50 text-red-700 border-red-200';
      Icon = AlertTriangle;
      break;
    case 'high':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertCircle;
      break;
    case 'medium':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = Minus;
      break;
    case 'low':
      style = 'bg-slate-50 text-slate-600 border-slate-200';
      Icon = ArrowDown;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${sizeClasses} ${style}`}>
      <Icon className={iconSize} />
      <span className="capitalize">{priority}</span>
    </span>
  );
};
