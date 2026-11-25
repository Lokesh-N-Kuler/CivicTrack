import React from 'react';
import { Shield, Info, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base tracking-tight">CivicTrack</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens with intelligent grievance routing, verified authority directories, and chronological resolution auditing.
            </p>
          </div>

          {/* Col 2: Supported Demo Departments */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Four Demo Departments
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>1. Road Maintenance Department</li>
              <li>2. Waste Management Department</li>
              <li>3. Water Supply Department</li>
              <li>4. Drainage & Sewage Department</li>
            </ul>
          </div>

          {/* Col 3: Ethical Government Routing */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Routing Boundaries
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Simulated test mode labeled prominently</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>No unauthorized municipal scraping</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Format summaries for official portals</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Transparency */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Platform Status
            </h4>
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Demonstration Mode Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All seeded complaints are fictional demonstration records. Replace local demo credentials prior to production deployment.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>&copy; {new Date().getFullYear()} CivicTrack Open Grievance Platform. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Internal Grievance IDs: <span className="font-mono text-slate-400">CT-YYYY-NNNNNN</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
