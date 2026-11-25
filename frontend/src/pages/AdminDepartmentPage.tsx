import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Department } from '../services/types';
import {
  Building2,
  Phone,
  Mail,
  Layers,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const AdminDepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getDepartments()
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const DEPT_CATEGORIES: { [slug: string]: { categories: string[]; sla: string; team: string } } = {
    'road-maintenance': {
      categories: ['Potholes', 'Damaged Roads', 'Broken Bitumen Surfaces'],
      sla: '24-48 Hours Emergency Response',
      team: 'Pavement Maintenance Crew Alpha & Beta (BBMP Central)',
    },
    'waste-management': {
      categories: ['Garbage Accumulation', 'Overflowing Public Bins', 'Missed Waste Collection'],
      sla: '12-24 Hours Sanitation Clearance',
      team: 'Solid Waste Directorate Zone 4',
    },
    'water-supply': {
      categories: ['Pipeline Ruptures / Leakage', 'Damaged Water Mains', 'Supply Disruptions'],
      sla: '6-18 Hours High Pressure Isolation',
      team: 'BWSSB Rapid Action Pipeline Unit',
    },
    'drainage-sewage': {
      categories: ['Blocked Storm Drains', 'Sanitary Sewer Overflow', 'Street Waterlogging'],
      sla: '12-24 Hours Hydro-Jetting Clearance',
      team: 'BBMP Stormwater Runoff Command',
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE] mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Municipal Service Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Department Management
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Four standard demonstration municipal departments for Bengaluru grievance triage and SLA enforcement.
        </p>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#64748B]">
          <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading municipal departments...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const meta = DEPT_CATEGORIES[dept.slug] || {
              categories: ['General Civic Inconveniences'],
              sla: '48 Hours Initial Review',
              team: 'Municipal General Engineering Cell',
            };

            return (
              <div
                key={dept.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#172B4D]">{dept.name}</h2>
                        <span className="font-mono text-[11px] text-[#64748B]">{dept.slug}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {dept.description}
                  </p>

                  {/* Categories Handled */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#172B4D]">
                      Categories Triage Scope:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569] font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SLA & Team */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#172B4D]">
                      <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="font-semibold">Service Level Agreement:</span>{' '}
                      <span className="text-[#64748B]">{meta.sla}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#172B4D]">
                      <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="font-semibold">Dispatch Team:</span>{' '}
                      <span className="text-[#64748B]">{meta.team}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Footer */}
                <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                  <div className="flex items-center gap-3">
                    {dept.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#94A3B8]" />
                        <span>{dept.contact_phone}</span>
                      </div>
                    )}
                    {dept.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#94A3B8]" />
                        <span>{dept.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

