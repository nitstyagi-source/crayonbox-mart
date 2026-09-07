'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Calendar, 
  Building2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Phone,
  Banknote,
  QrCode,
  CreditCard,
  X
} from 'lucide-react';
import ThermalReceipt from '@/components/ThermalReceipt';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [llpProfile, setLlpProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Collect balance payment modal state
  const [collectingInvoice, setCollectingInvoice] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [collectNote, setCollectNote] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoices();
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setLlpProfile(data))
      .catch(console.error);
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(term) ||
      (inv.studentName && inv.studentName.toLowerCase().includes(term)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
      (inv.customerPhone && inv.customerPhone.toLowerCase().includes(term));

    const balanceDue = Number(inv.balanceDue || 0);
    if (!matchesSearch) return false;

    if (statusFilter === 'due') {
      return balanceDue > 0;
    }
    if (statusFilter === 'paid') {
      return balanceDue <= 0;
    }
    return true;
  });

  const totalSalesRevenue = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalAmountCollected = invoices.reduce((sum, i) => {
    const paid = i.amountPaid !== undefined ? Number(i.amountPaid) : Number(i.totalAmount);
    return sum + (paid || 0);
  }, 0);
  const totalOutstandingDue = invoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
  const totalDueInvoicesCount = invoices.filter(i => Number(i.balanceDue || 0) > 0).length;

  const handleOpenCollect = (inv: any) => {
    setCollectingInvoice(inv);
    setCollectAmount(Number(inv.balanceDue) || 0);
    setCollectMode('Cash');
    setCollectNote('');
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingInvoice) return;
    if (collectAmount <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }
    if (collectAmount > Number(collectingInvoice.balanceDue)) {
      alert(`Amount cannot exceed the balance due of ₹${collectingInvoice.balanceDue}`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: collectingInvoice.id,
          paymentAmount: collectAmount,
          paymentMode: collectMode,
          note: collectNote || 'Due installment collection'
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update local list
        setInvoices(prev => prev.map(inv => inv.id === data.invoice.id ? data.invoice : inv));
        // Auto open updated receipt
        setSelectedInvoice(data.invoice);
        setCollectingInvoice(null);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating payment. Check network.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0284C7]" />
            Sales Ledger & Invoices History
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Complete transaction register with partial payments, installment collections, and 1-click re-print vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8DFC8]">
            <div className="text-[10px] text-[#78716C] font-bold uppercase">Total Invoiced</div>
            <div className="text-base font-black text-[#1C1917] font-mono">₹{totalSalesRevenue.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-[#DCFCE7] px-3.5 py-2 rounded-xl border border-[#86EFAC]">
            <div className="text-[10px] text-emerald-800 font-bold uppercase">Total Collected</div>
            <div className="text-base font-black text-emerald-700 font-mono">₹{totalAmountCollected.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
            <div className="text-[10px] text-amber-800 font-bold uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              Outstanding Dues ({totalDueInvoicesCount})
            </div>
            <div className="text-base font-black text-red-600 font-mono">₹{totalOutstandingDue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E8DFC8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFC8] self-start">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'due'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            Balance Due ({totalDueInvoicesCount})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'paid'
                ? 'bg-[#15803D] text-white shadow-xs'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Fully Paid
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, student, mobile..."
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
            <div className="font-bold text-[#1C1917]">No Invoices Match the Filter</div>
            <p>Try switching filter tabs or clearing your search term.</p>
          </div>
        ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFC8] text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
              <th className="py-3 px-4">Invoice Number</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Campus Branch</th>
              <th className="py-3 px-3">Student / Parent</th>
              <th className="py-3 px-3">Status / Mode</th>
              <th className="py-3 px-3 text-right">Bill Total</th>
              <th className="py-3 px-3 text-right">Amount Paid</th>
              <th className="py-3 px-3 text-right">Balance Due</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFC8]">
            {filteredInvoices.map(inv => {
              const totalAmt = Number(inv.totalAmount) || 0;
              const paidAmt = inv.amountPaid !== undefined ? Number(inv.amountPaid) : totalAmt;
              const dueAmt = Number(inv.balanceDue || 0);
              const isDue = dueAmt > 0;

              return (
                <tr key={inv.id} className="hover:bg-[#FAF7F2]/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#0284C7]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-[#78716C]">
                    <div>{new Date(inv.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    {inv.dueDate && isDue && (
                      <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#1C1917]">
                    {inv.branchName}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#1C1917]">{inv.studentName || inv.customerName}</div>
                    <div className="text-[10px] text-[#78716C] flex items-center gap-1">
                      {inv.studentGrade && <span>{inv.studentGrade}</span>}
                      {inv.customerPhone && (
                        <span className="font-mono text-stone-600 flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5 text-stone-400" />
                          {inv.customerPhone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      {isDue ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 w-fit flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                          Partial (Due: ₹{dueAmt})
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Fully Paid
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-[#78716C]">
                        {inv.paymentMode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-xs text-[#1C1917]">
                    ₹{totalAmt.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-xs text-emerald-700">
                    ₹{paidAmt.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-xs">
                    {isDue ? (
                      <span className="text-red-600">₹{dueAmt.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-stone-400">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {isDue && (
                      <button
                        onClick={() => handleOpenCollect(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition shadow-2xs"
                        title="Record payment of outstanding due"
                      >
                        <PlusCircle className="w-3 h-3 text-amber-600" />
                        Collect
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#0284C7] text-[#0284C7] hover:text-white border border-[#E8DFC8] hover:border-transparent rounded-lg text-xs font-bold transition shadow-2xs"
                    >
                      <Printer className="w-3 h-3" />
                      Print
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Collect Balance Modal */}
      {collectingInvoice && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-sm">Collect Outstanding Due</h3>
                  <div className="text-[11px] opacity-90 font-mono">
                    Invoice #{collectingInvoice.invoiceNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCollectingInvoice(null)}
                className="text-white hover:opacity-80 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-4 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Customer / Student:</span>
                  <span className="text-stone-900">{collectingInvoice.studentName || collectingInvoice.customerName}</span>
                </div>
                {collectingInvoice.customerPhone && (
                  <div className="flex justify-between font-bold text-stone-700">
                    <span>Phone:</span>
                    <span className="font-mono text-stone-900">{collectingInvoice.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-stone-700 pt-1 border-t border-amber-200/60">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono">₹{collectingInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Already Paid:</span>
                  <span className="font-mono">₹{collectingInvoice.amountPaid || 0}</span>
                </div>
                <div className="flex justify-between font-black text-red-600 text-sm pt-1 border-t border-amber-200/60">
                  <span>Current Outstanding Due:</span>
                  <span className="font-mono">₹{collectingInvoice.balanceDue}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-stone-800 block mb-1">
                  Collection Amount (₹):
                </label>
                <input
                  type="number"
                  min="1"
                  max={collectingInvoice.balanceDue}
                  value={collectAmount || ''}
                  onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  required
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Number(collectingInvoice.balanceDue))}
                    className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 rounded text-[10px] font-bold text-stone-700"
                  >
                    Collect Full Due (₹{collectingInvoice.balanceDue})
                  </button>
                  {Number(collectingInvoice.balanceDue) > 500 && (
                    <button
                      type="button"
                      onClick={() => setCollectAmount(Math.round(Number(collectingInvoice.balanceDue) / 2))}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 rounded text-[10px] font-bold text-stone-700"
                    >
                      50% (₹{Math.round(Number(collectingInvoice.balanceDue) / 2)})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-stone-800 block mb-1">
                  Payment Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectMode('Cash')}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      collectMode === 'Cash'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectMode('UPI')}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      collectMode === 'UPI'
                        ? 'bg-sky-100 text-[#0284C7] border-[#0284C7]'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectMode('Card')}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      collectMode === 'Card'
                        ? 'bg-amber-100 text-amber-800 border-amber-500'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Card
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-stone-800 block mb-1">
                  Note / Remarks (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via father GPay / cash counter"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingInvoice(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Saving...' : `Confirm ₹${collectAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
