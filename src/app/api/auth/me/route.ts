import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('mart_token')?.value;
  const role = cookieStore.get('mart_user_role')?.value;
  const name = cookieStore.get('mart_user_name')?.value;
  const branchId = cookieStore.get('mart_branch_id')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      name: name || 'Staff Member',
      role: role || 'CASHIER',
      branchId: branchId || null
    }
  });
}
