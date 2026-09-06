'use client';

import React from 'react';
import { X, Printer, Share2 } from 'lucide-react';

interface ThermalReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  llpProfile: any;
}

export default function ThermalReceipt({ isOpen, onClose, invoice, llpProfile }: ThermalReceiptProps) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const storeTitle = llpProfile?.brandName || llpProfile?.entityName || 'LLP Store';
    const text = `*Tax Invoice from ${storeTitle}*\nInvoice: ${invoice.invoiceNumber}\nStudent: ${invoice.studentName || 'Student'} (${invoice.studentGrade || ''})\nTotal Amount: ₹${invoice.totalAmount}\nStatus: Paid via ${invoice.paymentMode}\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC8] my-8">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex justify-between items-center pb-4 mb-4 border-b border-[#E8DFC8]">
          <div className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Tax Invoice Receipt</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="p-2 text-[#15803D] hover:bg-[#FAF7F2] rounded-lg transition"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0284C7] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#0369A1] transition"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button onClick={onClose} className="p-1.5 text-[#78716C] hover:text-[#1C1917]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 80mm Printable Receipt Container */}
        <div id="thermal-receipt-content" className="font-mono text-xs text-[#1C1917] leading-tight space-y-3 bg-[#FAF7F2]/40 p-4 rounded-xl border border-[#E8DFC8]">
          
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-[#78716C]/40">
            <div className="font-black text-sm uppercase tracking-wide text-[#1C1917]">
              {llpProfile?.brandName || llpProfile?.entityName || 'LLP STORE'}
            </div>
            {llpProfile?.entityName && llpProfile?.entityName !== llpProfile?.brandName && (
              <div className="text-[11px] font-bold text-[#44403C]">
                {llpProfile.entityName}
              </div>
            )}
            {llpProfile?.llpin && (
              <div className="text-[10px] text-[#78716C]">LLPIN: {llpProfile.llpin}</div>
            )}
            {llpProfile?.gstin && (
              <div className="text-[10px] font-bold text-[#1C1917]">GSTIN: {llpProfile.gstin}</div>
            )}
            {(llpProfile?.address || llpProfile?.city) && (
              <div className="text-[10px] text-[#78716C] mt-0.5">
                {[llpProfile?.address, llpProfile?.city, llpProfile?.pincode].filter(Boolean).join(', ')}
              </div>
            )}
            {llpProfile?.phone && (
              <div className="text-[10px] text-[#78716C]">Ph: {llpProfile.phone}</div>
            )}
            {llpProfile?.receiptHeader && (
              <div className="text-[9px] font-bold bg-[#E8DFC8]/50 inline-block px-2 py-0.5 rounded mt-1 text-[#44403C]">
                {llpProfile.receiptHeader}
              </div>
            )}
          </div>

          {/* Invoice & Student Meta */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-[#78716C]/40">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Invoice #:</span>
              <span className="font-bold text-[#1C1917]">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Date & Time:</span>
              <span>{new Date(invoice.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Campus Counter:</span>
              <span className="font-bold">{invoice.branchName}</span>
            </div>
            {invoice.studentName && (
              <div className="flex justify-between">
                <span className="text-[#78716C]">Student Name:</span>
                <span className="font-bold">{invoice.studentName}</span>
              </div>
            )}
            {invoice.studentGrade && (
              <div className="flex justify-between">
                <span className="text-[#78716C]">Class / Roll:</span>
                <span>{invoice.studentGrade} {invoice.studentAdmNo ? `(${invoice.studentAdmNo})` : ''}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-[#78716C]/40">
            <div className="flex justify-between text-[10px] font-bold text-[#78716C] uppercase pb-1 border-b border-[#E8DFC8]">
              <span>Item Description</span>
              <span>Qty x Rate</span>
              <span>Total</span>
            </div>
            {invoice.items?.map((it: any, idx: number) => (
              <div key={idx} className="text-[11px]">
                <div className="font-bold text-[#1C1917]">{it.name}</div>
                <div className="flex justify-between text-[#78716C] text-[10px]">
                  <span>Size: {it.size || 'Std'} | GST {it.taxPercent}%</span>
                  <span>{it.quantity} x ₹{it.price}</span>
                  <span className="font-bold text-[#1C1917]">₹{it.total}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-[#78716C]/40">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Applicable GST:</span>
              <span>₹{invoice.taxAmount.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-[#15803D]">
                <span>Discount:</span>
                <span>-₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-[#78716C]/40 text-[#1C1917]">
              <span>GRAND TOTAL:</span>
              <span>₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#78716C]">
              <span>Payment Mode:</span>
              <span className="font-bold text-[#0284C7] uppercase">{invoice.paymentMode}</span>
            </div>
          </div>

          {/* Return Policy & Terms */}
          {llpProfile?.terms && (
            <div className="text-[9px] text-[#78716C] leading-snug whitespace-pre-line pt-1 text-center">
              {llpProfile.terms}
            </div>
          )}

          <div className="text-center pt-2 text-[10px] font-bold text-[#1C1917]">
            *** Thank You for Visiting! ***
          </div>

        </div>

      </div>
    </div>
  );
}
