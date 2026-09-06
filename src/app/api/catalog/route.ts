import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const catalog = await readDataAsync('catalog.json', []);
  return NextResponse.json(catalog);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const catalog = await readDataAsync<any[]>('catalog.json', []);
    
    if (body.action === 'add') {
      const newItem = {
        id: `item_${Date.now()}`,
        name: body.name,
        category: body.category || 'Uniform',
        sku: body.sku || `SKU-${Date.now().toString().slice(-4)}`,
        hsn: body.hsn || '6105',
        taxPercent: Number(body.taxPercent) || 5,
        sizes: Array.isArray(body.sizes) ? body.sizes : (body.sizes ? body.sizes.split(',').map((s: string) => s.trim()) : ['Standard']),
        mrp: Number(body.mrp) || 0,
        price: Number(body.price) || 0
      };
      catalog.push(newItem);
      await writeDataAsync('catalog.json', catalog);
      return NextResponse.json({ success: true, item: newItem, catalog });
    } else if (body.action === 'edit') {
      const idx = catalog.findIndex(i => i.id === body.id);
      if (idx !== -1) {
        catalog[idx] = {
          ...catalog[idx],
          ...body,
          mrp: Number(body.mrp) || catalog[idx].mrp,
          price: Number(body.price) || catalog[idx].price,
          taxPercent: Number(body.taxPercent) !== undefined ? Number(body.taxPercent) : catalog[idx].taxPercent,
          sizes: Array.isArray(body.sizes) ? body.sizes : (body.sizes ? body.sizes.split(',').map((s: string) => s.trim()) : catalog[idx].sizes)
        };
        await writeDataAsync('catalog.json', catalog);
        return NextResponse.json({ success: true, item: catalog[idx], catalog });
      }
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    } else if (body.action === 'delete') {
      const updated = catalog.filter(i => i.id !== body.id);
      await writeDataAsync('catalog.json', updated);
      return NextResponse.json({ success: true, catalog: updated });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
