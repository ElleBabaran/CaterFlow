import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2, ChefHat } from 'lucide-react';

export function MenuEditor({ menu, onChange }: { menu: any[], onChange: (menu: any[]) => void }) {
  if (!menu || menu.length === 0) return (
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      No menu generated yet.
    </div>
  );

  const updatePortion = (index: number, val: string) => {
    const newMenu = [...menu];
    newMenu[index].portion_per_guest = val;
    onChange(newMenu);
  };

  const removeDish = (index: number) => {
    const newMenu = [...menu];
    newMenu.splice(index, 1);
    onChange(newMenu);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-emerald-600" />
          Menu Customization
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Mode</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menu.map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-slate-800 text-sm">{item.dish}</h3>
              <button onClick={() => removeDish(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Portion/Guest</label>
                <input 
                  type="text" 
                  value={item.portion_per_guest} 
                  onChange={(e) => updatePortion(i, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Category</label>
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 truncate">
                  {item.tags?.[0] || 'Main'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest">
        <ChefHat className="w-4 h-4" />
        Swap/Add Menu Suggestion
      </button>
    </motion.div>
  );
}
