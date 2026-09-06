import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const profile = await readDataAsync<Record<string, any>>('llp_profile.json', {
    entityName: '',
    brandName: 'LLP Store',
    gstin: '',
    pan: '',
    address: '',
    phone: '',
    email: '',
    upiVpa: '',
    upiPayeeName: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    invoicePrefix: 'INV'
  });
  const harmonized = {
    ...profile,
    name: profile.name || profile.entityName || '',
    entityName: profile.entityName || profile.name || '',
    tradeName: profile.tradeName || profile.brandName || 'LLP Store',
    brandName: profile.brandName || profile.tradeName || 'LLP Store',
    upiId: profile.upiId || profile.upiVpa || '',
    upiVpa: profile.upiVpa || profile.upiId || '',
    ifscCode: profile.ifscCode || profile.ifsc || '',
    ifsc: profile.ifsc || profile.ifscCode || '',
    invoicePrefix: profile.invoicePrefix || 'INV'
  };
  return NextResponse.json(harmonized);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const harmonized = {
      ...body,
      entityName: body.entityName || body.name || '',
      brandName: body.brandName || body.tradeName || 'LLP Store',
      upiVpa: body.upiVpa || body.upiId || '',
      ifsc: body.ifsc || body.ifscCode || '',
      invoicePrefix: body.invoicePrefix || 'INV'
    };
    await writeDataAsync('llp_profile.json', harmonized);
    return NextResponse.json({ success: true, profile: harmonized });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
