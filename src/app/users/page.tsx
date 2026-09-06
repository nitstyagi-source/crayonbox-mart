'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Phone, 
  Mail, 
  Lock, 
  RefreshCw,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface MartUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER';
  branch_id: string | null;
  active: boolean;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<MartUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<MartUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'CASHIER' as 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER',
    branchId: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to load users' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Could not connect to users API' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranches(data);
        if (data.length > 0 && !formData.branchId) {
          setFormData(prev => ({ ...prev, branchId: data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Please enter staff name' });
      return;
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      setFeedback({ type: 'error', message: 'Please enter at least a Phone number or Email address' });
      return;
    }
    if (!formData.password.trim() || formData.password.length < 4) {
      setFeedback({ type: 'error', message: 'Password must be at least 4 characters long' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: `Staff member "${formData.name}" added successfully!` });
        setShowAddModal(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          role: 'CASHIER',
          branchId: branches[0]?.id || ''
        });
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Network error creating user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword.trim() || newPassword.length < 4) {
      setFeedback({ type: 'error', message: 'Password must be at least 4 characters' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserForPassword.id,
          password: newPassword.trim()
        })
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: `Password updated for ${selectedUserForPassword.name}` });
        setShowPasswordModal(false);
        setSelectedUserForPassword(null);
        setNewPassword('');
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error resetting password' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: MartUser) => {
    if (user.id === 'usr_super_admin') {
      setFeedback({ type: 'error', message: 'Cannot deactivate the primary Super Admin' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          active: !user.active
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update user status' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error updating user' });
    }
  };

  const handleDeleteUser = async (user: MartUser) => {
    if (user.id === 'usr_super_admin') {
      setFeedback({ type: 'error', message: 'Cannot delete the primary Super Admin account' });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete "${user.name}"? They will no longer be able to log in.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `User "${user.name}" deleted successfully.` });
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete user' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error deleting user' });
    }
  };

  const totalUsers = users.length;
  const cashierCount = users.filter(u => u.role === 'CASHIER').length;
  const managerCount = users.filter(u => u.role === 'MANAGER').length;
  const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DFC8]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Access Control</span>
          </div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight mt-1">Staff & Cashier User Accounts</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Create and manage staff logins with Mobile/Email & Password. Configure Cashier vs Manager permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-[#E8DFC8] bg-white text-[#44403C] hover:bg-[#FAF7F2] transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff Member</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`mt-4 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="cursor-pointer opacity-75 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="w-5 h-5 text-stone-400" />
          </div>
          <div className="text-3xl font-black text-[#1C1917] mt-2">{totalUsers}</div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">Registered store logins</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Counter Cashiers</span>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-950 mt-2">{cashierCount}</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">POS billing & print only</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Store Managers</span>
            <Building2 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-950 mt-2">{managerCount}</div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Catalog, Stock, Payroll, LLP</div>
        </div>

        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold uppercase tracking-wider">Super Admins</span>
            <ShieldCheck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-950 mt-2">{superAdminCount}</div>
          <div className="text-xs text-purple-700 mt-1 font-medium">Full master authority</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E8DFC8] rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-[#E8DFC8] bg-[#FAF7F2] flex items-center justify-between">
          <h2 className="font-extrabold text-base text-[#1C1917] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D97706]" />
            <span>Registered Staff Accounts</span>
          </h2>
          <span className="text-xs font-semibold text-[#78716C]">
            Showing {users.length} {users.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFC8] bg-[#FAF7F2]/50 text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-6">Login Identifier</th>
                <th className="py-3.5 px-6">Permission Role</th>
                <th className="py-3.5 px-6">Assigned Branch</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFC8] text-sm">
              {users.map((user) => {
                const branchName = branches.find(b => b.id === user.branch_id)?.name || user.branch_id || 'Main Campus';
                const isSuper = user.role === 'SUPER_ADMIN';
                const isCashier = user.role === 'CASHIER';

                return (
                  <tr key={user.id} className="hover:bg-[#FAF7F2]/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSuper 
                            ? 'bg-purple-100 text-purple-700' 
                            : isCashier 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#1C1917] flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.id === 'usr_super_admin' && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-md">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#78716C] font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#1C1917] font-semibold">
                            <Phone className="w-3.5 h-3.5 text-[#78716C]" />
                            <span>{user.phone}</span>
                          </div>
                        ) : null}
                        {user.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                            <Mail className="w-3.5 h-3.5 text-[#78716C]" />
                            <span>{user.email}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Super Admin</span>
                        </span>
                      ) : isCashier ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Cashier (POS Only)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Store Manager</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-xs font-medium text-[#44403C] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#78716C]" />
                        <span>{branchName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={user.id === 'usr_super_admin'}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition ${
                          user.active 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        } ${user.id === 'usr_super_admin' ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        {user.active ? '● Active' : '○ Disabled'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUserForPassword(user);
                            setNewPassword('');
                            setShowPasswordModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#E8DFC8] bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-700 transition cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {user.id !== 'usr_super_admin' && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg border border-[#E8DFC8] bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW STAFF MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E8DFC8] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-lg text-[#1C1917]">Add New Staff Account</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="tel"
                      placeholder="9812345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[10px] text-[#78716C] mt-0.5 block">Staff can log in with this phone</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="email"
                      placeholder="staff@school.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[10px] text-[#78716C] mt-0.5 block">Or log in with email</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    placeholder="Enter a secure password (min 4 chars)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Permission Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`border rounded-xl p-3 cursor-pointer transition flex flex-col items-start ${
                    formData.role === 'CASHIER' 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-[#E8DFC8] hover:bg-[#FAF7F2]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="CASHIER"
                      checked={formData.role === 'CASHIER'}
                      onChange={() => setFormData({ ...formData, role: 'CASHIER' })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cashier</span>
                    </div>
                    <span className="text-[10px] text-emerald-900/80 mt-1 leading-tight">
                      POS billing & receipts only. Price & stock locked.
                    </span>
                  </label>

                  <label className={`border rounded-xl p-3 cursor-pointer transition flex flex-col items-start ${
                    formData.role === 'MANAGER' 
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' 
                      : 'border-[#E8DFC8] hover:bg-[#FAF7F2]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="MANAGER"
                      checked={formData.role === 'MANAGER'}
                      onChange={() => setFormData({ ...formData, role: 'MANAGER' })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Store Manager</span>
                    </div>
                    <span className="text-[10px] text-amber-900/80 mt-1 leading-tight">
                      Catalog prices, stock audits, payroll, branches.
                    </span>
                  </label>

                  <label className={`border rounded-xl p-3 cursor-pointer transition flex flex-col items-start ${
                    formData.role === 'SUPER_ADMIN' 
                      ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500' 
                      : 'border-[#E8DFC8] hover:bg-[#FAF7F2]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="SUPER_ADMIN"
                      checked={formData.role === 'SUPER_ADMIN'}
                      onChange={() => setFormData({ ...formData, role: 'SUPER_ADMIN' })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Super Admin</span>
                    </div>
                    <span className="text-[10px] text-purple-900/80 mt-1 leading-tight">
                      Master control + add & manage staff accounts.
                    </span>
                  </label>
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                  Assigned Store Branch
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition cursor-pointer"
                >
                  {branches.length === 0 ? (
                    <option value="">Main Counter (No branches created yet)</option>
                  ) : (
                    branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8DFC8] text-sm font-bold text-stone-600 hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E8DFC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-[#1C1917]">Reset Staff Password</h3>
              </div>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUserForPassword(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <p className="text-xs text-[#78716C]">
                Set a new password for <span className="font-bold text-[#1C1917]">{selectedUserForPassword.name}</span> ({selectedUserForPassword.phone || selectedUserForPassword.email}).
              </p>

              <div>
                <label className="block text-xs font-bold text-[#44403C] uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    placeholder="Enter new password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUserForPassword(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E8DFC8] text-xs font-bold text-stone-600 hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
