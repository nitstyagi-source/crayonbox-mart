'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle2, QrCode } from 'lucide-react';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  amount: number;
  invoiceNo: string;
  upiId: string;
  payeeName: string;
}

export default function UpiQrModal({
  isOpen,
  onClose,
  onConfirmPayment,
  amount,
  invoiceNo,
  upiId,
  payeeName,
}: UpiQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !upiId || amount <= 0) return;
    // Standard NPCI UPI URI format
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + invoiceNo)}`;
    QRCode.toDataURL(upiUri, { width: 240, margin: 1 })
      .then(url => setQrDataUrl(url))
      .catch(console.error);
  }, [isOpen, upiId, payeeName, amount, invoiceNo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E8DFC8] text-center">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E8DFC8]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0284C7]">
            <QrCode className="w-4 h-4" />
            <span>Instant UPI Payment</span>
          </div>
          <button onClick={onClose} className="text-[#78716C] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-2">
          <div className="text-2xl font-black text-[#1C1917]">₹{amount.toFixed(2)}</div>
          <div className="text-xs text-[#78716C]">Scan with any UPI App (GPay, PhonePe, Paytm)</div>
        </div>

        <div className="flex justify-center p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFC8] my-3">
          {upiId ? (
            qrDataUrl ? (
              <img src={qrDataUrl} alt="UPI QR" className="w-48 h-48 rounded-lg shadow-2xs" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-[#78716C]">Generating QR...</div>
            )
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-3 text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
              <QrCode className="w-8 h-8 text-amber-600 mb-2 opacity-60" />
              <div className="font-bold">UPI Not Configured</div>
              <div className="text-[10px] text-stone-500 mt-1">
                Configure your store UPI VPA under <span className="font-semibold text-amber-900">LLP Settings</span> to accept direct QR payments.
              </div>
            </div>
          )}
        </div>

        {upiId && (
          <div className="text-[11px] text-[#44403C] space-y-1 mb-4">
            <div>UPI VPA: <span className="font-mono font-bold text-[#0284C7]">{upiId}</span></div>
            {payeeName && <div>Payee: <span className="font-bold text-[#1C1917]">{payeeName}</span></div>}
          </div>
        )}

        <button
          onClick={onConfirmPayment}
          className="w-full py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirm Received & Print Bill
        </button>
      </div>
    </div>
  );
}
