import { NextResponse, NextRequest } from 'next/server';
import { queryMart } from '@/lib/db';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

function checkAuthorized(req: NextRequest): boolean {
  const role = req.cookies.get('mart_user_role')?.value;
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAuthorized(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    try {
      const res = await queryMart(`
        SELECT * FROM mart.purchases
        ORDER BY created_at DESC;
      `);
      if (res.rows && res.rows.length >= 0) {
        return NextResponse.json({ success: true, purchases: res.rows });
      }
    } catch (dbErr) {
      console.warn('[DB Purchases GET Warning, falling back to KV]:', dbErr);
    }

    const purchases = await readDataAsync<any[]>('purchases.json', []);
    return NextResponse.json({ success: true, purchases });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAuthorized(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const userName = req.cookies.get('mart_user_name')?.value || 'Admin';
    const body = await req.json();
    const {
      vendorName,
      vendorGstin,
      vendorPhone,
      billNumber,
      billDate,
      branchId,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paymentStatus,
      paymentMode,
      attachmentData,
      attachmentName,
      notes,
      autoUpdateStock = true
    } = body;

    if (!vendorName || !vendorName.trim()) {
      return NextResponse.json({ success: false, error: 'Supplier/Vendor name is required' }, { status: 400 });
    }
    if (!billNumber || !billNumber.trim()) {
      return NextResponse.json({ success: false, error: 'Bill/Invoice number is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Please add at least one line item' }, { status: 400 });
    }

    const purchaseId = `purch_${Date.now()}`;
    const targetBranchId = branchId || 'main';

    // 1. Update Stock and Register Catalog items if autoUpdateStock is enabled
    if (autoUpdateStock) {
      const catalog = await readDataAsync<any[]>('catalog.json', []);
      const inventory = await readDataAsync<Record<string, Record<string, number>>>('inventory.json', {});

      if (!inventory[targetBranchId]) {
        inventory[targetBranchId] = {};
      }

      for (const item of items) {
        let matchedItem = catalog.find(c => 
          (item.itemId && c.id === item.itemId) || 
          c.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        // If product doesn't exist in catalog yet, add it automatically
        if (!matchedItem) {
          matchedItem = {
            id: item.itemId || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: item.name.trim(),
            category: item.category || 'General',
            sku: item.sku || `SKU-${Date.now().toString().slice(-4)}`,
            hsn: item.hsn || '',
            taxPercent: Number(item.taxPercent) || 0,
            sizes: item.size ? [item.size] : [],
            costPrice: Number(item.purchasePrice) || 0,
            mrp: Number(item.price) || Number(item.purchasePrice) * 1.25,
            price: Number(item.price) || Number(item.purchasePrice) * 1.2
          };
          catalog.push(matchedItem);

          // Insert into mart.catalog table
          try {
            await queryMart(`
              INSERT INTO mart.catalog (id, name, category, sku, hsn, tax_percent, sizes, mrp, price, cost_price, active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
              ON CONFLICT (id) DO NOTHING;
            `, [
              matchedItem.id,
              matchedItem.name,
              matchedItem.category,
              matchedItem.sku,
              matchedItem.hsn,
              matchedItem.taxPercent,
              matchedItem.sizes,
              matchedItem.mrp,
              matchedItem.price,
              matchedItem.costPrice
            ]);
          } catch (catErr) {
            console.warn('[mart.catalog insert warning]:', catErr);
          }
        }

        // Increment Inventory
        const currentQty = inventory[targetBranchId][matchedItem.id] || 0;
        inventory[targetBranchId][matchedItem.id] = currentQty + Number(item.quantity || 0);
      }

      await writeDataAsync('catalog.json', catalog);
      await writeDataAsync('inventory.json', inventory);
    }

    const newPurchase = {
      id: purchaseId,
      vendor_name: vendorName.trim(),
      vendor_gstin: vendorGstin ? vendorGstin.trim() : null,
      vendor_phone: vendorPhone ? vendorPhone.trim() : null,
      bill_number: billNumber.trim(),
      bill_date: billDate || new Date().toISOString().split('T')[0],
      branch_id: branchId || null,
      items,
      subtotal: Number(subtotal) || 0,
      tax_amount: Number(taxAmount) || 0,
      total_amount: Number(totalAmount) || 0,
      payment_status: paymentStatus || 'Paid',
      payment_mode: paymentMode || 'Bank Transfer',
      attachment_data: attachmentData || null,
      attachment_name: attachmentName || null,
      notes: notes ? notes.trim() : null,
      created_at: new Date().toISOString(),
      created_by: userName
    };

    // 2. Persist to Postgres mart.purchases
    try {
      await queryMart(`
        INSERT INTO mart.purchases (
          id, vendor_name, vendor_gstin, vendor_phone, bill_number, bill_date, branch_id,
          items, subtotal, tax_amount, total_amount, payment_status, payment_mode,
          attachment_data, attachment_name, notes, created_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        );
      `, [
        newPurchase.id,
        newPurchase.vendor_name,
        newPurchase.vendor_gstin,
        newPurchase.vendor_phone,
        newPurchase.bill_number,
        newPurchase.bill_date,
        newPurchase.branch_id,
        JSON.stringify(newPurchase.items),
        newPurchase.subtotal,
        newPurchase.tax_amount,
        newPurchase.total_amount,
        newPurchase.payment_status,
        newPurchase.payment_mode,
        newPurchase.attachment_data,
        newPurchase.attachment_name,
        newPurchase.notes,
        newPurchase.created_at,
        newPurchase.created_by
      ]);
    } catch (dbErr) {
      console.warn('[DB Purchases POST Warning]:', dbErr);
    }

    // 3. Persist to KV store
    const purchases = await readDataAsync<any[]>('purchases.json', []);
    purchases.unshift(newPurchase);
    await writeDataAsync('purchases.json', purchases);

    return NextResponse.json({ success: true, purchase: newPurchase });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAuthorized(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Purchase ID is required' }, { status: 400 });
    }

    try {
      await queryMart(`DELETE FROM mart.purchases WHERE id = $1;`, [id]);
    } catch (dbErr) {
      console.warn('[DB Purchases DELETE Warning]:', dbErr);
    }

    const purchases = await readDataAsync<any[]>('purchases.json', []);
    const updated = purchases.filter(p => p.id !== id);
    await writeDataAsync('purchases.json', updated);

    return NextResponse.json({ success: true, message: 'Purchase bill deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
