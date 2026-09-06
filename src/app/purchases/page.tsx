'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Plus, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  RefreshCw, 
  X, 
  FileCheck, 
  Receipt,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface PurchaseItem {
  itemId?: string;
  name: string;
  category: string;
  size?: string;
  quantity: number;
  purchasePrice: number;
  price: number;
  taxPercent: number;
  total: number;
}

interface PurchaseBill {
  id: string;
  vendor_name: string;
  vendor_gstin?: string;
  vendor_phone?: string;
  bill_number: string;
  bill_date: string;
  branch_id?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_mode: string;
  attachment_data?: string;
  attachment_name?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingBill, setViewingBill] = useState<PurchaseBill | null>(null);

  // Add Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);

  // File Upload State
  const [attachmentData, setAttachmentData] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Line items state
  const [items, setItems] = useState<PurchaseItem[]>([
    { name: '', category: 'Uniform', size: '', quantity: 10, purchasePrice: 0, price: 0, taxPercent: 0, total: 0 }
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchBranches();
    fetchCatalog();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases || []);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to load purchase bills' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Could not connect to purchases API' });
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
        if (data.length > 0 && !branchId) {
          setBranchId(data[0].id);
        }
      }
    } catch {}
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCatalog(data);
      }
    } catch {}
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setIsUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
      setAttachmentName(file.name);
      setIsUploadingFile(false);
    };
    reader.onerror = () => {
      alert('Failed to read file.');
      setIsUploadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentData('');
    setAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof PurchaseItem, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: val };
      
      // Auto compute total
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.purchasePrice) || 0;
      it.total = qty * rate;

      // If user selected an existing catalog item, pre-fill category and selling price
      if (field === 'name') {
        const matched = catalog.find(c => c.name.toLowerCase() === String(val).toLowerCase());
        if (matched) {
          it.itemId = matched.id;
          it.category = matched.category || it.category;
          it.price = matched.price || it.price;
          it.taxPercent = matched.taxPercent || it.taxPercent;
          if (matched.costPrice) it.purchasePrice = matched.costPrice;
          it.total = qty * (Number(it.purchasePrice) || 0);
        }
      }

      copy[index] = it;
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { name: '', category: 'Uniform', size: '', quantity: 10, purchasePrice: 0, price: 0, taxPercent: 0, total: 0 }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Financial calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const taxAmount = items.reduce((sum, it) => {
    const itemTotal = Number(it.total) || 0;
    const rate = Number(it.taxPercent) || 0;
    return sum + (itemTotal * rate) / 100;
  }, 0);
  const totalAmount = Math.round(subtotal + taxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setFeedback({ type: 'error', message: 'Supplier/Vendor name is required' });
      return;
    }
    if (!billNumber.trim()) {
      setFeedback({ type: 'error', message: 'Bill/Invoice number is required' });
      return;
    }
    const validItems = items.filter(i => i.name.trim() && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Please enter at least one valid item with name and quantity' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const payload = {
        vendorName: vendorName.trim(),
        vendorGstin: vendorGstin.trim(),
        vendorPhone: vendorPhone.trim(),
        billNumber: billNumber.trim(),
        billDate,
        branchId: branchId || null,
        items: validItems,
        subtotal,
        taxAmount,
        totalAmount,
        paymentStatus,
        paymentMode,
        attachmentData,
        attachmentName,
        notes,
        autoUpdateStock
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ 
          type: 'success', 
          message: `Purchase Bill #${billNumber} recorded successfully! Inward items added to stock.` 
        });
        setShowAddModal(false);
        // Reset form
        setVendorName('');
        setVendorGstin('');
        setVendorPhone('');
        setBillNumber('');
        setAttachmentData('');
        setAttachmentName('');
        setNotes('');
        setItems([{ name: '', category: 'Uniform', size: '', quantity: 10, purchasePrice: 0, price: 0, taxPercent: 0, total: 0 }]);
        fetchPurchases();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save purchase bill' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Network error saving purchase bill' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, billNo: string) => {
    if (!confirm(`Are you sure you want to delete purchase bill #${billNo}?`)) return;

    try {
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Purchase bill #${billNo} removed.` });
        fetchPurchases();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error deleting bill' });
    }
  };

  // Metrics
  const totalBillsCount = purchases.length;
  const totalSpend = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalUnits = purchases.reduce((sum, p) => {
    return sum + (Array.isArray(p.items) ? p.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0) : 0);
  }, 0);
  const pendingBillsCount = purchases.filter(p => p.payment_status?.toLowerCase().includes('credit') || p.payment_status?.toLowerCase().includes('pending')).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DFC8]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Store Inward Inventory & Supplier Bills</span>
          </div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight mt-1">Purchase Bills & Stock Inward</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Record inward invoices from uniform tailors & book publishers. Upload bill copies and auto-increment stock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPurchases}
            className="p-2.5 rounded-xl border border-[#E8DFC8] bg-white text-[#44403C] hover:bg-[#FAF7F2] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload &amp; Record Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold ${
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
            <Receipt className="w-5 h-5 text-stone-400" />
          </div>
          <div className="text-3xl font-black text-[#1C1917] mt-2">₹{totalSpend.toLocaleString('en-IN')}</div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">Cumulative cost of inward stock</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Inward Bills Logged</span>
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-950 mt-2">{totalBillsCount}</div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Supplier invoices recorded</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Total Inward Units</span>
            <Layers className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-950 mt-2">{totalUnits.toLocaleString('en-IN')}</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">Books, uniforms &amp; accessories</div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Credit Bills</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-950 mt-2">{pendingBillsCount}</div>
          <div className="text-xs text-rose-700 mt-1 font-medium">Supplier bills awaiting payment</div>
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white border border-[#E8DFC8] rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-[#E8DFC8] bg-[#FAF7F2] flex items-center justify-between">
          <h2 className="font-extrabold text-base text-[#1C1917] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D97706]" />
            <span>Supplier Invoices &amp; Inward Consignments</span>
          </h2>
          <span className="text-xs font-semibold text-[#78716C]">
            Showing {purchases.length} {purchases.length === 1 ? 'bill' : 'bills'}
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Truck className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-extrabold text-[#1C1917]">No Purchase Bills Logged Yet</h3>
            <p className="text-xs text-[#78716C] max-w-md mx-auto">
              Whenever you receive uniform consignments or book bundle consignments from vendors, log the invoice here to immediately increase your counter stock.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Purchase Bill</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8DFC8] bg-[#FAF7F2]/50 text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Bill / Invoice #</th>
                  <th className="py-3.5 px-6">Vendor / Supplier</th>
                  <th className="py-3.5 px-6">Bill Date</th>
                  <th className="py-3.5 px-6">Inward Items</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Payment</th>
                  <th className="py-3.5 px-6">Bill Doc</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC8] text-sm">
                {purchases.map((bill) => {
                  const itemsCount = Array.isArray(bill.items) 
                    ? bill.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
                    : 0;

                  return (
                    <tr key={bill.id} className="hover:bg-[#FAF7F2]/40 transition">
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-[#1C1917] font-mono">{bill.bill_number}</div>
                        <div className="text-[10px] text-[#78716C] font-mono">{bill.id}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-[#1C1917]">{bill.vendor_name}</div>
                        {bill.vendor_gstin && (
                          <div className="text-[10px] text-[#78716C] font-mono">GST: {bill.vendor_gstin}</div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-[#44403C]">
                        {new Date(bill.bill_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>{itemsCount} units ({bill.items?.length || 0} types)</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-[#1C1917]">
                        ₹{Number(bill.total_amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bill.payment_status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {bill.payment_status} • {bill.payment_mode}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {bill.attachment_data ? (
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            <span>Attached</span>
                          </button>
                        ) : (
                          <span className="text-xs text-stone-400">No copy</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="p-1.5 rounded-lg border border-[#E8DFC8] bg-white hover:bg-[#FAF7F2] text-stone-700 transition cursor-pointer"
                            title="View Inward Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(bill.id, bill.bill_number)}
                            className="p-1.5 rounded-lg border border-[#E8DFC8] bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 transition cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RECORD PURCHASE BILL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#E8DFC8] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1C1917]">Record Inward Purchase Bill</h3>
                  <p className="text-xs text-[#78716C]">Log supplier invoice, upload document &amp; auto-increment stock</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              
              {/* Section 1: Supplier & Bill Details */}
              <div className="bg-[#FAF7F2]/60 p-4 rounded-2xl border border-[#E8DFC8] space-y-4">
                <div className="text-xs font-black uppercase text-[#D97706] tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Supplier &amp; Invoice Header</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Supplier / Vendor Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Oxford Press or City Tailors"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Bill / Invoice Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-2026-902"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Bill Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Vendor GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="07AAAAA0000A1Z5"
                      value={vendorGstin}
                      onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Vendor Phone
                    </label>
                    <input
                      type="text"
                      placeholder="98XXXXXXXX"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-bold focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                      <option value="Paid">Paid in Full</option>
                      <option value="Credit / Pending">Credit / Pending</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-bold focus:outline-none focus:border-[#D97706] cursor-pointer"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Upload Bill Document */}
              <div className="bg-[#FAF7F2]/60 p-4 rounded-2xl border border-[#E8DFC8] space-y-3">
                <div className="text-xs font-black uppercase text-[#0284C7] tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>2. Upload Purchase Bill Copy (Photo or PDF)</span>
                </div>

                {attachmentData ? (
                  <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-extrabold text-[#1C1917] truncate max-w-sm">
                          {attachmentName}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Bill document uploaded &amp; ready to attach
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-[#E8DFC8] hover:border-[#D97706] bg-white rounded-xl p-5 text-center transition cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-[#1C1917]">
                      {isUploadingFile ? 'Reading file...' : 'Click to upload vendor invoice or drag & drop'}
                    </div>
                    <div className="text-[10px] text-[#78716C] mt-0.5">
                      Accepts PDF documents, scanned bills, or camera photos (PNG, JPG up to 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Line Items Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase text-[#15803D] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>3. Inward Products &amp; Quantities</span>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-extrabold text-[#D97706] hover:text-[#B45309] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Product</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF7F2]/60 rounded-xl border border-[#E8DFC8] grid grid-cols-12 gap-2 items-center">
                      
                      {/* Item Name */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[9px] font-bold text-[#78716C] uppercase mb-0.5">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Class 1 Book Bundle or Uniform Shirt"
                          value={it.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D97706]"
                        />
                      </div>

                      {/* Category */}
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[9px] font-bold text-[#78716C] uppercase mb-0.5">
                          Category
                        </label>
                        <select
                          value={it.category}
                          onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-bold focus:outline-none focus:border-[#D97706] cursor-pointer"
                        >
                          <option value="Uniform">Uniform</option>
                          <option value="Book Bundle">Book Bundle</option>
                          <option value="Stationery">Stationery</option>
                          <option value="Bag / Bottle">Bag / Bottle</option>
                          <option value="Accessory">Accessory</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[9px] font-bold text-[#78716C] uppercase mb-0.5">
                          Qty Inward *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-bold text-center focus:outline-none focus:border-[#D97706]"
                        />
                      </div>

                      {/* Purchase Cost Rate */}
                      <div className="col-span-5 sm:col-span-2">
                        <label className="block text-[9px] font-bold text-[#78716C] uppercase mb-0.5">
                          Buying Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.purchasePrice}
                          onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-bold text-right focus:outline-none focus:border-[#D97706]"
                        />
                      </div>

                      {/* Selling Price / MRP */}
                      <div className="col-span-5 sm:col-span-1">
                        <label className="block text-[9px] font-bold text-[#78716C] uppercase mb-0.5">
                          Selling (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="MRP"
                          value={it.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-bold text-right focus:outline-none focus:border-[#D97706]"
                        />
                      </div>

                      {/* Remove Row */}
                      <div className="col-span-2 sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                          className="text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Bill Totals Summary */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoStock"
                      checked={autoUpdateStock}
                      onChange={(e) => setAutoUpdateStock(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D97706] focus:ring-[#D97706]"
                    />
                    <label htmlFor="autoStock" className="text-xs font-bold text-[#1C1917] cursor-pointer">
                      Automatically add/increment stock in Store Inventory
                    </label>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-xs text-[#78716C]">
                      Subtotal: <span className="font-mono font-bold text-[#1C1917]">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-sm font-black text-[#1C1917]">
                      Grand Total: <span className="text-[#D97706]">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Bill & Update Stock'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PURCHASE DETAILS & BILL DOCUMENT */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#E8DFC8] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-extrabold text-base text-[#1C1917]">
                  Purchase Bill #{viewingBill.bill_number}
                </h3>
              </div>
              <button 
                onClick={() => setViewingBill(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFC8] text-xs">
                <div>
                  <span className="text-[#78716C] block text-[10px] uppercase font-bold">Supplier</span>
                  <strong className="text-[#1C1917]">{viewingBill.vendor_name}</strong>
                </div>
                <div>
                  <span className="text-[#78716C] block text-[10px] uppercase font-bold">Date</span>
                  <strong className="text-[#1C1917]">{viewingBill.bill_date}</strong>
                </div>
                <div>
                  <span className="text-[#78716C] block text-[10px] uppercase font-bold">Payment</span>
                  <span className="font-bold text-emerald-700">{viewingBill.payment_status} ({viewingBill.payment_mode})</span>
                </div>
                <div>
                  <span className="text-[#78716C] block text-[10px] uppercase font-bold">Total Bill</span>
                  <strong className="text-[#D97706] text-sm">₹{Number(viewingBill.total_amount).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <div className="text-xs font-bold text-[#44403C] uppercase tracking-wider mb-2">
                  Inward Items Breakdown:
                </div>
                <div className="border border-[#E8DFC8] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF7F2] text-[10px] uppercase font-bold text-[#78716C] border-b border-[#E8DFC8]">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Cost Rate</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFC8]">
                      {viewingBill.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-[#1C1917]">{it.name}</td>
                          <td className="p-2.5 text-[#78716C]">{it.category}</td>
                          <td className="p-2.5 text-center font-extrabold">{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono">₹{Number(it.purchasePrice).toFixed(2)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{Number(it.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attached Document Preview / Download */}
              {viewingBill.attachment_data ? (
                <div className="space-y-2 pt-2 border-t border-[#E8DFC8]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#44403C] uppercase tracking-wider">
                      Attached Vendor Invoice Document:
                    </span>
                    <a
                      href={viewingBill.attachment_data}
                      download={viewingBill.attachment_name || `Bill_${viewingBill.bill_number}`}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0284C7] hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>

                  {viewingBill.attachment_data.startsWith('data:image/') ? (
                    <div className="max-h-80 overflow-y-auto rounded-xl border border-[#E8DFC8] bg-[#FAF7F2] p-2 flex justify-center">
                      <img
                        src={viewingBill.attachment_data}
                        alt="Bill Document Preview"
                        className="max-h-72 object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-stone-800">{viewingBill.attachment_name || 'Vendor Invoice PDF'}</span>
                      </div>
                      <a
                        href={viewingBill.attachment_data}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#0284C7] text-white text-xs font-bold rounded-lg hover:bg-[#0369A1] transition"
                      >
                        Open Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
                  No bill document image or PDF was attached for this consignment.
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setViewingBill(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
