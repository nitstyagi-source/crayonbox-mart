import { NextResponse, NextRequest } from 'next/server';
import { queryMart } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

function checkSuperAdmin(req: NextRequest): boolean {
  const role = req.cookies.get('mart_user_role')?.value;
  return role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    if (!checkSuperAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const res = await queryMart(`
      SELECT id, name, email, phone, role, branch_id, active, created_at
      FROM mart.users
      ORDER BY created_at ASC;
    `);

    return NextResponse.json({ success: true, users: res.rows || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkSuperAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { name, email, phone, password, role, branchId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Staff name is required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Either email or mobile phone is required' }, { status: 400 });
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const validRoles = ['SUPER_ADMIN', 'MANAGER', 'CASHIER'];
    const userRole = validRoles.includes(role) ? role : 'CASHIER';

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : null;

    // Check for existing user with same email or phone
    const existingCheck = await queryMart(`
      SELECT id, email, phone FROM mart.users 
      WHERE (email IS NOT NULL AND LOWER(email) = $1)
         OR (phone IS NOT NULL AND phone = $2);
    `, [cleanEmail || '', cleanPhone || '']);

    if (existingCheck.rows.length > 0) {
      const match = existingCheck.rows[0];
      if (cleanEmail && match.email?.toLowerCase() === cleanEmail) {
        return NextResponse.json({ success: false, error: 'A staff member with this Email already exists.' }, { status: 400 });
      }
      if (cleanPhone && match.phone === cleanPhone) {
        return NextResponse.json({ success: false, error: 'A staff member with this Mobile Phone already exists.' }, { status: 400 });
      }
    }

    const newId = `usr_${userRole.toLowerCase().slice(0, 3)}_${Date.now()}`;
    const passHash = hashPassword(password.trim());

    await queryMart(`
      INSERT INTO mart.users (id, name, email, phone, password_hash, role, branch_id, active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
    `, [
      newId,
      name.trim(),
      cleanEmail,
      cleanPhone,
      passHash,
      userRole,
      branchId || null,
      true
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: newId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: userRole,
        branchId: branchId || null,
        active: true
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!checkSuperAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { id, name, email, phone, password, role, branchId, active } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Check user exists
    const userRes = await queryMart(`SELECT * FROM mart.users WHERE id = $1;`, [id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email ? email.trim().toLowerCase() : null);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone ? phone.trim().replace(/\D/g, '') : null);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (branchId !== undefined) {
      updates.push(`branch_id = $${idx++}`);
      values.push(branchId);
    }
    if (active !== undefined) {
      updates.push(`active = $${idx++}`);
      values.push(Boolean(active));
    }
    if (password && password.trim().length >= 4) {
      updates.push(`password_hash = $${idx++}`);
      values.push(hashPassword(password.trim()));
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    values.push(id);
    await queryMart(`
      UPDATE mart.users 
      SET ${updates.join(', ')}
      WHERE id = $${idx};
    `, values);

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkSuperAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting the initial super admin
    if (id === 'usr_super_admin') {
      return NextResponse.json({ success: false, error: 'Cannot delete the primary Super Admin account.' }, { status: 400 });
    }

    await queryMart(`DELETE FROM mart.users WHERE id = $1;`, [id]);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
