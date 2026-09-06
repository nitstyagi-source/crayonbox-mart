'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  User, 
  ShoppingBag, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function MartLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter both Email/Phone and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success
      window.location.href = '/';
    } catch (err: any) {
      setErrorMsg('Failed to connect to authentication server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-4 sm:p-6 text-stone-800">
      
      {/* Container Box */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8DFC8] shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0284C7] text-white flex items-center justify-center shadow-md">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            LLP Store Terminal
          </h1>
          <p className="text-xs font-semibold text-stone-500">
            Commercial Uniforms, Books &amp; Retail POS System
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Staff Mobile or Email
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter registered mobile or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Role Information */}
        <div className="pt-3 border-t border-[#E8DFC8] flex items-center justify-center gap-1.5 text-stone-500 text-xs font-semibold text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Role-Based Access: Counter Cashier, Manager &amp; Super Admin</span>
        </div>

      </div>

      <div className="mt-6 text-center text-xs text-stone-400 font-medium">
        &copy; {new Date().getFullYear()} LLP Store &bull; Secure Counter POS System
      </div>

    </div>
  );
}
