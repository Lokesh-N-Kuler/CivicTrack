import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Phone,
  Mail,
  FileQuestion,
  ExternalLink,
  Shield,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const HELPLINES = [
    {
      agency: 'BBMP Control Room (Bruhat Bengaluru Mahanagara Palike)',
      category: 'Roads, Potholes, Waste Management, Stormwater Drains',
      phone: '080-22660000 / 080-22221188',
      email: 'contactusbbmp@gmail.com',
      portal: 'https://bbmp.gov.in',
    },
    {
      agency: 'BWSSB Water & Sewerage Helpline',
      category: 'Water Leakages, Pipeline Bursts, Sewerage Overflow',
      phone: '1916 / 080-22238888',
      email: 'bwssbcomplaints@karnataka.gov.in',
      portal: 'https://bwssb.karnataka.gov.in',
    },
    {
      agency: 'BESCOM Power Helpline',
      category: 'Street Lighting & Distribution Grid Interruptions',
      phone: '1912 / 080-22873333',
      email: 'helpline@bescom.co.in',
      portal: 'https://bescom.karnataka.gov.in',
    },
    {
      agency: 'Bengaluru Traffic Police (BTP)',
      category: 'Severe Traffic Obstructions caused by Road Surface Collapse',
      phone: '1095 / 080-22943030',
      email: 'trafficpolice@bengaluru.gov.in',
      portal: 'https://btp.gov.in',
    },
  ];

  const FAQS = [
    {
      q: 'How does CivicTrack automatically recommend a department?',
      a: 'CivicTrack uses rule-based keyword context and category mapping to suggest the correct municipal division (Road Maintenance, Waste Management, Water Supply, or Drainage & Sewage). Administrators can reassign or verify recommendations during triage.',
    },
    {
      q: 'What is the BBMP Municipal Service Boundary check?',
      a: 'CivicTrack validates coordinates against the Greater Bengaluru Metropolitan area (BBMP bounds roughly between latitudes 12.75 to 13.25 and longitudes 77.40 to 77.85). If you select coordinates outside this boundary, the system shows an advisory warning.',
    },
    {
      q: 'How do I submit official complaint reference numbers from government portals?',
      a: 'Open your complaint detail page and look for the "External Government Submission" section. You can enter reference numbers from BBMP Sahaya, BWSSB 1916, or IPGRS. Unverified entries are initially flagged as unverified pending departmental audit.',
    },
    {
      q: 'Can other citizens view my private grievances?',
      a: 'No. CivicTrack strictly enforces citizen privacy at both the database and API layer. Citizens can only access grievances they created, while authorized municipal administrators have cross-system triage visibility.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE] mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help & Civic Resources</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Help & Support Directory
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Official contact helplines, escalation portals, and answers to common grievance questions.
        </p>
      </div>

      {/* Official Helplines */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#2563EB]" />
          <span>Official Bengaluru Municipal Helplines</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HELPLINES.map((h) => (
            <div
              key={h.agency}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3"
            >
              <div className="font-bold text-sm text-[#172B4D]">{h.agency}</div>
              <p className="text-xs text-[#64748B]">{h.category}</p>

              <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-[#172B4D]">
                  <Phone className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span className="font-mono font-semibold">{h.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#64748B]">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <span className="truncate">{h.email}</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={h.portal}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
          <FileQuestion className="w-4 h-4 text-[#2563EB]" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9] shadow-xs">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-[#172B4D]">{faq.q}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick CTA */}
      <div className="bg-[#17324D] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Have an urgent hazard to report?</h3>
          <p className="text-xs text-slate-300 max-w-md">
            Use the smart interactive map to pin the exact coordinate and dispatch field repair teams.
          </p>
        </div>
        <Link
          to="/complaints/new"
          className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm transition-colors shrink-0"
        >
          Report a Problem Now &rarr;
        </Link>
      </div>
    </div>
  );
};

