'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  llpProfile: any;
}

export default function PayslipModal({ isOpen, onClose, record, llpProfile }: PayslipModalProps) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8DFC8] my-8">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex justify-between items-center pb-4 mb-4 border-b border-[#E8DFC8]">
          <div className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Salary Payment Voucher</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0284C7] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#0369A1] transition"
            >
              <Printer className="w-4 h-4" />
              Print Pay Slip
            </button>
            <button onClick={onClose} className="p-1.5 text-[#78716C] hover:text-[#1C1917]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Salary Slip Content */}
        <div id="payslip-printable" className="p-6 bg-[#FAF7F2]/40 rounded-xl border border-[#E8DFC8] space-y-4 font-sans text-xs">
          
          {/* Header */}
          <div className="text-center pb-3 border-b border-[#E8DFC8]">
            <div className="font-extrabold text-base uppercase text-[#1C1917]">
              {llpProfile?.tradeName || llpProfile?.name || 'SALARY PAYMENT VOUCHER'}
            </div>
            {llpProfile?.name && llpProfile?.name !== llpProfile?.tradeName && (
              <div className="text-xs font-bold text-[#44403C]">
                {llpProfile.name}
              </div>
            )}
            <div className="text-[10px] text-[#78716C]">
              {llpProfile?.gstin ? `GSTIN: ${llpProfile.gstin} ` : ''}
              {llpProfile?.llpin ? `| LLPIN: ${llpProfile.llpin}` : ''}
            </div>
            {(llpProfile?.address || llpProfile?.city) && (
              <div className="text-[10px] text-[#78716C] mt-0.5">
                {[llpProfile?.address, llpProfile?.city, llpProfile?.pincode].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="inline-block mt-2 px-3 py-0.5 bg-[#E8DFC8]/60 rounded-full font-black text-[10px] uppercase text-[#1C1917]">
              Salary Voucher for the Month of: {record.monthYear}
            </div>
          </div>

          {/* Employee & Branch Details */}
          <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-[#E8DFC8]">
            <div>
              <div className="text-[#78716C] text-[10px] uppercase font-bold">Employee Name</div>
              <div className="font-extrabold text-sm text-[#1C1917]">{record.staffName}</div>
              <div className="text-[11px] text-[#78716C]">{record.role}</div>
            </div>
            <div>
              <div className="text-[#78716C] text-[10px] uppercase font-bold">Campus Counter</div>
              <div className="font-bold text-xs text-[#1C1917]">{record.branchName}</div>
              <div className="text-[10px] text-[#15803D] font-bold">Payment Status: {record.paymentStatus}</div>
            </div>
          </div>

          {/* Attendance Pro-Rata Table */}
          <div className="bg-white rounded-xl border border-[#E8DFC8] overflow-hidden">
            <div className="bg-[#FAF7F2] px-3 py-1.5 border-b border-[#E8DFC8] font-bold text-[10px] text-[#78716C] uppercase">
              Attendance & Wage Breakdown
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#E8DFC8]">
                <tr>
                  <td className="px-3 py-1.5 text-[#44403C]">Base Monthly Salary:</td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold">₹{Number(record.baseSalary).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-[#44403C]">Total Billable Days in Month:</td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold">{record.workingDaysInMonth} Days</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-[#44403C]">Per-Day Wage Rate:</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#0284C7] font-bold">₹{Number(record.perDayRate).toFixed(2)} / day</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-[#44403C]">
                    Days Present:
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold">
                    {record.daysPresent} Full + {record.halfDays} Half = <span className="text-[#15803D]">{record.effectivePresentDays} Days</span>
                  </td>
                </tr>
                <tr className="bg-[#FAF7F2]/50 font-bold">
                  <td className="px-3 py-2 text-[#1C1917]">Earned Gross Salary:</td>
                  <td className="px-3 py-2 text-right font-mono font-extrabold text-[#1C1917]">₹{Number(record.earnedSalary).toFixed(2)}</td>
                </tr>
                {Number(record.bonus) > 0 && (
                  <tr>
                    <td className="px-3 py-1.5 text-[#15803D]">Special Incentive / Bonus (+):</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[#15803D] font-bold">+₹{Number(record.bonus).toFixed(2)}</td>
                  </tr>
                )}
                {Number(record.advancesDeducted) > 0 && (
                  <tr>
                    <td className="px-3 py-1.5 text-red-600">Advance Salary Adjusted (-):</td>
                    <td className="px-3 py-1.5 text-right font-mono text-red-600 font-bold">-₹{Number(record.advancesDeducted).toFixed(2)}</td>
                  </tr>
                )}
                {Number(record.otherDeductions) > 0 && (
                  <tr>
                    <td className="px-3 py-1.5 text-red-600">Other Deductions / Penalties (-):</td>
                    <td className="px-3 py-1.5 text-right font-mono text-red-600 font-bold">-₹{Number(record.otherDeductions).toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-[#FAF7F2] font-black text-sm">
                  <td className="px-3 py-2.5 text-[#1C1917]">NET SALARY PAYABLE:</td>
                  <td className="px-3 py-2.5 text-right font-mono font-black text-[#15803D]">
                    ₹{Number(record.netPayable).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {record.remarks && (
            <div className="text-[11px] text-[#78716C] bg-white p-2.5 rounded-lg border border-[#E8DFC8]">
              <span className="font-bold">Remarks:</span> {record.remarks}
            </div>
          )}

          {/* Signature Block */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-[#78716C]">
            <div className="border-t border-[#78716C]/40 pt-1 font-bold">
              Employee Signature & Date
            </div>
            <div className="border-t border-[#78716C]/40 pt-1 font-bold">
              Authorised Signatory / Store Manager
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
