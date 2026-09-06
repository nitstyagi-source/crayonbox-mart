'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Building2, 
  Settings, 
  FileText, 
  Layers,
  ChevronDown,
  Store
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [llpProfile, setLlpProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0 && !selectedBranchId) {
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

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBranchId(val);
    localStorage.setItem('active_branch_id', val);
    window.dispatchEvent(new Event('branchChanged'));
  };

  const navLinks = [
    { href: '/', label: 'POS Billing', icon: ShoppingCart },
    { href: '/catalog', label: 'Uniforms & Books', icon: Package },
    { href: '/inventory', label: 'Stock Levels', icon: Layers },
    { href: '/payroll', label: 'Staff & Salary', icon: Users },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/branches', label: 'Branches', icon: Building2 },
    { href: '/settings', label: 'LLP Settings', icon: Settings },
  ];

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
                {llpProfile?.tradeName || llpProfile?.name || 'Commercial Billing ERP'}
              </a>
              <span className="text-[11px] text-[#78716C] font-semibold flex items-center gap-1.5">
                <span>{llpProfile?.name || 'LLP Commercial Entity'}</span>
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
            {navLinks.map((item) => {
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

          {/* Dynamic Branch Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D97706] mr-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#78716C] uppercase tracking-wider">Active Counter</span>
                <select
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  className="bg-transparent text-xs font-extrabold text-[#1C1917] focus:outline-none cursor-pointer pr-4"
                >
                  {branches.length === 0 && (
                    <option value="">No Branches Added</option>
                  )}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                  {branches.length > 0 && <option value="all">All Branches (Overview)</option>}
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
