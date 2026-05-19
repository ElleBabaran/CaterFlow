import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, Package, ChefHat, Tag, DollarSign } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  pricePerPax: number;
  dietaryTags: string[];
  available: boolean;
}

const DIETARY_OPTIONS = ['Halal', 'Vegan', 'Vegetarian', 'Gluten-Free', 'Peanut-Free', 'Dairy-Free'];

export function AdminInventory({ shopId, initialItems, onSave }: {
  shopId?: string;
  initialItems?: InventoryItem[];
  onSave: (items: InventoryItem[]) => Promise<void>;
}) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      pricePerPax: 0,
      dietaryTags: [],
      available: true,
    }]);
  };

  const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleTag = (id: string, tag: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const has = item.dietaryTags.includes(tag);
      return { ...item, dietaryTags: has ? item.dietaryTags.filter(t => t !== tag) : [...item.dietaryTags, tag] };
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-[var(--app-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--app-text)] uppercase tracking-widest">Menu Inventory</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Manage your dishes and pricing for customers</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addItem}
            className="admin-button-secondary border-[var(--app-accent)]/30 text-[var(--app-accent)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Dish
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`admin-button-primary flex items-center gap-2 min-w-[120px] justify-center ${
              saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : ''
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save All'}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center admin-card border-dashed bg-white/5 opacity-50">
          <ChefHat className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Inventory Empty</p>
          <p className="text-[10px] text-slate-600 mt-2 uppercase font-bold tracking-widest">Start by adding your first catering dish</p>
          <button onClick={addItem} className="mt-6 admin-button-primary">
            <Plus className="w-4 h-4" /> Add First Dish
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="admin-card p-8 bg-gradient-to-br from-[var(--card-bg)] to-[#1a2235] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--app-accent)]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[var(--app-accent)]/10 transition-colors" />
                
                <div className="flex items-start justify-between gap-6 relative z-10">
                  <span className="min-w-[2.5rem] h-10 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 flex items-center justify-center uppercase tracking-widest">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="admin-label">Dish Name</label>
                      <input
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        placeholder="AI-generated menu item name"
                        className="w-full admin-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="admin-label">
                        <DollarSign className="w-3 h-3" /> Price / Pax (PHP)
                      </label>
                      <input
                        type="number"
                        value={item.pricePerPax || ''}
                        onChange={e => updateItem(item.id, 'pricePerPax', Number(e.target.value))}
                        placeholder="450"
                        className="w-full admin-input"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="admin-label">Description & Portioning Notes</label>
                      <input
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Brief description of the dish, portion size, and any special notes"
                        className="w-full admin-input"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-3 rounded-2xl hover:bg-rose-500/10 text-slate-700 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3">
                    <label className="admin-label">
                      <Tag className="w-3 h-3" /> Dietary Designations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(item.id, tag)}
                          className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border ${
                            item.dietaryTags.includes(tag)
                              ? 'bg-[var(--app-accent)] text-[#0c111d] border-[var(--app-accent)] shadow-lg shadow-[var(--app-accent)]/10'
                              : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Menu Visibility
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, 'available', !item.available)}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${item.available ? 'bg-[var(--app-accent)]' : 'bg-slate-800'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-xl transition-transform mt-0.5 ${item.available ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-[10px] font-black uppercase tracking-widest min-w-[70px] ${item.available ? 'text-[var(--app-accent)]' : 'text-slate-600'}`}>
                      {item.available ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
