import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  MapPin,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  Compass,
  FileText
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isAdmin, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    try {
      const loggedUser = await login(email, pass);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white pt-16 pb-12 sm:pt-20 sm:pb-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Civic Grievance Triage & Resolution Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Transparent civic reporting for cleaner, safer communities.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report road hazards, waste accumulation, pipeline leaks, and drainage blockages with verified routing, chronological audit timelines, and official portal assistance.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
              >
                <span>Go to {isAdmin ? 'Admin Console' : 'My Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
                >
                  <span>Report a Grievance</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-10 p-4 bg-white/90 border border-slate-200 rounded-xl max-w-2xl mx-auto shadow-xs text-left">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Instant Demo Evaluator Access
              </span>
              <span className="text-[11px] text-slate-400">One-click testing</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen@example.com', 'Password123!')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg text-left transition-colors text-xs group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Citizen: Alex</div>
                <div className="text-[10px] text-slate-500 font-mono">citizen@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('priya.citizen@example.com', 'Password123!')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg text-left transition-colors text-xs group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Citizen 2: Priya</div>
                <div className="text-[10px] text-slate-500 font-mono">priya.citizen@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@example.com', 'AdminPassword123!')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-lg text-left transition-colors text-xs group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-amber-800">Admin: Supervisor</div>
                <div className="text-[10px] text-slate-500 font-mono">admin@example.com</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Demo Departments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Four Demonstration Departments
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Intelligent category-to-department routing accurately recommends the appropriate municipal department and explains the triage rationale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dept 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base mb-3 border border-blue-100">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Road Maintenance
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Asphalt defects, potholes, and broken carriageways.
            </p>
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-1">Triage Categories:</div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Potholes</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Damaged roads</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Broken road surfaces</span>
              </div>
            </div>
          </div>

          {/* Dept 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-3 border border-emerald-100">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Waste Management
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Street cleanliness, missed collections, and public bins.
            </p>
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-1">Triage Categories:</div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Garbage accumulation</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Overflowing public bins</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Waste collection issues</span>
              </div>
            </div>
          </div>

          {/* Dept 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-sky-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base mb-3 border border-sky-100">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Water Supply
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Potable distribution, pipeline fractures, and low pressure.
            </p>
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-1">Triage Categories:</div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Water leakage</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Damaged pipelines</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Supply disruptions</span>
              </div>
            </div>
          </div>

          {/* Dept 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base mb-3 border border-indigo-100">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Drainage & Sewage
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Clogged culverts, wastewater overflows, and waterlogging.
            </p>
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-1">Triage Categories:</div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Blocked storm drains</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Sewage overflow</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Street waterlogging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How CivicTrack Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A clear, accountable workflow from initial citizen report to resolution verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">File Grievance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide issue description, drop a pin on the OpenStreetMap, and upload photographic evidence.
              </p>
            </div>

            <div className="relative space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Intelligent Triage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Backend engine analyzes category and context, recommending the correct department with detailed rationale.
              </p>
            </div>

            <div className="relative space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Audit Trail Timeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every status update, inspection note, and reassignment is recorded in an immutable chronological history.
              </p>
            </div>

            <div className="relative space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Official Bridging</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate pre-formatted summaries to submit to external government portals, or test via simulated adapters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Government Routing Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl shrink-0">
              <FileCheck2 className="w-10 h-10" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Honest & Ethical Government Integration
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  Transparency
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                CivicTrack never fabricates external government responses or falsely claims that a municipal complaint has been lodged when it hasn't.
                We provide structured grievance summaries for copy/download to official government portals (such as CPGRAMS, Swachhata, BBMP), and clearly flag all simulated adapters with <strong>SIMULATED — NOT SENT TO GOVERNMENT</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
