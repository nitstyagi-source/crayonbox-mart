'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Building2, 
  Settings, 
  FileText, 
  Layers,
  Store,
  LogOut,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [llpProfile, setLlpProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check current auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(console.error);

    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data || []);
        if (data && data.length > 0 && !selectedBranchId) {
          const saved = localStorage.getItem('active_branch_id');
          const valid = data.find((b: any) => b.id === saved);
          const initial = valid ? valid.id : data[0].id;
          setSelectedBranchId(initial);
          localStorage.setItem('active_branch_id', initial);
        }
      })
      .catch(console.error);

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setLlpProfile(data))
      .catch(console.error);
  }, []);

  if (pathname === '/login') {
    return null;
  }

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBranchId(val);
    localStorage.setItem('active_branch_id', val);
    window.dispatchEvent(new Event('branchChanged'));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const isCashier = currentUser?.role === 'CASHIER';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const allNavLinks = [
    { href: '/', label: 'POS Billing', icon: ShoppingCart, roles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    { href: '/catalog', label: 'Uniforms & Books', icon: Package, roles: ['MANAGER', 'SUPER_ADMIN'] },
    { href: '/inventory', label: 'Stock Levels', icon: Layers, roles: ['MANAGER', 'SUPER_ADMIN'] },
    { href: '/users', label: 'Staff Accounts', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
    { href: '/payroll', label: 'Staff & Salary', icon: Users, roles: ['MANAGER', 'SUPER_ADMIN'] },
    { href: '/branches', label: 'Branches', icon: Building2, roles: ['MANAGER', 'SUPER_ADMIN'] },
    { href: '/settings', label: 'LLP Settings', icon: Settings, roles: ['MANAGER', 'SUPER_ADMIN'] },
  ];

  const visibleLinks = allNavLinks.filter(l => 
    !currentUser || l.roles.includes(currentUser.role || 'CASHIER')
  );

  return (
    <header className="no-print bg-[#FFFFFF] border-b border-[#E8DFC8] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Entity Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center font-black text-lg shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <a href="/" className="font-extrabold text-[#1C1917] text-base leading-tight block hover:text-[#0284C7] transition">
                {llpProfile?.brandName || llpProfile?.entityName || 'Crayon Box School Store'}
              </a>
              <span className="text-[11px] text-[#78716C] font-semibold flex items-center gap-1.5">
                <span>{llpProfile?.entityName || 'LLP Commercial Entity'}</span>
                {llpProfile?.gstin && (
                  <span className="bg-[#FAF7F2] border border-[#E8DFC8] text-[9px] px-1.5 py-0.2 rounded font-mono">
                    GST: {llpProfile.gstin}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#FAF7F2] text-[#0284C7] border border-[#E8DFC8] shadow-2xs'
                      : 'text-[#44403C] hover:text-[#1C1917] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284C7]' : 'text-[#78716C]'}`} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Dynamic Branch Switcher + User Role Badge + Logout */}
          <div className="flex items-center gap-2">
            
            {/* Counter Branch Dropdown (Manager can switch, Cashier sees assigned) */}
            <div className="flex items-center bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D97706] mr-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider">Active Counter</span>
                <select
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  disabled={isCashier}
                  className="bg-transparent text-xs font-extrabold text-[#1C1917] focus:outline-none cursor-pointer pr-3"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                  {!isCashier && <option value="all">All Branches (Overview)</option>}
                </select>
              </div>
            </div>

            {/* Staff Role Badge */}
            {currentUser && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
                isSuperAdmin
                  ? 'border-purple-200 bg-purple-50/80 text-purple-900'
                  : isCashier
                  ? 'border-sky-200 bg-sky-50/80 text-sky-900'
                  : 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              }`}>
                {isSuperAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                ) : isCashier ? (
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <div className="text-left">
                  <div className="font-bold text-[11px] leading-tight truncate max-w-[100px]">{currentUser.name}</div>
                  <div className="text-[9px] font-semibold opacity-75 uppercase tracking-wider">
                    {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role === 'MANAGER' ? 'Manager' : 'Cashier'}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
