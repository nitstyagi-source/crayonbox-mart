import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';
import { queryMart } from '@/lib/db';

export async function GET() {
  const invoices = await readDataAsync('invoices.json', []);
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoices = await readDataAsync<any[]>('invoices.json', []);
    const branches = await readDataAsync<any[]>('branches.json', []);
    const profile = await readDataAsync<any>('llp_profile.json', {});
    const inventory = await readDataAsync<Record<string, Record<string, number>>>('inventory.json', {});
    
    const branch = branches.find(b => b.id === body.branchId) || branches[0];
    const branchCode = branch ? branch.code : 'C1';
    
    // Increment branch invoice counter
    const counter = (branch?.invoiceCounter || 100) + 1;
    if (branch) {
      branch.invoiceCounter = counter;
      await writeDataAsync('branches.json', branches);
    }
    
    const prefix = profile.invoicePrefix || 'MART';
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const nyy = (now.getFullYear() + 1).toString().slice(-2);
    const invoiceNumber = `${prefix}/${branchCode}/${yy}-${nyy}/${counter.toString().padStart(4, '0')}`;
    
    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      branchId: body.branchId,
      branchName: branch?.name || 'Campus Counter',
      date: new Date().toISOString(),
      customerName: body.customerName || 'Parent / Walk-in',
      customerPhone: body.customerPhone || '',
      studentName: body.studentName || '',
      studentGrade: body.studentGrade || '',
      studentAdmNo: body.studentAdmNo || '',
      items: body.items || [],
      subtotal: Number(body.subtotal) || 0,
      taxAmount: Number(body.taxAmount) || 0,
      discount: Number(body.discount) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      paymentMode: body.paymentMode || 'Cash',
      cashReceived: Number(body.cashReceived) || 0,
      changeGiven: Number(body.changeGiven) || 0,
      status: 'Completed'
    };
    
    // Deduct stock
    if (body.branchId && inventory[body.branchId] && Array.isArray(body.items)) {
      body.items.forEach((it: any) => {
        if (it.itemId && inventory[body.branchId][it.itemId] !== undefined) {
          inventory[body.branchId][it.itemId] = Math.max(0, inventory[body.branchId][it.itemId] - (it.quantity || 1));
        }
      });
      await writeDataAsync('inventory.json', inventory);
    }
    
    invoices.unshift(newInvoice);
    await writeDataAsync('invoices.json', invoices);

    // Also persist structured row into mart.invoices table
    try {
      await queryMart(`
        INSERT INTO mart.invoices (
          id, invoice_no, branch_id, customer_name, student_name,
          student_adm_no, student_grade, items, subtotal, discount,
          total_amount, payment_mode, cash_tendered, change_due, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        newInvoice.id,
        newInvoice.invoiceNumber,
        newInvoice.branchId,
        newInvoice.customerName,
        newInvoice.studentName,
        newInvoice.studentAdmNo,
        newInvoice.studentGrade,
        JSON.stringify(newInvoice.items),
        newInvoice.subtotal,
        newInvoice.discount,
        newInvoice.totalAmount,
        newInvoice.paymentMode,
        newInvoice.cashReceived,
        newInvoice.changeGiven
      ]);
    } catch (tblErr) {
      console.warn('[mart.invoices structured table insert warning]:', tblErr);
    }
    
    return NextResponse.json({ success: true, invoice: newInvoice, invoices });
  } catch (err: any) {
    console.error('Invoice creation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
