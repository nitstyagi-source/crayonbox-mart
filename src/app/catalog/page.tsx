'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  Tag, 
  Search, 
  DollarSign 
} from 'lucide-react';

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState<{
    name: string;
    category: string;
    sku: string;
    hsn: string;
    taxPercent: number;
    sizes: string;
    mrp: number | string;
    price: number | string;
  }>({
    name: '',
    category: '',
    sku: '',
    hsn: '',
    taxPercent: 0,
    sizes: '',
    mrp: '',
    price: ''
  });
  const [message, setMessage] = useState('');

  const fetchCatalog = () => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => setCatalog(data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      category: '',
      sku: '',
      hsn: '',
      taxPercent: 0,
      sizes: '',
      mrp: '',
      price: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      sku: item.sku,
      hsn: item.hsn,
      taxPercent: item.taxPercent,
      sizes: Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes,
      mrp: item.mrp,
      price: item.price
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingItem ? 'edit' : 'add';
    const payload = editingItem ? { action, id: editingItem.id, ...form } : { action, ...form };

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMessage(editingItem ? 'Item updated successfully!' : 'New item added to catalog!');
        setTimeout(() => setMessage(''), 4000);
        setIsModalOpen(false);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete item "${name}"?`)) return;
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Item removed.');
        setTimeout(() => setMessage(''), 4000);
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dynamicCategories = ['All', ...Array.from(new Set(catalog.map((i: any) => i.category).filter(Boolean)))];

  const filtered = catalog.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC8]">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#D97706]" />
            Uniforms, Book Kits & Catalog Manager
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Manage uniform size matrices, grade-wise book bundles, prices, HSN codes, and GST rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] rounded-xl text-xs font-bold border border-[#86EFAC]">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add New Item / Bundle
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8DFC8] shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dynamicCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-[#FAF7F2] text-[#44403C] hover:bg-gray-200'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78716C] space-y-3">
            <Package className="w-8 h-8 text-[#78716C] mx-auto opacity-40" />
            <div className="font-bold text-[#1C1917]">No Products in Catalog</div>
            <p>Add your uniforms, book sets, or stationery items to start billing at counter.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add First Product / Kit
            </button>
          </div>
        ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DFC8] text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">HSN Code</th>
              <th className="py-3 px-3">GST Rate</th>
              <th className="py-3 px-3">Sizes / Variants</th>
              <th className="py-3 px-3 text-right">MRP</th>
              <th className="py-3 px-3 text-right">Selling Price</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFC8]">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-[#FAF7F2]/40 transition">
                <td className="py-3 px-4">
                  <div className="font-extrabold text-[#1C1917]">{item.name}</div>
                  <div className="text-[10px] text-[#78716C] font-mono">{item.sku}</div>
                </td>
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    item.category === 'Uniform' 
                      ? 'bg-[#EFF6FF] text-[#0284C7]' 
                      : item.category === 'Book Bundle' 
                      ? 'bg-[#FEF3C7] text-[#D97706]' 
                      : 'bg-[#DCFCE7] text-[#15803D]'
                  }`}>
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-[#78716C]">{item.hsn || '-'}</td>
                <td className="py-3 px-3 font-bold text-[#1C1917]">{item.taxPercent}%</td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {item.sizes?.map((sz: string) => (
                      <span key={sz} className="text-[9px] bg-[#FAF7F2] border border-[#E8DFC8] px-1.5 py-0.2 rounded text-[#44403C]">
                        {sz}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-[#78716C]">₹{item.mrp}</td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#15803D] text-sm">₹{item.price}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-[#0284C7] hover:bg-[#FAF7F2] rounded-lg transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFC8]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E8DFC8]">
              <h3 className="text-sm font-extrabold text-[#1C1917]">
                {editingItem ? 'Edit Item / Bundle' : 'Add Item / Bundle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">
                  Item Title / Bundle Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Winter Blazer with School Crest"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Uniform / Books / Stationery"
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={form.hsn}
                    onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={form.taxPercent}
                    onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">
                  Sizes / Variants (Comma Separated)
                </label>
                <input
                  type="text"
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  placeholder="26, 28, 30, 32, 34 or Standard Set"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#44403C] uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-xs font-bold font-mono text-[#15803D] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#44403C] text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
