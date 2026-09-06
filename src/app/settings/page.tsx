'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Receipt, 
  CreditCard, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>({
    name: '',
    tradeName: '',
    llpin: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    upiId: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    receiptHeader: '',
    terms: '',
    invoicePrefix: 'INV'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('LLP Profile & Receipt details updated successfully!');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('Failed to save profile: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setMessage('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#78716C]">
        Loading LLP Profile Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D97706]" />
            LLP Entity & Receipt Customizer
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Configure your independent LLP commercial details, GSTIN, bank details, and customized receipt layout.
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-bold border border-[#86EFAC] animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Settings Form (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Legal Entity & Registration */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0284C7] pb-2 border-b border-[#E8DFC8]">
              <FileText className="w-4 h-4" />
              1. Legal Entity & Tax Registrations
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Registered LLP Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Apex Academic Supplies LLP"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Trade / Store Brand Name *
                </label>
                <input
                  type="text"
                  name="tradeName"
                  value={profile.tradeName || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Campus Store or City Supplies"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  LLPIN / Registration No.
                </label>
                <input
                  type="text"
                  name="llpin"
                  value={profile.llpin || ''}
                  onChange={handleChange}
                  placeholder="e.g. AAY-9876"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={profile.gstin || ''}
                  onChange={handleChange}
                  placeholder="e.g. 07AAYFA9876A1Z8"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  placeholder="Street / Commercial Complex address"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">City & State</label>
                <input
                  type="text"
                  name="city"
                  value={profile.city || ''}
                  onChange={handleChange}
                  placeholder="New Delhi, Delhi"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={profile.pincode || ''}
                  onChange={handleChange}
                  placeholder="110075"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Payment Info */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D97706] pb-2 border-b border-[#E8DFC8]">
              <CreditCard className="w-4 h-4" />
              2. Banking & Merchant UPI (For On-Screen QR)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  UPI VPA ID (For Instant QR)
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={profile.upiId || ''}
                  onChange={handleChange}
                  placeholder="e.g. yourstore@okaxis"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold font-mono text-[#0284C7] focus:outline-none focus:border-[#0284C7]"
                />
                <span className="text-[10px] text-[#78716C]">POS terminal will generate live QR codes for this ID.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={profile.bankName || ''}
                  onChange={handleChange}
                  placeholder="e.g. HDFC Bank Ltd."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Current Account Number
                </label>
                <input
                  type="text"
                  name="accountNo"
                  value={profile.accountNo || ''}
                  onChange={handleChange}
                  placeholder="502000xxxxxx"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={profile.ifscCode || ''}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">Store Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  placeholder="+91 98110 22334"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">Support Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={handleChange}
                  placeholder="billing@yourstore.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Receipt Template Customizer */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#15803D] pb-2 border-b border-[#E8DFC8]">
              <Receipt className="w-4 h-4" />
              3. Receipt Layout & Return Policy Customizer
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Invoice Series Prefix
                  </label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={profile.invoicePrefix || 'INV'}
                    onChange={handleChange}
                    placeholder="e.g. INV or STORE"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                  <span className="text-[10px] text-[#78716C]">Invoices will format as {profile.invoicePrefix || 'INV'}/[BRANCH]/26-27/0001</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                    Receipt Header Tagline
                  </label>
                  <input
                    type="text"
                    name="receiptHeader"
                    value={profile.receiptHeader || ''}
                    onChange={handleChange}
                    placeholder="e.g. Authorised Campus Distribution Counter"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44403C] uppercase mb-1">
                  Terms, Conditions & Return Policy (Printed at bottom of receipt)
                </label>
                <textarea
                  name="terms"
                  rows={4}
                  value={profile.terms || ''}
                  onChange={handleChange}
                  placeholder="Enter policy for uniform exchange, book replacement, receipt requirement, etc."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save LLP & Receipt Settings'}
            </button>
          </div>

        </form>

        {/* Right: Live Thermal Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <div className="text-xs font-black uppercase text-[#78716C] tracking-wider flex items-center justify-between">
            <span>Live 80mm Receipt Preview</span>
            <span className="text-[10px] text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full font-bold">Auto-Updates</span>
          </div>

          <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFC8] shadow-sm font-mono text-xs text-[#1C1917] leading-tight space-y-3">
            
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-[#78716C]/40">
              <div className="font-black text-sm uppercase text-[#1C1917]">
                {profile.tradeName || profile.name || '[Your Store / Business Name]'}
              </div>
              {profile.name && profile.name !== profile.tradeName && (
                <div className="text-[11px] font-bold text-[#44403C]">
                  {profile.name}
                </div>
              )}
              {profile.llpin && (
                <div className="text-[10px] text-[#78716C]">LLPIN: {profile.llpin}</div>
              )}
              {profile.gstin && (
                <div className="text-[10px] font-bold text-[#1C1917]">GSTIN: {profile.gstin}</div>
              )}
              {(profile.address || profile.city) && (
                <div className="text-[10px] text-[#78716C] mt-0.5">
                  {[profile.address, profile.city, profile.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              {profile.phone && (
                <div className="text-[10px] text-[#78716C]">Ph: {profile.phone}</div>
              )}
              {profile.receiptHeader && (
                <div className="text-[9px] font-bold bg-[#E8DFC8]/60 inline-block px-2 py-0.5 rounded mt-1 text-[#44403C]">
                  {profile.receiptHeader}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-[#78716C]/40">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Invoice #:</span>
                <span className="font-bold text-[#1C1917]">{profile.invoicePrefix || 'INV'}/[BRANCH]/26-27/0001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Date:</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Counter:</span>
                <span className="font-bold">[Branch Counter Name]</span>
              </div>
            </div>

            {/* Sample Items */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-[#78716C]/40">
              <div className="flex justify-between text-[10px] font-bold text-[#78716C] uppercase pb-0.5 border-b border-[#E8DFC8]">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              <div className="text-[11px]">
                <div className="font-bold">School Polo Shirt (Unisex)</div>
                <div className="flex justify-between text-[#78716C] text-[10px]">
                  <span>Size: 28 | GST 5%</span>
                  <span>2 x ₹550</span>
                  <span className="font-bold text-[#1C1917]">₹1,100</span>
                </div>
              </div>
              <div className="text-[11px]">
                <div className="font-bold">Class 1 Complete Book Set</div>
                <div className="flex justify-between text-[#78716C] text-[10px]">
                  <span>Standard Set | GST 0%</span>
                  <span>1 x ₹2,150</span>
                  <span className="font-bold text-[#1C1917]">₹2,150</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-[#78716C]/40">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Subtotal:</span>
                <span>₹3,250.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Applicable GST:</span>
                <span>₹55.00</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-[#78716C]/40">
                <span>TOTAL:</span>
                <span>₹3,305.00</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#78716C]">
                <span>Mode:</span>
                <span className="font-bold text-[#0284C7]">UPI (Ref: 9811xx)</span>
              </div>
            </div>

            {/* Terms Preview */}
            <div className="text-[9px] text-[#78716C] leading-snug whitespace-pre-line text-center pt-1">
              {profile.terms || 'No custom terms configured.'}
            </div>

            <div className="text-center pt-1 text-[10px] font-bold text-[#1C1917]">
              *** Thank You for Visiting! ***
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
