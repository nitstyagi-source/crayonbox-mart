'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  Store, 
  Phone, 
  MapPin, 
  Hash 
} from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    phone: '',
    active: true
  });
  const [message, setMessage] = useState('');

  const fetchBranches = () => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openAddModal = () => {
    setEditingBranch(null);
    setForm({
      name: '',
      code: '',
      location: '',
      phone: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBranch(b);
    setForm({
      name: b.name,
      code: b.code,
      location: b.location,
      phone: b.phone,
      active: b.active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingBranch ? 'edit' : 'add';
    const payload = editingBranch ? { action, id: editingBranch.id, ...form } : { action, ...form };

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMessage(editingBranch ? 'Branch updated successfully!' : 'New branch counter added!');
        setTimeout(() => setMessage(''), 4000);
        setIsModalOpen(false);
        fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch counter "${name}"?`)) return;
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Branch deleted successfully.');
        setTimeout(() => setMessage(''), 4000);
        fetchBranches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D97706]" />
            Dynamic Branch & Counter Management
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Zero hardcoded campuses. Add, rename, and manage any number of school distribution outlets and counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-bold border border-[#86EFAC]">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add New Campus Branch
          </button>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E8DFC8] p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-[#78716C] mx-auto opacity-50" />
          <h3 className="text-sm font-extrabold text-[#1C1917]">No Branches or Counters Configured</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto">
            Get started by adding your first outlet or sales counter. All counter names, prefixes, and locations are 100% customizable.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add First Branch Counter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-[#E8DFC8] p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-black text-sm">
                  {b.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  b.active ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
                }`}>
                  {b.active ? '● Active' : '○ Inactive'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-[#1C1917] mb-1">{b.name}</h3>

              <div className="space-y-1.5 text-xs text-[#78716C] mt-3">
                {b.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>{b.location}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 font-mono">
                  <Hash className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  <span>Invoice Counter: #{b.invoiceCounter || 1}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E8DFC8] flex items-center justify-between">
              <span className="text-[10px] text-[#78716C] font-semibold">
                Prefix: <span className="font-mono font-bold text-[#1C1917]">/{b.code}/</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(b)}
                  className="p-1.5 text-[#0284C7] hover:bg-[#FAF7F2] rounded-lg transition"
                  title="Edit Branch"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Branch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFC8]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E8DFC8]">
              <h3 className="text-sm font-extrabold text-[#1C1917]">
                {editingBranch ? 'Edit Campus Branch' : 'Add New Campus Branch'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Branch / Campus Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Counter or Campus Branch"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Branch Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. C1 or NW"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Physical Counter / Room Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Ground Floor, Sports Block Room 102"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="branch_active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-[#0284C7] rounded"
                />
                <label htmlFor="branch_active" className="text-xs font-bold text-[#1C1917] cursor-pointer">
                  Active Outlet (Accepts Invoicing)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#44403C] text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
