import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Utensils, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Minus,
  RefreshCcw,
  Clock,
  DollarSign,
  Users,
  Search,
  Filter,
  Flame,
  Droplets,
  Cake,
  ChefHat
} from 'lucide-react';

interface DishVariation {
  id: string;
  dish: string;
  category: 'meal' | 'beverage' | 'dessert';
  portion: number;
  quantity: number;
  price: number;
  ingredients: string[];
  reasoning: string;
  image_url?: string;
  tags?: string[];
  allergens?: string[];
}

export function CustomerPlanner({ 
  steps,
  monitoring,
  pricing,
  eventData,
  onUpdate 
}: { 
  steps: any[], 
  monitoring?: any,
  pricing?: any,
  eventData: any,
  onUpdate?: (menu: any[]) => void 
}) {
  const menuFromSteps = steps.find(s => s.agent.includes('Head Chef'))?.data?.menu || [];
  const inventoryFromSteps = steps.find(s => s.agent.includes('Inventory'))?.data?.inventory || [];

  const [menuItems, setMenuItems] = useState<DishVariation[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'inventory'>('menu');
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  useEffect(() => {
    if (menuFromSteps.length > 0 && menuItems.length === 0) {
      setMenuItems(menuFromSteps.map((m: any, i: number) => ({
        ...m,
        id: m.id || `dish-${i}`,
        category: (m.category?.toLowerCase() || 'meal') as any,
        quantity: 1
      })));
    }
  }, [menuFromSteps]);

  const handleRegenerateItem = async (item: DishVariation) => {
    setIsRegenerating(item.id);
    try {
      const response = await fetch('/api/ai/regenerate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItem: item,
          context: {
            theme: eventData.event_type,
            guests: eventData.guest_count,
            location: eventData.event_location,
            budget: eventData.budget
          }
        })
      });
      const data = await response.json();
      if (data.success && data.newItem) {
        const updated = menuItems.map(m => 
          m.id === item.id ? { ...data.newItem, id: item.id, quantity: item.quantity } : m
        );
        setMenuItems(updated);
        onUpdate?.(updated);
      }
    } catch (err) {
      console.error("Failed to regenerate item:", err);
    } finally {
      setIsRegenerating(null);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = menuItems.map(m => 
      m.id === id ? { ...m, quantity: Math.max(1, m.quantity + delta) } : m
    );
    setMenuItems(updated);
    onUpdate?.(updated);
  };

  const categories = [
    { id: 'meal', label: 'Main Meals', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'beverage', label: 'Beverages', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'dessert', label: 'Desserts', icon: Cake, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-xl">
      {/* Premium Header */}
      <div className="px-10 py-8 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            <ChefHat className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-wider">Event Dashboard</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Orchestrated Blueprint v4.0</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Menu Selection
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Logistics & Stock
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' ? (
            <motion.div 
              key="menu-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-12"
            >
              {categories.map(cat => {
                const items = menuItems.filter(m => m.category === cat.id);
                if (items.length === 0) return null;

                return (
                  <section key={cat.id} className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color}`}>
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                      <div className="flex-1 h-[1px] bg-slate-200 ml-4"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{items.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {items.map((item, idx) => (
                        <MenuCard 
                          key={item.id} 
                          item={item} 
                          idx={idx} 
                          isRegenerating={isRegenerating === item.id}
                          onRegenerate={() => handleRegenerateItem(item)}
                          onUpdateQty={(delta) => updateQuantity(item.id, delta)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="inv-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              {/* Inventory table or list ... existing logic simplified */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ingredient</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Required</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">In Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryFromSteps.map((inv: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800">{inv.item || inv.ingredient}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{inv.category || 'Kitchen Stock'}</p>
                        </td>
                        <td className="px-8 py-5 text-center font-mono font-bold text-slate-600">{inv.amount_kg}kg</td>
                        <td className="px-8 py-5 text-center font-mono text-slate-400">{inv.stock_kg || '0'}kg</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${(inv.status === 'ready' || !inv.shortage) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {(inv.status === 'ready' || !inv.shortage) ? 'Secured' : 'Shortage'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="p-8 bg-white border-t border-slate-100 flex flex-wrap justify-between items-center gap-6">
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
              <p className="text-sm font-black text-slate-800">{eventData.guest_count} Guests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Budget Track</p>
              <p className="text-sm font-black text-emerald-700">{eventData.budget}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.href = '#'}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all shadow-xl shadow-slate-900/10"
        >
          Confirm Event Plan
        </button>
      </div>
    </div>
  );
}

function MenuCard({ item, idx, isRegenerating, onRegenerate, onUpdateQty }: any) {
  // Use high quality image if available, else placeholder with search term
  const displayImage = item.image_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={displayImage} 
          alt={item.dish}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-slate-900 hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95"
            title="Regenerate this dish"
          >
            <RefreshCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="absolute bottom-5 left-6 right-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest">
              AI Optimized
            </span>
            {item.tags?.slice(0, 2).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest border border-white/30">
                {tag}
              </span>
            ))}
          </div>
          <h4 className="text-2xl font-black text-white tracking-tight leading-none truncate">{item.dish}</h4>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chef's Reasoning</p>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">"{item.reasoning}"</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Est. Cost</p>
            <p className="text-lg font-black text-emerald-700">₱{item.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Portion/Guest</p>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">{item.portion_per_guest}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Allergens</p>
            <p className="text-xs font-bold text-rose-500 truncate">{item.allergens?.join(', ') || 'None'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <button onClick={() => onUpdateQty(-1)} className="p-1 text-slate-400 hover:text-rose-500"><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-black text-slate-800 font-mono w-6 text-center">{item.quantity}</span>
            <button onClick={() => onUpdateQty(1)} className="p-1 text-slate-400 hover:text-emerald-500"><Plus className="w-4 h-4" /></button>
          </div>
          
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Inventory Matched</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
