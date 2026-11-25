import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  isEscalated: boolean;
  reason?: string | null;
  hoursInStatus?: number;
  recommendedAction?: string | null;
}

export const EscalationBanner: React.FC<Props> = ({
  isEscalated,
  reason,
  hoursInStatus,
  recommendedAction,
}) => {
  if (!isEscalated) return null;

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-4 shadow-sm my-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 text-sm">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-amber-900 text-sm">
              Flagged for Review
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-200 text-amber-900 rounded-md border border-amber-300 uppercase tracking-wide">
              Demo escalation rule
            </span>
            {hoursInStatus !== undefined && (
              <span className="flex items-center gap-1 text-xs text-amber-800 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {hoursInStatus}h in status
              </span>
            )}
          </div>

          <p className="text-amber-800 text-xs sm:text-sm mt-0.5">
            {reason || 'This grievance has exceeded standard demonstration resolution duration.'}
          </p>

          {recommendedAction && (
            <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center gap-2 text-xs font-medium text-amber-900">
              <span className="text-amber-700 font-semibold uppercase text-[10px] tracking-wider">Recommended Next Step:</span>
              <span className="flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded text-amber-950">
                <ArrowRight className="w-3 h-3 text-amber-700" />
                {recommendedAction}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700/80 italic">
            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
            <span>
              Disclaimer: Triggered by an internal demonstration timer. Does not reflect an official statutory municipal service guarantee.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
