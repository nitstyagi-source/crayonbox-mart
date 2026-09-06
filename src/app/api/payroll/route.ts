import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const branchId = searchParams.get('branchId');
  
  let payroll = await readDataAsync<any[]>('payroll.json', []);
  if (month) {
    payroll = payroll.filter(p => p.monthYear === month);
  }
  if (branchId && branchId !== 'all') {
    payroll = payroll.filter(p => p.branchId === branchId);
  }
  return NextResponse.json(payroll);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payroll = await readDataAsync<any[]>('payroll.json', []);
    
    if (body.action === 'save_batch') {
      const records = body.records || [];
      records.forEach((rec: any) => {
        const existingIdx = payroll.findIndex(p => p.staffId === rec.staffId && p.monthYear === rec.monthYear);
        if (existingIdx !== -1) {
          payroll[existingIdx] = { ...payroll[existingIdx], ...rec };
        } else {
          payroll.push({
            id: `pay_${rec.monthYear.replace('-', '')}_${rec.staffId}`,
            ...rec
          });
        }
      });
      await writeDataAsync('payroll.json', payroll);
      return NextResponse.json({ success: true, count: records.length });
    } else if (body.action === 'mark_paid') {
      const idx = payroll.findIndex(p => p.id === body.id);
      if (idx !== -1) {
        payroll[idx].status = 'Paid';
        payroll[idx].paidDate = new Date().toISOString();
        payroll[idx].paidMode = body.paidMode || 'Bank Transfer';
        await writeDataAsync('payroll.json', payroll);
        return NextResponse.json({ success: true, record: payroll[idx] });
      }
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
