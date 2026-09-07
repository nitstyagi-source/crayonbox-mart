'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  QrCode, 
  Receipt, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Sparkles,
  Package,
  Layers,
  UserCheck,
  GraduationCap,
  User,
  Clock,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import ThermalReceipt from '@/components/ThermalReceipt';
import UpiQrModal from '@/components/UpiQrModal';

export default function PosBillingPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>('');
  const [llpProfile, setLlpProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Cart state
  const [cart, setCart] = useState<any[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentGrade, setStudentGrade] = useState<string>('');
  const [studentAdmNo, setStudentAdmNo] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Partial Payment State
  const [partialAmountPaid, setPartialAmountPaid] = useState<number>(0);
  const [partialChannel, setPartialChannel] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [dueDate, setDueDate] = useState<string>('');

  // Modals & Feedback
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isUpiQrOpen, setIsUpiQrOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Student Directory Auto-Lookup (Read-Only from School Roster)
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const searchStudentRoster = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setStudentSearchResults([]);
      setShowStudentDropdown(false);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setStudentSearchResults(data.students);
        setShowStudentDropdown(data.students.length > 0);
      } else {
        setStudentSearchResults([]);
        setShowStudentDropdown(false);
      }
    } catch {
      setStudentSearchResults([]);
      setShowStudentDropdown(false);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  const handleSelectStudent = (std: any) => {
    setStudentName(std.name || '');
    setStudentAdmNo(std.admissionNo || '');
    setStudentGrade(std.grade || '');
    if (std.fatherName) {
      setCustomerName(std.fatherName);
    }
    if (std.phone || std.mobile || std.fatherPhone || std.parentPhone) {
      setCustomerPhone(std.phone || std.mobile || std.fatherPhone || std.parentPhone);
    }
    setShowStudentDropdown(false);
  };

  useEffect(() => {
    // Initial fetch
    Promise.all([
      fetch('/api/catalog').then(res => res.json()),
      fetch('/api/branches').then(res => res.json()),
      fetch('/api/profile').then(res => res.json())
    ]).then(([catalogData, branchesData, profileData]) => {
      setCatalog(catalogData || []);
      setBranches(branchesData || []);
      setLlpProfile(profileData || {});
      
      const savedBranch = localStorage.getItem('active_branch_id');
      const valid = branchesData?.find((b: any) => b.id === savedBranch);
      setActiveBranchId(valid ? valid.id : branchesData?.[0]?.id || '');
    }).catch(console.error);

    const handleBranchChanged = () => {
      const saved = localStorage.getItem('active_branch_id');
      if (saved) setActiveBranchId(saved);
    };
    window.addEventListener('branchChanged', handleBranchChanged);
    return () => window.removeEventListener('branchChanged', handleBranchChanged);
  }, []);

  const dynamicCategories = ['All', ...Array.from(new Set(catalog.map((i: any) => i.category).filter(Boolean)))];

  const filteredCatalog = catalog.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSelectSize = (itemId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: size }));
  };

  const addToCart = (item: any) => {
    const chosenSize = selectedSizes[item.id] || (item.sizes && item.sizes[0]) || 'Std';
    const cartKey = `${item.id}_${chosenSize}`;

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i);
      }
      return [...prev, {
        cartKey,
        itemId: item.id,
        name: item.name,
        category: item.category,
        size: chosenSize,
        price: item.price,
        taxPercent: item.taxPercent || 0,
        quantity: 1,
        total: item.price
      }];
    });
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.cartKey === cartKey) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty, total: newQty * i.price };
        }
        return i;
      });
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  // Tax and Total calculations
  const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = cart.reduce((sum, i) => {
    const tax = (i.total * (i.taxPercent || 0)) / 100;
    return sum + tax;
  }, 0);
  const grandTotal = Math.max(0, Math.round(subtotal + taxAmount - Number(discount || 0)));
  const changeDue = Math.max(0, cashTendered - grandTotal);

  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  const handleCompleteSale = async (overridePaymentMode?: string) => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to bill.');
      return;
    }

    setIsProcessing(true);
    const mode = overridePaymentMode || paymentMode;
    const isPartial = mode === 'Partial';
    const amountPaid = isPartial 
      ? Math.min(grandTotal, Math.max(0, Number(partialAmountPaid) || 0))
      : (mode === 'Cash' ? Math.min(grandTotal, Number(cashTendered) || grandTotal) : grandTotal);
    const balanceDue = Math.max(0, grandTotal - amountPaid);
    const status = balanceDue <= 0 ? 'Completed' : (amountPaid > 0 ? 'Partial' : 'Unpaid');
    const finalPaymentMode = isPartial ? `Partial (${partialChannel})` : mode;

    if (isPartial && balanceDue > 0 && !customerPhone.trim()) {
      alert('Please enter a Customer / Parent Mobile Number so the store can track the outstanding balance due.');
      setIsProcessing(false);
      return;
    }

    const payload = {
      branchId: activeBranch?.id || null,
      customerName: customerName.trim() || 'Parent / Walk-in Customer',
      customerPhone: customerPhone.trim(),
      studentName: studentName.trim(),
      studentGrade: studentGrade.trim(),
      studentAdmNo: studentAdmNo.trim(),
      items: cart,
      subtotal,
      taxAmount,
      discount: Number(discount) || 0,
      totalAmount: grandTotal,
      amountPaid,
      balanceDue,
      status,
      dueDate: dueDate || null,
      paymentMode: finalPaymentMode,
      cashReceived: mode === 'Cash' ? cashTendered : amountPaid,
      changeGiven: mode === 'Cash' ? changeDue : 0
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setLastInvoice(data.invoice);
        setIsReceiptOpen(true);
        setIsUpiQrOpen(false);
        // Clear Cart & inputs
        setCart([]);
        setStudentName('');
        setStudentAdmNo('');
        setCustomerName('');
        setCustomerPhone('');
        setDiscount(0);
        setCashTendered(0);
        setPartialAmountPaid(0);
        setDueDate('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to complete sale. Check network.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#0284C7]" />
            Cashier POS Counter Billing
          </h1>
          <div className="text-xs text-[#78716C] mt-0.5 flex items-center gap-2">
            <span>Counter: <strong className="text-[#1C1917]">{activeBranch?.name || 'Main Counter'}</strong> {activeBranch?.code ? `(${activeBranch.code})` : ''}</span>
            <span>•</span>
            <span className="text-[#15803D] font-bold">● Standalone LLP Billing Terminal</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item, uniform size, book kit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7] shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Catalog Items (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-white border border-[#E8DFC8] text-[#44403C] hover:bg-[#FAF7F2]'
                }`}
              >
                {cat === 'All' ? '🛍️ All Items' : cat}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {filteredCatalog.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E8DFC8] p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-[#78716C] mx-auto opacity-40" />
              <div className="font-extrabold text-sm text-[#1C1917]">No Items in Catalog Yet</div>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                Visit the &quot;Uniforms & Books&quot; catalog tab to add products, uniform size variants, or book kits.
              </p>
              <a
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Add Products to Catalog
              </a>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredCatalog.map(item => {
              const currentSize = selectedSizes[item.id] || (item.sizes && item.sizes[0]);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#E8DFC8] p-4 shadow-2xs hover:border-[#0284C7] transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        item.category === 'Uniform' 
                          ? 'bg-[#EFF6FF] text-[#0284C7]' 
                          : item.category === 'Book Bundle' 
                          ? 'bg-[#FEF3C7] text-[#D97706]' 
                          : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}>
                        {item.category} • GST {item.taxPercent}%
                      </span>
                      <span className="text-[10px] text-[#78716C] font-mono">{item.sku}</span>
                    </div>

                    <h4 className="text-xs font-extrabold text-[#1C1917] leading-tight mb-2">
                      {item.name}
                    </h4>

                    {/* Size Selector */}
                    {item.sizes && item.sizes.length > 1 && (
                      <div className="mb-3">
                        <span className="text-[10px] text-[#78716C] font-bold block mb-1">Select Size / Variant:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.sizes.map((sz: string) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleSelectSize(item.id, sz)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                                currentSize === sz
                                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                                  : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFC8] hover:border-[#78716C]'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Add button */}
                  <div className="pt-2 border-t border-[#E8DFC8] flex items-center justify-between mt-2">
                    <div>
                      <div className="text-sm font-black text-[#1C1917]">₹{item.price}</div>
                      {item.mrp > item.price && (
                        <div className="text-[10px] text-[#78716C] line-through">MRP: ₹{item.mrp}</div>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#0284C7] text-[#0284C7] hover:text-white border border-[#E8DFC8] hover:border-transparent rounded-xl text-xs font-bold transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Bill
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Right Column: Billing & Cart Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8DFC8] p-5 shadow-sm space-y-4 sticky top-20">
          
          <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC8]">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D97706]" />
              <span className="text-xs font-black uppercase text-[#1C1917] tracking-wider">Current Bill</span>
            </div>
            <span className="text-xs font-bold text-[#0284C7] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>

          {/* Student Tagging Inputs with Read-Only ERP Directory Auto-Lookup */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFC8] space-y-2 text-xs relative">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#78716C] uppercase">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#0284C7]" />
                Student Tagging &amp; ERP Roster Lookup
              </span>
              {isSearchingStudents && (
                <span className="text-[10px] text-[#0284C7] font-semibold animate-pulse">Searching Roster...</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Admission No (Search ERP)"
                  value={studentAdmNo}
                  onChange={(e) => {
                    setStudentAdmNo(e.target.value);
                    searchStudentRoster(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Student Name (Search ERP)"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    searchStudentRoster(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Auto-Complete Dropdown */}
            {showStudentDropdown && studentSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#0284C7]/40 rounded-xl shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto divide-y divide-stone-100">
                <div className="text-[10px] font-bold text-[#0284C7] px-2 py-1 bg-sky-50/70 rounded-lg mb-1 flex items-center justify-between">
                  <span>Found in School Roster (Click to Auto-fill):</span>
                  <button type="button" onClick={() => setShowStudentDropdown(false)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>
                {studentSearchResults.map((std: any) => (
                  <button
                    key={std.id || std.admissionNo}
                    type="button"
                    onClick={() => handleSelectStudent(std)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded-lg flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{std.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {std.admissionNo}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {std.grade} {std.fatherName ? `• Parent: ${std.fatherName}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#0284C7] bg-sky-100/60 px-2 py-0.5 rounded-full">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Class / Grade (e.g. Class 3-A)"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
              />
              <input
                type="text"
                placeholder="Parent / Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <input
                type="tel"
                placeholder="Customer / Parent Mobile # (Required for Partial / Due)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1 bg-white border border-[#E8DFC8] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-[#E8DFC8]/60">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-[#78716C] text-xs">
                No items added yet. Click &quot;Add to Bill&quot; from catalog.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartKey} className="pt-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-[#1C1917] truncate">{item.name}</div>
                    <div className="text-[10px] text-[#78716C]">
                      Size: <strong className="text-[#1C1917]">{item.size}</strong> • ₹{item.price} ea (GST {item.taxPercent}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.cartKey, -1)}
                      className="w-5 h-5 rounded-md bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center text-xs font-bold hover:bg-gray-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartKey, 1)}
                      className="w-5 h-5 rounded-md bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center text-xs font-bold hover:bg-gray-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right w-16">
                    <div className="font-extrabold text-xs text-[#1C1917]">₹{item.total}</div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartKey)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Calculations Summary */}
          <div className="pt-3 border-t border-[#E8DFC8] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#78716C]">
              <span>Items Subtotal:</span>
              <span className="font-mono font-bold text-[#1C1917]">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#78716C]">
              <span>Estimated GST (CGST + SGST):</span>
              <span className="font-mono font-bold text-[#1C1917]">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[#78716C]">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-20 text-right bg-[#FAF7F2] px-1.5 py-0.5 border border-[#E8DFC8] rounded text-xs font-mono font-bold"
              />
            </div>
            <div className="flex justify-between text-base font-black text-[#1C1917] pt-2 border-t border-[#E8DFC8]">
              <span>NET PAYABLE:</span>
              <span className="text-[#15803D] font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="pt-2 border-t border-[#E8DFC8]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">Payment Mode</span>
              {paymentMode === 'Partial' && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Partial / Due Bill
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                  paymentMode === 'UPI'
                    ? 'bg-[#EFF6FF] text-[#0284C7] border-[#0284C7] ring-1 ring-[#0284C7]'
                    : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFC8] hover:bg-sky-50/50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                  paymentMode === 'Cash'
                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D] ring-1 ring-[#15803D]'
                    : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFC8] hover:bg-emerald-50/50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Card')}
                className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                  paymentMode === 'Card'
                    ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706] ring-1 ring-[#D97706]'
                    : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFC8] hover:bg-amber-50/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMode('Partial');
                  if (partialAmountPaid === 0) {
                    setPartialAmountPaid(Math.round(grandTotal / 2));
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                  paymentMode === 'Partial'
                    ? 'bg-amber-100 text-amber-900 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFC8] hover:bg-amber-50/50'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-700" />
                Partial / Due
              </button>
            </div>

            {/* Cash Tendered Calculator */}
            {paymentMode === 'Cash' && (
              <div className="mt-3 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#78716C] font-bold">Cash Received:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    placeholder="₹ Received"
                    className="w-24 text-right bg-white px-2 py-1 border border-[#E8DFC8] rounded text-xs font-mono font-bold"
                  />
                </div>
                {cashTendered > 0 && (
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#15803D]">Change to Return:</span>
                    <span className="font-mono text-[#15803D]">₹{changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Partial / Due Payment Configurator */}
            {paymentMode === 'Partial' && (
              <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-900 font-extrabold text-[11px]">Advance / Partial Paid Now:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      ₹{Number(partialAmountPaid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={partialAmountPaid || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(grandTotal, Number(e.target.value) || 0));
                        setPartialAmountPaid(val);
                      }}
                      placeholder="Enter amount paid today"
                      className="w-full pl-6 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Quick percentage / preset buttons */}
                  <div className="grid grid-cols-5 gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPartialAmountPaid(0)}
                      className="px-1.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold text-stone-700"
                    >
                      ₹0 (Full Due)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartialAmountPaid(Math.round(grandTotal * 0.25))}
                      className="px-1.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold text-stone-700"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartialAmountPaid(Math.round(grandTotal * 0.5))}
                      className="px-1.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold text-stone-700"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartialAmountPaid(Math.round(grandTotal * 0.75))}
                      className="px-1.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold text-stone-700"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartialAmountPaid(grandTotal)}
                      className="px-1.5 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold text-stone-700"
                    >
                      100%
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Paid Via Mode:</label>
                    <select
                      value={partialChannel}
                      onChange={(e) => setPartialChannel(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Balance Due Date:</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 flex justify-between items-center bg-white/70 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Outstanding Due:</span>
                  </div>
                  <span className="font-mono font-black text-red-600 text-sm">
                    ₹{Math.max(0, grandTotal - (Number(partialAmountPaid) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {(paymentMode === 'UPI' || (paymentMode === 'Partial' && partialChannel === 'UPI')) && (
              <button
                onClick={() => setIsUpiQrOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                Show Dynamic UPI QR Code (₹{paymentMode === 'Partial' ? partialAmountPaid : grandTotal})
              </button>
            )}

            <button
              onClick={() => handleCompleteSale()}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-3 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                paymentMode === 'Partial' && (grandTotal - (Number(partialAmountPaid) || 0) > 0)
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#15803D] hover:bg-[#166534]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isProcessing 
                ? 'Processing Sale...' 
                : paymentMode === 'Partial' && (grandTotal - (Number(partialAmountPaid) || 0) > 0)
                  ? `Complete Partial Sale (Paid: ₹${partialAmountPaid} • Due: ₹${grandTotal - partialAmountPaid})`
                  : `Complete Sale & Print Tax Invoice (₹${grandTotal})`
              }
            </button>
          </div>

        </div>

      </div>

      {/* UPI QR Modal */}
      <UpiQrModal
        isOpen={isUpiQrOpen}
        onClose={() => setIsUpiQrOpen(false)}
        onConfirmPayment={() => handleCompleteSale('UPI')}
        amount={grandTotal}
        invoiceNo={activeBranch ? `${llpProfile?.invoicePrefix || 'INV'}/${activeBranch.code}` : (llpProfile?.invoicePrefix || 'INV')}
        upiId={llpProfile?.upiVpa || llpProfile?.upiId || ''}
        payeeName={llpProfile?.brandName || llpProfile?.entityName || 'LLP Store'}
      />

      {/* Thermal / A4 Printable Receipt Modal */}
      <ThermalReceipt
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={lastInvoice}
        llpProfile={llpProfile}
      />

    </div>
  );
}
