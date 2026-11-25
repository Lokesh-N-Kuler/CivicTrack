import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Authority, Department } from '../services/types';
import {
  BookOpen,
  Plus,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building,
  CheckCircle2,
  X,
  Edit2,
  Phone,
  Mail,
} from 'lucide-react';

export const AdminAuthorityDirectoryPage: React.FC = () => {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<Authority | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    jurisdiction: '',
    supported_categories: '',
    official_website: '',
    official_portal_url: '',
    public_contact_phone: '',
    public_contact_email: '',
    is_verified: false,
    integration_type: 'simulated',
    department_id: undefined as number | undefined,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [authList, deptList] = await Promise.all([
        api.getAuthorities(),
        api.getDepartments(),
      ]);
      setAuthorities(authList);
      setDepartments(deptList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingAuth(null);
    setFormData({
      name: '',
      jurisdiction: '',
      supported_categories: 'potholes,damaged_roads',
      official_website: '',
      official_portal_url: '',
      public_contact_phone: '',
      public_contact_email: '',
      is_verified: false,
      integration_type: 'simulated',
      department_id: departments[0]?.id,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (auth: Authority) => {
    setEditingAuth(auth);
    setFormData({
      name: auth.name,
      jurisdiction: auth.jurisdiction,
      supported_categories: auth.supported_categories,
      official_website: auth.official_website || '',
      official_portal_url: auth.official_portal_url || '',
      public_contact_phone: auth.public_contact_phone || '',
      public_contact_email: auth.public_contact_email || '',
      is_verified: auth.is_verified,
      integration_type: auth.integration_type,
      department_id: auth.department_id || undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAuth) {
        await api.updateAuthority(editingAuth.id, formData);
      } else {
        await api.createAuthority(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin" className="text-xs text-blue-600 hover:underline">
              Admin Console
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs text-slate-600 font-medium">Municipal Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Authority Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official municipal offices, verified portal links, and integration configurations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Authority Entry</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading authority records...</span>
          </div>
        ) : authorities.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No authorities configured in directory yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Authority Name & Jurisdiction</th>
                  <th className="py-3 px-4">Supported Categories</th>
                  <th className="py-3 px-4">Portal / Contacts</th>
                  <th className="py-3 px-4">Integration Mode</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authorities.map((auth) => (
                  <tr key={auth.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{auth.name}</div>
                      <div className="text-slate-500 text-xs">{auth.jurisdiction}</div>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      <span className="line-clamp-2">{auth.supported_categories.replace(/_/g, ' ')}</span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 space-y-0.5">
                      {auth.official_portal_url ? (
                        <a
                          href={auth.official_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-[160px]">{auth.official_portal_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="italic text-slate-400">None</span>
                      )}
                      {auth.public_contact_phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{auth.public_contact_phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                        {auth.integration_type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {auth.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          Unverified Demo
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(auth)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingAuth ? 'Edit Authority Record' : 'Add Authority Directory Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authority / Office Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. City Public Works Directorate"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jurisdiction *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    placeholder="e.g. Ward 4 / Metro District"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Link
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supported Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.supported_categories}
                  onChange={(e) => setFormData({ ...formData, supported_categories: e.target.value })}
                  placeholder="potholes,damaged_roads,broken_road_surfaces"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Complaint Portal URL
                </label>
                <input
                  type="url"
                  value={formData.official_portal_url}
                  onChange={(e) => setFormData({ ...formData, official_portal_url: e.target.value })}
                  placeholder="https://example.gov/grievance"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public Phone
                  </label>
                  <input
                    type="text"
                    value={formData.public_contact_phone}
                    onChange={(e) => setFormData({ ...formData, public_contact_phone: e.target.value })}
                    placeholder="+1-555-0100"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Integration Type
                  </label>
                  <select
                    value={formData.integration_type}
                    onChange={(e) => setFormData({ ...formData, integration_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  >
                    <option value="none">None (Manual Copy)</option>
                    <option value="simulated">Simulated Adapter</option>
                    <option value="official_api">Official API (Verified)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={formData.is_verified}
                  onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="is_verified" className="text-xs font-semibold text-slate-800">
                  Mark as Officially Verified Authority
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                >
                  Save Authority
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
