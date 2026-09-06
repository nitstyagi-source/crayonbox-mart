'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calculator, 
  Save, 
  Printer, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  FileText, 
  X, 
  DollarSign 
} from 'lucide-react';
import PayslipModal from '@/components/PayslipModal';

export default function PayrollPage() {
  const [monthYear, setMonthYear] = useState<string>('2026-09');
  const [workingDays, setWorkingDays] = useState<number>(26);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [payrollRows, setPayrollRows] = useState<Record<string, any>>({});
  const [llpProfile, setLlpProfile] = useState<any>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  // Modals
  const [selectedPayslipRecord, setSelectedPayslipRecord] = useState<any>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [newStaffForm, setNewStaffForm] = useState<{
    name: string;
    role: string;
    phone: string;
    branchId: string;
    baseSalary: number | string;
  }>({
    name: '',
    role: '',
    phone: '',
    branchId: '',
    baseSalary: ''
  });

  useEffect(() => {
    // Load initial metadata
    Promise.all([
      fetch('/api/branches').then(res => res.json()),
      fetch('/api/profile').then(res => res.json()),
      fetch('/api/staff').then(res => res.json())
    ]).then(([branchesData, profileData, staffData]) => {
      setBranches(branchesData);
      setLlpProfile(profileData);
      setStaffList(staffData);
      if (branchesData.length > 0 && !newStaffForm.branchId) {
        setNewStaffForm(prev => ({ ...prev, branchId: branchesData[0].id }));
      }
    }).catch(console.error);
  }, []);

  // Fetch or initialize payroll for selected month
  useEffect(() => {
    if (!monthYear || staffList.length === 0) return;

    fetch(`/api/payroll?month=${monthYear}`)
      .then(res => res.json())
      .then(existingRecords => {
        const rows: Record<string, any> = {};

        staffList.forEach((staff: any) => {
          const existing = existingRecords.find((r: any) => r.staffId === staff.id);
          const branch = branches.find(b => b.id === staff.branchId);

          if (existing) {
            rows[staff.id] = { ...existing };
          } else {
            // Initialize fresh row for this staff member
            const base = Number(staff.baseSalary) || 18000;
            const perDay = Number((base / workingDays).toFixed(2));
            const pres = 24;
            const half = 0;
            const eff = pres + (half * 0.5);
            const earned = Number((eff * perDay).toFixed(2));

            rows[staff.id] = {
              staffId: staff.id,
              staffName: staff.name,
              branchId: staff.branchId,
              branchName: branch ? branch.name : 'Store Counter',
              role: staff.role,
              monthYear,
              baseSalary: base,
              workingDaysInMonth: workingDays,
              daysPresent: pres,
              halfDays: half,
              effectivePresentDays: eff,
              perDayRate: perDay,
              earnedSalary: earned,
              bonus: 0,
              advancesDeducted: 0,
              otherDeductions: 0,
              netPayable: earned,
              paymentStatus: 'Pending',
              paymentDate: '',
              paymentMode: 'Cash',
              remarks: ''
            };
          }
        });

        setPayrollRows(rows);
      })
      .catch(console.error);
  }, [monthYear, staffList, branches, workingDays]);

  const handleRowChange = (staffId: string, field: string, value: any) => {
    setPayrollRows(prev => {
      const row = { ...prev[staffId] };
      const numVal = Number(value) || 0;

      if (field === 'workingDaysInMonth') {
        row.workingDaysInMonth = Math.max(1, numVal);
      } else if (field === 'baseSalary') {
        row.baseSalary = Math.max(0, numVal);
      } else if (field === 'daysPresent') {
        row.daysPresent = Math.max(0, numVal);
      } else if (field === 'halfDays') {
        row.halfDays = Math.max(0, numVal);
      } else if (field === 'bonus') {
        row.bonus = Math.max(0, numVal);
      } else if (field === 'advancesDeducted') {
        row.advancesDeducted = Math.max(0, numVal);
      } else if (field === 'otherDeductions') {
        row.otherDeductions = Math.max(0, numVal);
      } else {
        row[field] = value;
      }

      // Recompute math
      const base = Number(row.baseSalary) || 0;
      const wDays = Math.max(1, Number(row.workingDaysInMonth) || 26);
      const perDay = Number((base / wDays).toFixed(2));
      const effDays = Number(row.daysPresent || 0) + (Number(row.halfDays || 0) * 0.5);
      const earned = Number((effDays * perDay).toFixed(2));
      const net = Math.round(earned + Number(row.bonus || 0) - Number(row.advancesDeducted || 0) - Number(row.otherDeductions || 0));

      row.perDayRate = perDay;
      row.effectivePresentDays = effDays;
      row.earnedSalary = earned;
      row.netPayable = Math.max(0, net);

      return { ...prev, [staffId]: row };
    });
  };

  const handleSaveBatch = async () => {
    setSaving(true);
    setMessage('');
    try {
      const records = Object.values(payrollRows);
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_batch', records })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Attendance & payroll calculations saved successfully!');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (staffId: string) => {
    const row = payrollRows[staffId];
    if (!row) return;
    const mode = prompt('Enter payment mode (Cash, Bank Transfer, UPI):', 'Cash') || 'Cash';

    const updatedRow = {
      ...row,
      paymentStatus: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: mode
    };

    setPayrollRows(prev => ({ ...prev, [staffId]: updatedRow }));

    try {
      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_batch',
          records: [updatedRow]
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...newStaffForm })
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.list);
        setIsAddStaffOpen(false);
        setNewStaffForm({
          name: '',
          role: '',
          phone: '',
          branchId: branches[0]?.id || '',
          baseSalary: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStaff = staffList.filter(s => {
    if (selectedBranchId === 'all') return true;
    return s.branchId === selectedBranchId;
  });

  const totalDisbursement = filteredStaff.reduce((sum, s) => {
    const row = payrollRows[s.id];
    return sum + (row ? Number(row.netPayable || 0) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#15803D]" />
            Staff Attendance & Salary Calculator
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Calculates exact pro-rata salary based on days present in the month: (Base Salary ÷ Total Month Days) × Present Days.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {message && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-bold border border-[#86EFAC]">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}

          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8DFC8] text-[#1C1917] hover:bg-[#FAF7F2] text-xs font-bold rounded-xl shadow-2xs transition"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            Add Staff Member
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8DFC8] text-[#0284C7] hover:bg-[#FAF7F2] text-xs font-bold rounded-xl shadow-2xs transition"
            title="Print Monthly Register"
          >
            <Printer className="w-4 h-4" />
            Print Month Sheet
          </button>

          <button
            onClick={handleSaveBatch}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Month Calculations'}
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="no-print bg-white p-4 rounded-2xl border border-[#E8DFC8] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Month Picker */}
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8DFC8] px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-[#D97706]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#78716C] uppercase">Payroll Month</span>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="bg-transparent font-extrabold text-xs text-[#1C1917] focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8DFC8] px-3 py-1.5 rounded-xl">
            <Building2 className="w-4 h-4 text-[#0284C7]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#78716C] uppercase">Branch Filter</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent font-extrabold text-xs text-[#1C1917] focus:outline-none cursor-pointer"
              >
                <option value="all">All School Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Working Days */}
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8DFC8] px-3 py-1.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#78716C] uppercase">Total Billable Days</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={workingDays}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 26;
                    setWorkingDays(v);
                    Object.keys(payrollRows).forEach(sid => {
                      handleRowChange(sid, 'workingDaysInMonth', v);
                    });
                  }}
                  className="w-12 bg-white px-1.5 py-0.5 border border-[#E8DFC8] rounded text-xs font-bold text-center font-mono"
                />
                <span className="text-[11px] text-[#78716C] font-medium">Days</span>
              </div>
            </div>
          </div>

        </div>

        {/* Total Metric */}
        <div className="bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#E8DFC8] text-right">
          <div className="text-[10px] text-[#78716C] font-bold uppercase">Total Net Disbursement</div>
          <div className="text-base font-black text-[#15803D] font-mono">₹{totalDisbursement.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Salary Calculator Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-x-auto">
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78716C] space-y-3">
            <Users className="w-8 h-8 text-[#78716C] mx-auto opacity-40" />
            <div className="font-bold text-[#1C1917]">No Staff Members Added Yet</div>
            <p>Click &quot;Add Staff Member&quot; to configure your employees and their base salaries.</p>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add First Staff Member
            </button>
          </div>
        ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFC8] text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
              <th className="py-3 px-4">Staff Member & Role</th>
              <th className="py-3 px-3">Campus Branch</th>
              <th className="py-3 px-3 text-right">Base Salary</th>
              <th className="py-3 px-2 text-center">Full Days</th>
              <th className="py-3 px-2 text-center">Half Days</th>
              <th className="py-3 px-3 text-right">Per-Day Rate</th>
              <th className="py-3 px-3 text-right">Earned Pay</th>
              <th className="py-3 px-2 text-center">Bonus (+)</th>
              <th className="py-3 px-2 text-center">Advance (-)</th>
              <th className="py-3 px-4 text-right">Net Payable</th>
              <th className="py-3 px-3 text-center no-print">Status</th>
              <th className="py-3 px-4 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFC8]">
            {filteredStaff.map((staff) => {
              const row = payrollRows[staff.id] || {};
              const branch = branches.find(b => b.id === staff.branchId);

              return (
                <tr key={staff.id} className="hover:bg-[#FAF7F2]/40 transition">
                  {/* Name & Role */}
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-[#1C1917]">{staff.name}</div>
                    <div className="text-[10px] text-[#78716C]">{staff.role} • {staff.phone}</div>
                  </td>

                  {/* Branch */}
                  <td className="py-3 px-3">
                    <span className="text-[11px] font-bold text-[#44403C]">
                      {branch?.name || 'Counter'}
                    </span>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#1C1917]">
                    <div className="flex items-center justify-end">
                      <span>₹</span>
                      <input
                        type="number"
                        value={row.baseSalary || staff.baseSalary}
                        onChange={(e) => handleRowChange(staff.id, 'baseSalary', e.target.value)}
                        className="w-20 text-right bg-[#FAF7F2] px-1.5 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </td>

                  {/* Days Present */}
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max={workingDays}
                      value={row.daysPresent !== undefined ? row.daysPresent : 24}
                      onChange={(e) => handleRowChange(staff.id, 'daysPresent', e.target.value)}
                      className="w-14 text-center bg-[#FAF7F2] px-1 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono font-bold text-[#15803D]"
                    />
                  </td>

                  {/* Half Days */}
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={row.halfDays !== undefined ? row.halfDays : 0}
                      onChange={(e) => handleRowChange(staff.id, 'halfDays', e.target.value)}
                      className="w-12 text-center bg-[#FAF7F2] px-1 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono font-bold text-[#D97706]"
                    />
                  </td>

                  {/* Per-Day Wage */}
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-[#0284C7] font-semibold">
                    ₹{row.perDayRate || (Number(staff.baseSalary) / workingDays).toFixed(2)}/d
                  </td>

                  {/* Earned Salary */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#1C1917]">
                    ₹{(row.earnedSalary || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Bonus */}
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.bonus || 0}
                      onChange={(e) => handleRowChange(staff.id, 'bonus', e.target.value)}
                      className="w-16 text-center bg-[#FAF7F2] px-1 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono text-[#15803D]"
                    />
                  </td>

                  {/* Advances */}
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.advancesDeducted || 0}
                      onChange={(e) => handleRowChange(staff.id, 'advancesDeducted', e.target.value)}
                      className="w-16 text-center bg-[#FAF7F2] px-1 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono text-red-600"
                    />
                  </td>

                  {/* Net Payable */}
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#15803D]">
                    ₹{(row.netPayable || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center no-print">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      row.paymentStatus === 'Paid'
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                    }`}>
                      {row.paymentStatus || 'Pending'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.paymentStatus !== 'Paid' ? (
                        <button
                          onClick={() => handleMarkPaid(staff.id)}
                          className="px-2 py-1 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] rounded-lg text-[10px] font-extrabold border border-[#86EFAC] transition"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#78716C] font-semibold">
                          {row.paymentMode}
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedPayslipRecord(row)}
                        className="p-1 text-[#0284C7] hover:bg-[#FAF7F2] rounded-lg transition"
                        title="View Individual Pay Slip"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayslipRecord}
        onClose={() => setSelectedPayslipRecord(null)}
        record={selectedPayslipRecord}
        llpProfile={llpProfile}
      />

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFC8]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E8DFC8]">
              <h3 className="text-sm font-extrabold text-[#1C1917]">Add Store Staff Member</h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    placeholder="e.g. Counter Cashier / Assistant"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Assigned Branch Counter *
                  </label>
                  <select
                    value={newStaffForm.branchId}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  >
                    {branches.length === 0 && <option value="">No branches configured</option>}
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Base Monthly Salary (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newStaffForm.baseSalary}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#44403C] text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Staff Member
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
