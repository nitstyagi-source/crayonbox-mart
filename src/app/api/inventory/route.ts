import { NextResponse } from 'next/server';
import { readDataAsync, writeDataAsync } from '@/lib/storage';

export async function GET() {
  const inventory = await readDataAsync('inventory.json', {});
  return NextResponse.json(inventory);
}

export async function POST(req: Request) {
  try {
    const { branchId, itemId, changeQty, setQty } = await req.json();
    const inventory = await readDataAsync<Record<string, Record<string, number>>>('inventory.json', {});
    
    if (!inventory[branchId]) {
      inventory[branchId] = {};
    }
    
    if (setQty !== undefined) {
      inventory[branchId][itemId] = Math.max(0, Number(setQty));
    } else if (changeQty !== undefined) {
      const curr = inventory[branchId][itemId] || 0;
      inventory[branchId][itemId] = Math.max(0, curr + Number(changeQty));
    }
    
    await writeDataAsync('inventory.json', inventory);
    return NextResponse.json({ success: true, stock: inventory[branchId][itemId], inventory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
