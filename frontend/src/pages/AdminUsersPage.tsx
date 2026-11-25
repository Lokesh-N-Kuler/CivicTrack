import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  User as UserIcon,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');

  // Demonstration accounts list
  const users = [
    {
      id: 1,
      email: 'admin@example.com',
      full_name: 'Demo Administrator',
      role: 'admin',
      phone: '+91-80-22660000',
      is_active: true,
      complaints_count: 0,
      created_at: '2026-10-15',
    },
    {
      id: 2,
      email: 'citizen@example.com',
      full_name: 'Alex Citizen',
      role: 'citizen',
      phone: '+91-9880011223',
      is_active: true,
      complaints_count: 6,
      created_at: '2026-10-20',
    },
    {
      id: 3,
      email: 'priya.citizen@example.com',
      full_name: 'Priya Sharma',
      role: 'citizen',
      phone: '+91-9880044556',
      is_active: true,
      complaints_count: 5,
      created_at: '2026-10-25',
    },
  ];

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-semibold border border-[#DBEAFE] mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>User Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          User Management
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Registered citizen reporters and municipal administrative triage staff.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px] tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#17324D] text-white font-bold flex items-center justify-center text-xs">
                      {u.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#172B4D]">{u.full_name}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#94A3B8]" />
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[#64748B] font-mono">
                  {u.phone}
                </td>
                <td className="py-3.5 px-4 text-[#172B4D] font-medium">
                  {u.complaints_count} complaints filed
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">
                  {u.created_at}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

