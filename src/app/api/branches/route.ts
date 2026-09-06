import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const branches = await readDataAsync('branches.json', []);
  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const branches = await readDataAsync<any[]>('branches.json', []);
    
    if (body.action === 'add') {
      const newBranch = {
        id: `br_${Date.now()}`,
        code: body.code?.toUpperCase() || `C${branches.length + 1}`,
        name: body.name || 'New Outlet Counter',
        location: body.location || '',
        phone: body.phone || '',
        active: true,
        invoiceCounter: 100
      };
      branches.push(newBranch);
      await writeDataAsync('branches.json', branches);
      return NextResponse.json({ success: true, branch: newBranch, branches });
    } else if (body.action === 'edit') {
      const idx = branches.findIndex(b => b.id === body.id);
      if (idx !== -1) {
        branches[idx] = { ...branches[idx], ...body };
        await writeDataAsync('branches.json', branches);
        return NextResponse.json({ success: true, branch: branches[idx], branches });
      }
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    } else if (body.action === 'delete') {
      const updated = branches.filter(b => b.id !== body.id);
      await writeDataAsync('branches.json', updated);
      return NextResponse.json({ success: true, branches: updated });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
