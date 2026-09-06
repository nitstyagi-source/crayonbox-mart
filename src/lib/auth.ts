import crypto from 'crypto';
import { NextRequest } from 'next/server';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'mart_salt_2026').digest('hex');
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER';
  branchId: string | null;
}

export function getUserFromCookies(request: NextRequest): { role: string; token: string } | null {
  const token = request.cookies.get('mart_token')?.value;
  const role = request.cookies.get('mart_user_role')?.value;
  if (!token) return null;
  return { role: role || 'CASHIER', token };
}
