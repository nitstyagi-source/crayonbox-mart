'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Calendar, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
import ThermalReceipt from '@/components/ThermalReceipt';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [llpProfile, setLlpProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(console.error);

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setLlpProfile(data))
      .catch(console.error);
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    return inv.invoiceNumber.toLowerCase().includes(term) ||
           (inv.studentName && inv.studentName.toLowerCase().includes(term)) ||
           (inv.customerName && inv.customerName.toLowerCase().includes(term));
  });

  const totalSalesRevenue = filteredInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0284C7]" />
            Sales Ledger & Invoices History
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Complete transaction register with sequential invoice numbers and 1-click re-print vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#E8DFC8] text-right">
            <div className="text-[10px] text-[#78716C] font-bold uppercase">Total Invoiced Sales</div>
            <div className="text-base font-black text-[#15803D] font-mono">₹{totalSalesRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E8DFC8] shadow-2xs flex justify-between items-center">
        <div className="text-xs font-extrabold text-[#1C1917]">
          Showing {filteredInvoices.length} Invoices
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-x-auto">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78716C] space-y-2">
            <FileText className="w-8 h-8 text-[#78716C] mx-auto opacity-40" />
            <div className="font-bold text-[#1C1917]">No Invoices Generated Yet</div>
            <p>Completed sales from the POS terminal will appear here automatically with full re-print capabilities.</p>
          </div>
        ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFC8] text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
              <th className="py-3 px-4">Invoice Number</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Campus Branch</th>
              <th className="py-3 px-3">Student / Parent</th>
              <th className="py-3 px-3">Items Sold</th>
              <th className="py-3 px-3">Mode</th>
              <th className="py-3 px-4 text-right">Total Paid</th>
              <th className="py-3 px-4 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFC8]">
            {filteredInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-[#FAF7F2]/40 transition">
                <td className="py-3 px-4 font-mono font-bold text-[#0284C7]">
                  {inv.invoiceNumber}
                </td>
                <td className="py-3 px-3 text-[#78716C]">
                  {new Date(inv.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="py-3 px-3 font-semibold text-[#1C1917]">
                  {inv.branchName}
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold text-[#1C1917]">{inv.studentName || inv.customerName}</div>
                  {inv.studentGrade && <div className="text-[10px] text-[#78716C]">{inv.studentGrade}</div>}
                </td>
                <td className="py-3 px-3 text-[#44403C]">
                  {inv.items?.length || 1} Item(s)
                </td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DFC8] text-[#1C1917]">
                    {inv.paymentMode}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#15803D]">
                  ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#FAF7F2] hover:bg-[#0284C7] text-[#0284C7] hover:text-white border border-[#E8DFC8] hover:border-transparent rounded-lg text-xs font-bold transition shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Thermal Receipt Modal */}
      <ThermalReceipt
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        llpProfile={llpProfile}
      />

    </div>
  );
}
