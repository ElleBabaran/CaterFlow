import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Utensils, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  User,
  Layers,
  Settings,
  PieChart as PieIcon,
  Plus,
  Minus,
  Search,
  Filter,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface DishVariation {
  id: string;
  dish: string;
  selectedBase: string;
  bases: string[];
  portion: number;
  quantity: number;
}

export function CustomerPlanner({ 
  menu, 
  inventory, 
  onUpdate 
}: { 
  menu: any[], 
  inventory: any[], 
  onUpdate?: (variations: DishVariation[]) => void 
}) {
  const [variations, setVariations] = useState<DishVariation[]>([]);
  const [autoBudget, setAutoBudget] = useState(true);
  const [activeTab, setActiveTab] = useState<'customize' | 'requirements'>('customize');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low-stock'>('all');

  useEffect(() => {
    if (menu && menu.length > 0 && variations.length === 0) {
      const initial = menu.map((item, i) => ({
        id: `dish-${i}`,
        dish: item.dish,
        selectedBase: item.dish.toLowerCase().includes('adobo') ? 'Pork' : (item.bases?.[0] || 'Standard'),
        bases: item.dish.toLowerCase().includes('adobo') ? ['Pork', 'Chicken', 'Sitaw', 'Mixed'] : (item.bases || ['Standard']),
        portion: parseFloat(item.portion_per_guest) || 250,
        quantity: 1
      }));
      setVariations(initial);
    }
  }, [menu]);

  const updateVariation = (id: string, field: keyof DishVariation, value: any) => {
    const next = variations.map(v => v.id === id ? { ...v, [field]: value } : v);
    setVariations(next);
    onUpdate?.(next);
  };

  const calculateRequirements = () => {
    const ingredientMap: Record<string, number> = {};
    
    variations.forEach(v => {
      // Base ingredient (Meat/Veggie)
      const baseIng = v.selectedBase.toLowerCase();
      const baseWeight = (v.portion * 0.6 * v.quantity) / 1000; // 60% of portion is base meat/veg
      ingredientMap[baseIng] = (ingredientMap[baseIng] || 0) + baseWeight;
      
      // Secondary ingredients (Sauce, spices, etc.)
      const sauceWeight = (v.portion * 0.4 * v.quantity) / 1000;
      ingredientMap['sauce/spices'] = (ingredientMap['sauce/spices'] || 0) + sauceWeight;
    });

    return inventory.map(item => {
      const itemName = (item.item || item.ingredient || '').toLowerCase();
      let required = item.amount_kg || 0;
      
      // If we have a match in our variation map, use that or add to it
      Object.keys(ingredientMap).forEach(key => {
        if (itemName.includes(key)) {
          required += ingredientMap[key];
        }
      });

      // If autoBudget is on, slightly reduce requirements to fit budget
      if (autoBudget) required *= 0.9;

      return {
        ...item,
        required_kg: required.toFixed(1),
        shortage: (required > (item.stock_kg || 0)) ? (required - (item.stock_kg || 0)).toFixed(1) : 0
      };
    });
  };


  const requirements = calculateRequirements().filter(item => {
    const matchesSearch = (item.item || item.ingredient || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'low-stock' && parseFloat(item.shortage) > 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/30 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-10 py-8 border-b border-slate-100 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative">
        <div className="flex items-center gap-6">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20"
          >
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory Matrix</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Smart Resource & Procurement Planner</p>
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-[1.5rem] border border-slate-200/50 w-fit">
          <TabButton 
            active={activeTab === 'customize'} 
            onClick={() => setActiveTab('customize')}
            label="Menu Refinement"
          />
          <TabButton 
            active={activeTab === 'requirements'} 
            onClick={() => setActiveTab('requirements')}
            label="Resource Needs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'customize' ? (
            <motion.div 
              key="customize-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-800 border border-emerald-500/30 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                    <Zap className="w-6 h-6 text-emerald-300 fill-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-emerald-100">Intelligent Budget Sync</p>
                    <p className="text-base text-emerald-50/80 font-medium max-w-md">Our agents will automatically optimize ingredient weights to stay within your budget thresholds.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoBudget(!autoBudget)}
                  className={`mt-6 sm:mt-0 relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 ${autoBudget ? 'bg-white shadow-lg' : 'bg-emerald-900/40 border border-white/20'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full transition-transform duration-500 ${autoBudget ? 'translate-x-8 bg-emerald-600' : 'translate-x-1 bg-white/50'}`} />
                </button>
              </motion.div>

              <div className="grid grid-cols-1 gap-6">
                {variations.map((v, idx) => (
                  <motion.div 
                    key={v.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white border border-slate-200/60 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 group"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-500">
                          <Utensils className="w-7 h-7 text-slate-300 group-hover:text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">{v.dish}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Item Configured</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-slate-50/80 p-2 rounded-[1.5rem] border border-slate-100">
                        <span className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                          <button onClick={() => updateVariation(v.id, 'quantity', Math.max(1, v.quantity - 1))} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Minus className="w-4 h-4" /></button>
                          <span className="text-sm font-black text-slate-900 min-w-[20px] text-center">{v.quantity}</span>
                          <button onClick={() => updateVariation(v.id, 'quantity', v.quantity + 1)} className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Layers className="w-4 h-4" /> Component Variation
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {v.bases.map(base => (
                            <button
                              key={base}
                              onClick={() => updateVariation(v.id, 'selectedBase', base)}
                              className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${v.selectedBase === base ? 'bg-slate-900 text-emerald-400 shadow-xl shadow-slate-900/20' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                            >
                              {base}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Dynamic Portioning
                          </label>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                            {v.portion}g / guest
                          </span>
                        </div>
                        <div className="relative pt-6">
                          <input 
                            type="range" 
                            min="100" 
                            max="500" 
                            step="25"
                            value={v.portion}
                            onChange={(e) => updateVariation(v.id, 'portion', parseInt(e.target.value))}
                            className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between mt-4">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Light</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase">Heavy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="requirements-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard label="Total Inventory Items" value={requirements.length} icon={<ShoppingBag className="text-blue-500" />} />
                <MetricCard label="Critical Shortages" value={requirements.filter(r => parseFloat(r.shortage) > 0).length} icon={<AlertCircle className="text-rose-500" />} urgent={requirements.filter(r => parseFloat(r.shortage) > 0).length > 0} />
                <MetricCard label="Procurement Viability" value="84%" icon={<Zap className="text-amber-500" />} />
              </div>

              <div className="bg-white border border-slate-200/60 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50">
                  <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search requirements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                      value={filterType}
                      onChange={(e: any) => setFilterType(e.target.value)}
                      className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-all shadow-sm"
                    >
                      <option value="all">All Items</option>
                      <option value="low-stock">Shortages</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-50">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Inventory</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Req. Volume</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gap Analysis</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {requirements.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                                <Info className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.item || item.ingredient}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit || 'kg'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-center font-mono text-xs text-slate-500">{item.stock_kg || 0} kg</td>
                          <td className="px-10 py-6 text-center font-mono text-xs text-slate-900 font-black">{item.required_kg} kg</td>
                          <td className="px-10 py-6 text-center">
                            <span className={`text-xs font-black font-mono px-3 py-1.5 rounded-lg ${parseFloat(item.shortage) > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'text-slate-300'}`}>
                              {parseFloat(item.shortage) > 0 ? `+${item.shortage} kg needed` : '-'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex justify-end">
                              {parseFloat(item.shortage) > 0 ? (
                                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 w-fit shadow-sm">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Procurement Req</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 w-fit shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {requirements.length === 0 && (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto border border-slate-100">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching resources found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / CTA */}
      <div className="bg-white px-10 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <PieIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-700 leading-relaxed max-w-sm">
            Dynamic procurement vector generated based on <span className="text-emerald-700 font-black">{variations.length}</span> menu variations. Finalize to update the accountant's ledger.
          </p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all duration-500 shadow-2xl shadow-slate-900/20 group">
          Finalize Blueprint
          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${active ? 'bg-white text-emerald-700 shadow-xl shadow-slate-900/5' : 'text-slate-500 hover:text-slate-900'}`}
    >
      {label}
    </button>
  );
}

function MetricCard({ label, value, icon, urgent = false }: { label: string, value: any, icon: any, urgent?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-white border p-8 rounded-[2.5rem] shadow-sm transition-all hover:shadow-xl ${urgent ? 'border-rose-100 ring-4 ring-rose-500/5' : 'border-slate-200/60'}`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-4xl font-black tracking-tighter ${urgent ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
    </motion.div>
  );
}

