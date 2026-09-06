import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const staff = await readDataAsync('staff.json', []);
  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const staff = await readDataAsync<any[]>('staff.json', []);
    
    if (body.action === 'add') {
      const newStaff = {
        id: `stf_${Date.now()}`,
        name: body.name,
        phone: body.phone || '',
        role: body.role || 'Counter Cashier',
        branchId: body.branchId || 'br_01',
        salaryType: body.salaryType || 'monthly',
        baseSalary: Number(body.baseSalary) || 15000,
        dailyWage: Number(body.dailyWage) || 600,
        joiningDate: body.joiningDate || new Date().toISOString().split('T')[0],
        active: true
      };
      staff.push(newStaff);
      await writeDataAsync('staff.json', staff);
      return NextResponse.json({ success: true, staff: newStaff, list: staff });
    } else if (body.action === 'edit') {
      const idx = staff.findIndex(s => s.id === body.id);
      if (idx !== -1) {
        staff[idx] = {
          ...staff[idx],
          ...body,
          baseSalary: Number(body.baseSalary) || staff[idx].baseSalary,
          dailyWage: Number(body.dailyWage) || staff[idx].dailyWage
        };
        await writeDataAsync('staff.json', staff);
        return NextResponse.json({ success: true, staff: staff[idx], list: staff });
      }
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    } else if (body.action === 'delete') {
      const updated = staff.filter(s => s.id !== body.id);
      await writeDataAsync('staff.json', updated);
      return NextResponse.json({ success: true, list: updated });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
