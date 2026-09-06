import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryMart } from '@/lib/db';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + 'mart_salt_2026').digest('hex');
}

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: 'Please enter both Email/Phone and Password' }, { status: 400 });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');
    const passHash = hashPassword(password.trim());

    const res = await queryMart(`
      SELECT id, name, email, phone, role, branch_id, active, password_hash
      FROM mart.users
      WHERE (
        LOWER(email) = $1 
        OR phone = $1
        ${cleanPhone.length >= 10 ? `OR phone ILIKE '%${cleanPhone.slice(-10)}%'` : ''}
      )
      AND active = true
      LIMIT 1;
    `, [cleanId]);

    const user = res.rows[0];

    if (!user || user.password_hash !== passHash) {
      return NextResponse.json({ success: false, error: 'Invalid email/phone or password' }, { status: 401 });
    }

    const sessionToken = `MART_SESS_${user.id}_${Date.now()}`;
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branch_id
      }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const thirtyDays = 60 * 60 * 24 * 30;

    response.cookies.set('mart_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: thirtyDays
    });

    response.cookies.set('mart_user_role', user.role, {
      path: '/',
      secure: isProduction,
      sameSite: 'lax',
      maxAge: thirtyDays
    });

    response.cookies.set('mart_user_name', user.name, {
      path: '/',
      secure: isProduction,
      sameSite: 'lax',
      maxAge: thirtyDays
    });

    response.cookies.set('mart_branch_id', user.branch_id || 'br_01', {
      path: '/',
      secure: isProduction,
      sameSite: 'lax',
      maxAge: thirtyDays
    });

    return response;
  } catch (err: any) {
    console.error('[Mart Login Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
