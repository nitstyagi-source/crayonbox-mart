import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const profile = await readDataAsync('llp_profile.json', {
    entityName: 'CRAYON BOX MART ENTERPRISES LLP',
    brandName: 'Crayon Box School Store',
    gstin: '07AABCU9603R1ZM',
    pan: 'AABCU9603R',
    address: 'Crayon Box Campus, Main Burari Road, Nathupura, Delhi 110084',
    phone: '+91 98114 43322',
    email: 'mart@crayonboxschool.com',
    upiVpa: '9811443322@okaxis',
    upiPayeeName: 'Crayon Box Mart',
    bankName: 'State Bank of India',
    accountNo: '4098231002341',
    ifsc: 'SBIN0001234',
    invoicePrefix: 'MART'
  });
  return NextResponse.json(profile);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await writeDataAsync('llp_profile.json', body);
    return NextResponse.json({ success: true, profile: body });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
