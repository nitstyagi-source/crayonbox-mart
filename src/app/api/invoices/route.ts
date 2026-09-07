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
    
    const prefix = profile.invoicePrefix || 'INV';
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const nyy = (now.getFullYear() + 1).toString().slice(-2);
    const invoiceNumber = branch 
      ? `${prefix}/${branchCode}/${yy}-${nyy}/${counter.toString().padStart(4, '0')}`
      : `${prefix}/${yy}-${nyy}/${Date.now().toString().slice(-4)}`;
    
    const totalAmount = Number(body.totalAmount) || 0;
    const amountPaid = body.amountPaid !== undefined 
      ? Number(body.amountPaid) 
      : (body.paymentMode === 'Cash' ? Math.min(totalAmount, Number(body.cashReceived) || totalAmount) : totalAmount);
    const balanceDue = body.balanceDue !== undefined 
      ? Math.max(0, Number(body.balanceDue)) 
      : Math.max(0, totalAmount - amountPaid);
    const status = balanceDue <= 0 ? 'Completed' : (amountPaid > 0 ? 'Partial' : 'Unpaid');
    const dueDate = body.dueDate || null;

    const initialHistory = amountPaid > 0 ? [{
      paymentId: `pay_${Date.now()}`,
      amount: amountPaid,
      paymentMode: body.paymentMode || 'Cash',
      date: new Date().toISOString(),
      note: balanceDue > 0 ? 'Partial Payment at POS Checkout' : 'Full Payment at POS Checkout'
    }] : [];

    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      branchId: body.branchId || null,
      branchName: branch?.name || 'Main Counter',
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
      totalAmount,
      amountPaid,
      balanceDue,
      paymentMode: body.paymentMode || 'Cash',
      cashReceived: Number(body.cashReceived) || amountPaid,
      changeGiven: Number(body.changeGiven) || 0,
      status,
      dueDate,
      paymentHistory: initialHistory
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
          id, invoice_no, branch_id, customer_name, customer_phone, student_name,
          student_adm_no, student_grade, items, subtotal, discount,
          total_amount, amount_paid, balance_due, payment_mode, cash_tendered,
          change_due, status, due_date, payment_history, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `, [
        newInvoice.id,
        newInvoice.invoiceNumber,
        newInvoice.branchId,
        newInvoice.customerName,
        newInvoice.customerPhone,
        newInvoice.studentName,
        newInvoice.studentAdmNo,
        newInvoice.studentGrade,
        JSON.stringify(newInvoice.items),
        newInvoice.subtotal,
        newInvoice.discount,
        newInvoice.totalAmount,
        newInvoice.amountPaid,
        newInvoice.balanceDue,
        newInvoice.paymentMode,
        newInvoice.cashReceived,
        newInvoice.changeGiven,
        newInvoice.status,
        newInvoice.dueDate,
        JSON.stringify(newInvoice.paymentHistory)
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

export async function PATCH(req: Request) {
  try {
    const { invoiceId, paymentAmount, paymentMode, note } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const payAmt = Number(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return NextResponse.json({ success: false, error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    const invoices = await readDataAsync<any[]>('invoices.json', []);
    const invIndex = invoices.findIndex(i => i.id === invoiceId || i.invoiceNumber === invoiceId);

    if (invIndex === -1) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const inv = invoices[invIndex];
    const prevPaid = Number(inv.amountPaid !== undefined ? inv.amountPaid : inv.totalAmount);
    const newPaid = prevPaid + payAmt;
    const newBalance = Math.max(0, Number(inv.totalAmount) - newPaid);
    const newStatus = newBalance <= 0 ? 'Completed' : 'Partial';

    const history = Array.isArray(inv.paymentHistory) ? [...inv.paymentHistory] : [];
    history.push({
      paymentId: `pay_${Date.now()}`,
      amount: payAmt,
      paymentMode: paymentMode || 'Cash',
      date: new Date().toISOString(),
      note: note || 'Due Balance Collection'
    });

    inv.amountPaid = newPaid;
    inv.balanceDue = newBalance;
    inv.status = newStatus;
    inv.paymentHistory = history;

    invoices[invIndex] = inv;
    await writeDataAsync('invoices.json', invoices);

    // Update postgres table
    try {
      await queryMart(`
        UPDATE mart.invoices
        SET amount_paid = $1, balance_due = $2, status = $3, payment_history = $4
        WHERE id = $5 OR invoice_no = $5;
      `, [newPaid, newBalance, newStatus, JSON.stringify(history), invoiceId]);
    } catch (tblErr) {
      console.warn('[mart.invoices table update warning]:', tblErr);
    }

    return NextResponse.json({ success: true, invoice: inv, invoices });
  } catch (err: any) {
    console.error('Collect payment error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
