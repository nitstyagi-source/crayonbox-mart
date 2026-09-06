'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Building2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Search 
} from 'lucide-react';

export default function InventoryPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Record<string, Record<string, number>>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/branches').then(res => res.json()),
      fetch('/api/catalog').then(res => res.json()),
      fetch('/api/inventory').then(res => res.json())
    ]).then(([branchesData, catalogData, invData]) => {
      setBranches(branchesData);
      setCatalog(catalogData);
      setInventory(invData);
      if (branchesData.length > 0) {
        const saved = localStorage.getItem('active_branch_id');
        setSelectedBranchId(saved || branchesData[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleStockAdjust = async (itemId: string, changeQty: number) => {
    if (!selectedBranchId) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          itemId,
          changeQty
        })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
        setMessage('Stock quantity updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetStock = async (itemId: string, setQty: number) => {
    if (!selectedBranchId) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          itemId,
          setQty
        })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
        setMessage('Stock saved.');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentBranchStock = inventory[selectedBranchId] || {};
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  const filteredItems = catalog.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#15803D]" />
            Campus Branch Stock & Inventory
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Real-time stock tracking, restock alerts, and quantity adjustments per branch counter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-bold border border-[#86EFAC]">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}

          {/* Branch Picker */}
          <div className="flex items-center gap-2 bg-white border border-[#E8DFC8] px-3 py-1.5 rounded-xl shadow-2xs">
            <Building2 className="w-4 h-4 text-[#D97706]" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-extrabold text-xs text-[#1C1917] focus:outline-none cursor-pointer"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-[#E8DFC8] shadow-2xs flex justify-between items-center">
        <div className="text-xs font-extrabold text-[#1C1917]">
          Showing Inventory for: <span className="text-[#0284C7]">{currentBranch?.name}</span>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78716C] space-y-2">
            <Layers className="w-8 h-8 text-[#78716C] mx-auto opacity-40" />
            <div className="font-bold text-[#1C1917]">No Inventory Records Found</div>
            <p>Add items to your catalog first, and they will automatically populate here for stock tracking.</p>
          </div>
        ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFC8] text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Selling Price</th>
              <th className="py-3 px-3 text-center">Available Stock</th>
              <th className="py-3 px-3">Stock Status</th>
              <th className="py-3 px-4 text-right">Quick Restock / Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFC8]">
            {filteredItems.map(item => {
              const qty = currentBranchStock[item.id] !== undefined ? currentBranchStock[item.id] : 0;
              const isLow = qty <= 10;

              return (
                <tr key={item.id} className="hover:bg-[#FAF7F2]/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-[#1C1917]">{item.name}</div>
                    <div className="text-[10px] text-[#78716C] font-mono">{item.sku}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold text-[#44403C]">{item.category}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#1C1917]">₹{item.price}</td>
                  
                  {/* Stock Qty Input */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => handleSetStock(item.id, Number(e.target.value))}
                      className={`w-16 text-center px-1.5 py-0.5 border rounded font-mono font-bold text-xs ${
                        isLow 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-[#FAF7F2] text-[#15803D] border-[#E8DFC8]'
                      }`}
                    />
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                        <AlertTriangle className="w-3 h-3" /> Low Stock ({qty})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                        In Stock ({qty})
                      </span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleStockAdjust(item.id, 10)}
                        className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#0284C7] text-[#0284C7] hover:text-white border border-[#E8DFC8] hover:border-transparent rounded-lg text-[10px] font-bold transition shadow-2xs"
                      >
                        +10 Units
                      </button>
                      <button
                        onClick={() => handleStockAdjust(item.id, 25)}
                        className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#15803D] text-[#15803D] hover:text-white border border-[#E8DFC8] hover:border-transparent rounded-lg text-[10px] font-bold transition shadow-2xs"
                      >
                        +25 Units
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

    </div>
  );
}
