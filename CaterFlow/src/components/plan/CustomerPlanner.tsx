import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Droplets,
  ChefHat,
  X,
  Plus,
  RefreshCcw,
  Clock,
  Users,
  Info,
  Loader2,
  UtensilsCrossed,
  Activity,
  BookOpen,
  Pencil,
  CheckCircle2,
  Sparkles,
  Zap,
  IceCream2,
} from 'lucide-react';
import { getFoodDetails } from '../../services/orchestrator';

interface DishVariation {
  id: string;
  dish: string;
  category: 'meal' | 'beverage' | 'dessert';
  portion_per_guest: string;
  portion_value?: number;
  quantity: number;
  price: number;
  ingredients?: any[];
  nutrition?: any;
  how_to_cook?: string[];
  notes?: string;
  descriptionNotes?: string;
  nutritionNotes?: string;
  cookingNotes?: string;
  reasoning: string;
  description?: string;
  tags?: string[];
  allergens?: string[];
}

type ModalSegment = 'description' | 'nutrition' | 'cooking';

// ── Robust category detection (desserts checked before drinks to avoid misclassification) ──
function detectCategory(m: any): 'meal' | 'beverage' | 'dessert' {
  const cat = String(m.category || m.type || '').toLowerCase();
  const dish = String(m.dish || m.name || '').toLowerCase();
  const tags = (Array.isArray(m.tags) ? m.tags : []).join(' ').toLowerCase();
  const combined = `${cat} ${dish} ${tags}`;

  if (/\bdessert\b|panghimagas|pastry|sweet\b|kakanin/.test(cat)) return 'dessert';
  if (/\bbeverage\b|\bdrink\b|inumin/.test(cat)) return 'beverage';
  if (/\bmeal\b|\bmain\b|appetizer|ulam|entree|viand/.test(cat)) return 'meal';

  const dessertWords = [
    'dessert', 'sweet', 'cake', 'pastry', 'pudding', 'leche flan', 'flan', 'halo-halo',
    'haluhalo', 'ice cream', 'icecream', 'gelato', 'sorbet', 'brownie', 'cookie', 'muffin',
    'cupcake', 'pie', 'tart', 'cheesecake', 'tiramisu', 'creme brulee', 'panna cotta',
    'macaroon', 'macarons', 'biko', 'bibingka', 'sapin-sapin', 'puto', 'kutsinta',
    'kalamay', 'palitaw', 'suman', 'champorado', 'ginataan', 'turon', 'banana cue',
    'kakanin', 'maja blanca', 'yema', 'pastillas', 'polvoron', 'ube halaya', 'ube cake',
    'chocolate cake', 'chocolate mousse', 'caramel custard', 'lava cake', 'sans rival',
  ];
  if (dessertWords.some((w) => combined.includes(w))) return 'dessert';

  const beverageWords = [
    'beverage', 'drink', 'juice', 'soda', 'softdrink', 'water', 'coffee', 'shake', 'smoothie',
    'lemonade', 'coke', 'sprite', 'cola', 'beer', 'wine', 'cocktail', 'mocktail',
    'punch', 'buko juice', 'gulaman', 'inumin', 'frappe', 'hot choco', 'hot chocolate',
    'calamansi juice', 'mango juice', 'pineapple juice', 'four seasons', 'iced tea', 'juice blend',
    'milk tea', 'tea station', 'refreshment',
  ];
  if (beverageWords.some((w) => combined.includes(w))) return 'beverage';

  return 'meal';
}

// ── Segment config (palette-aligned) ──
const SEGMENT_CONFIG = [
  {
    id: 'description' as ModalSegment,
    label: 'Description',
    shortLabel: '01',
    icon: BookOpen,
    // dark emerald tones
    tabActive: 'bg-white text-[#1e2b22] shadow-sm border border-slate-200 border-b-white',
    tabInactive: 'text-slate-400 hover:text-[#166534] hover:bg-white/60',
    iconActive: 'text-[#166534]',
    topBar: 'from-[#166534] to-[#2f7d4d]',
    dotColor: 'bg-[#166534]',
    pillActive: 'bg-[#166534]',
    focusRing: 'focus:border-[#166534] focus:ring-4 focus:ring-emerald-50',
    pencilColor: 'text-[#166534]',
    noteLabel: 'text-[#166534]',
    savedLabel: 'text-[#166534]',
    textareaBg: 'focus:border-[#166534]',
  },
  {
    id: 'nutrition' as ModalSegment,
    label: 'Nutritional Value',
    shortLabel: '02',
    icon: Activity,
    tabActive: 'bg-white text-[#1e2b22] shadow-sm border border-slate-200 border-b-white',
    tabInactive: 'text-slate-400 hover:text-[#e4572e] hover:bg-white/60',
    iconActive: 'text-[#e4572e]',
    topBar: 'from-[#e4572e] to-[#f2b84b]',
    dotColor: 'bg-[#e4572e]',
    pillActive: 'bg-[#e4572e]',
    focusRing: 'focus:border-[#e4572e] focus:ring-4 focus:ring-orange-50',
    pencilColor: 'text-[#e4572e]',
    noteLabel: 'text-[#e4572e]',
    savedLabel: 'text-[#166534]',
    textareaBg: 'focus:border-[#e4572e]',
  },
  {
    id: 'cooking' as ModalSegment,
    label: 'Ingredients & Cook',
    shortLabel: '03',
    icon: ChefHat,
    tabActive: 'bg-white text-[#1e2b22] shadow-sm border border-slate-200 border-b-white',
    tabInactive: 'text-slate-400 hover:text-[#f2b84b] hover:bg-white/60',
    iconActive: 'text-[#c49b2e]',
    topBar: 'from-[#f2b84b] to-[#e4572e]',
    dotColor: 'bg-[#f2b84b]',
    pillActive: 'bg-[#f2b84b]',
    focusRing: 'focus:border-[#f2b84b] focus:ring-4 focus:ring-yellow-50',
    pencilColor: 'text-[#c49b2e]',
    noteLabel: 'text-[#c49b2e]',
    savedLabel: 'text-[#166534]',
    textareaBg: 'focus:border-[#f2b84b]',
  },
];

// ── Category config (palette-aligned) ──
const CATEGORY_CONFIG = [
  {
    id: 'meal' as const,
    label: 'Main Menu',
    subtitle: 'Entrées & Mains',
    icon: Flame,
    emoji: '🍖',
    // slate-900 header with emerald accent
    headerGrad: 'from-[#0f172a] to-[#1e293b]',
    cardTopBar: 'from-[#166534] to-[#2f7d4d]',
    sectionLine: 'from-[#166534]/30 to-transparent',
    badgeBg: 'bg-emerald-50 text-[#166534] border border-emerald-100',
    emptyBorder: 'border-emerald-200/60',
    emptyIcon: 'text-[#166534]/30',
    emptyIconBg: 'bg-emerald-50',
    addBtnColor: 'text-[#166534] border-emerald-200 hover:bg-emerald-50',
    iconBg: 'bg-[#166534]',
    detailsHover: 'group-hover:bg-[#166534] group-hover:text-white',
    detailsBase: 'text-[#166534]',
  },
  {
    id: 'beverage' as const,
    label: 'Drinks',
    subtitle: 'Beverages & Refreshments',
    icon: Droplets,
    emoji: '🥤',
    // slate-900 header with tomato accent
    headerGrad: 'from-[#0f172a] to-[#1e293b]',
    cardTopBar: 'from-[#e4572e] to-[#f2b84b]',
    sectionLine: 'from-[#e4572e]/30 to-transparent',
    badgeBg: 'bg-orange-50 text-[#e4572e] border border-orange-100',
    emptyBorder: 'border-orange-200/60',
    emptyIcon: 'text-[#e4572e]/30',
    emptyIconBg: 'bg-orange-50',
    addBtnColor: 'text-[#e4572e] border-orange-200 hover:bg-orange-50',
    iconBg: 'bg-[#e4572e]',
    detailsHover: 'group-hover:bg-[#e4572e] group-hover:text-white',
    detailsBase: 'text-[#e4572e]',
  },
  {
    id: 'dessert' as const,
    label: 'Desserts',
    subtitle: 'Sweets & Pastries',
    icon: IceCream2,
    emoji: '🍰',
    // slate-900 header with gold accent
    headerGrad: 'from-[#0f172a] to-[#1e293b]',
    cardTopBar: 'from-[#f2b84b] to-[#e4572e]',
    sectionLine: 'from-[#f2b84b]/40 to-transparent',
    badgeBg: 'bg-amber-50 text-[#c49b2e] border border-amber-100',
    emptyBorder: 'border-amber-200/60',
    emptyIcon: 'text-[#c49b2e]/30',
    emptyIconBg: 'bg-amber-50',
    addBtnColor: 'text-[#c49b2e] border-amber-200 hover:bg-amber-50',
    iconBg: 'bg-[#c49b2e]',
    detailsHover: 'group-hover:bg-[#c49b2e] group-hover:text-white',
    detailsBase: 'text-[#c49b2e]',
  },
];

export function CustomerPlanner({
  menu,
  steps,
  monitoring,
  pricing,
  eventData,
  onUpdate,
}: {
  menu?: any[];
  steps: any[];
  monitoring?: any;
  pricing?: any;
  eventData: any;
  onUpdate?: (menu: any[]) => void;
}) {
  const menuFromSteps = Array.isArray(menu) && menu.length > 0
    ? menu
    : (() => {
        const found = Array.isArray(steps) ? steps.find((s) => s?.agent?.includes('Head Chef'))?.data : null;
        if (!found) return [];
        return Array.isArray(found.menu) ? found.menu :
               Array.isArray(found.dishes) ? found.dishes :
               Array.isArray(found.recommendations) ? found.recommendations : [];
      })();

  const [menuItems, setMenuItems] = useState<DishVariation[]>(() =>
    Array.isArray(menuFromSteps)
      ? menuFromSteps.map((m: any, i: number) => {
          const category = detectCategory(m);
          const portionValue =
            typeof m.portion_value === 'number'
              ? m.portion_value
              : parseInt(m.portion_per_guest) || (category === 'beverage' ? 250 : 200);
          return {
            ...m,
            id: m.id || `dish-${i}`,
            category,
            portion_per_guest:
              m.portion_per_guest || (category === 'beverage' ? '250ml' : '200g'),
            portion_value: portionValue,
            quantity: m.quantity || 1,
            price:
              parseInt(m.price) ||
              (category === 'meal' ? 150 : category === 'dessert' ? 80 : 50),
          };
        })
      : []
  );

  const [selectedItem, setSelectedItem] = useState<DishVariation | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeSegment, setActiveSegment] = useState<ModalSegment>('description');
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [customDishName, setCustomDishName] = useState('');
  const [customCategory, setCustomCategory] = useState<'meal' | 'beverage' | 'dessert'>('meal');

  useEffect(() => {
    if (Array.isArray(menu) && menu.length > 0) {
      setMenuItems(
        menu.map((m: any) => ({
          ...m,
          category: detectCategory(m),
          portion_value:
            typeof m.portion_value === 'number'
              ? m.portion_value
              : parseInt(m.portion_per_guest) || 200,
        }))
      );
    }
  }, [menu]);

  const handleRegenerateItem = async (item: DishVariation, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRegenerating(item.id);
    try {
      const res = await fetch('/api/ai/regenerate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItem: item,
          context: {
            theme: eventData?.event_type,
            guests: eventData?.guest_count,
            location: eventData?.event_location,
            budget: eventData?.budget,
          },
        }),
      });

      if (!res.ok) {
        console.error('Regenerate failed, status:', res.status);
        return;
      }

      const data = await res.json();

      if (data.success && data.newItem && data.newItem.dish) {
        const updatedItem: DishVariation = {
          ...item,
          ...data.newItem,
          id: item.id,
          category: detectCategory(data.newItem) || item.category,
          quantity: item.quantity,
          portion_value: parseInt(String(data.newItem.portion_per_guest)) || item.portion_value || 200,
          price: parseInt(String(data.newItem.price)) || item.price || (item.category === 'meal' ? 150 : item.category === 'dessert' ? 80 : 50),
        };
        const updated = menuItems.map((m) => (m.id === item.id ? updatedItem : m));
        setMenuItems(updated);
        onUpdate?.(updated);
      } else {
        console.error('Regenerate response missing newItem.dish:', data);
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleAddCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDishName.trim()) return;
    setIsAdding(true);
    try {
      const details = await getFoodDetails(customDishName, `${customCategory} course`);
      const newFood: DishVariation = {
        id: `custom-dish-${Date.now()}`,
        dish: customDishName,
        category: customCategory,
        portion_per_guest: customCategory === 'beverage' ? '250ml' : '200g',
        portion_value: customCategory === 'beverage' ? 250 : 200,
        quantity: 1,
        price: customCategory === 'meal' ? 180 : customCategory === 'dessert' ? 90 : 60,
        ingredients: details.ingredients || [],
        nutrition: details.nutrition || {},
        how_to_cook: details.how_to_cook || [],
        reasoning: 'Custom customer selected food item.',
        tags: [customCategory, 'custom'],
        allergens: [],
      };
      const updated = [...menuItems, newFood];
      setMenuItems(updated);
      onUpdate?.(updated);
      setCustomDishName('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add custom food:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    onUpdate?.(menuItems.filter((m) => m.id !== id));
  };

  const handleItemClick = async (item: DishVariation) => {
    setSelectedItem(item);
    setActiveSegment('description');
    if (!item.ingredients || item.ingredients.length === 0 || !item.how_to_cook) {
      setLoadingDetails(true);
      try {
        const details = await getFoodDetails(item.dish, item.reasoning || item.description || '');
        const updatedItem = {
          ...item,
          ingredients: details.ingredients || [],
          nutrition: details.nutrition || { calories: 300, protein: '15g', carbs: '20g', fat: '10g' },
          how_to_cook: details.how_to_cook || [],
        };
        setSelectedItem(updatedItem);
        const updated = menuItems.map((m) => (m.id === item.id ? updatedItem : m));
        setMenuItems(updated);
        onUpdate?.(updated);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const saveSegmentNote = (
    id: string,
    field: 'descriptionNotes' | 'nutritionNotes' | 'cookingNotes',
    value: string
  ) => {
    const updated = menuItems.map((m) => (m.id === id ? { ...m, [field]: value } : m));
    setMenuItems(updated);
    onUpdate?.(updated);
    if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, [field]: value });
  };

  const activeSegCfg = SEGMENT_CONFIG.find((s) => s.id === activeSegment)!;
  const totalItems = menuItems.length;
  const guests = Number(eventData.guest_count || 100);

  return (
    <div
      className="flex flex-col h-full w-full min-w-0 rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-xl"
      style={{ background: 'var(--cream)' }}
    >
      {/* ── Header ── */}
      <div
        className="px-8 py-5 border-b border-slate-200/60 flex items-center justify-between gap-4 flex-shrink-0"
        style={{ background: 'var(--card-bg)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'var(--slate-dark)' }}
          >
            <ChefHat className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2
              className="text-base font-black tracking-tight uppercase"
              style={{ color: 'var(--text-color)' }}
            >
              Menu Dashboard
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em]">
              {totalItems} dishes · {guests} guests · tap any dish for details & notes
            </p>
          </div>
        </div>

        {/* Big Add Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2.5 text-white px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
          style={{ background: 'var(--primary-emerald)' }}
        >
          <Plus className="w-4 h-4" />
          Add Food Item
        </motion.button>
      </div>

      {/* ── Scrollable Menu Dashboard ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
        {CATEGORY_CONFIG.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat.id);
          return (
            <section key={cat.id} className="space-y-5">
              {/* Section Header */}
              <div className="flex items-center gap-4">
                {/* Gradient icon pill */}
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white shadow-md bg-gradient-to-br ${cat.headerGrad} flex-shrink-0`}
                >
                  <span className="text-lg leading-none">{cat.emoji}</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 leading-none mb-0.5">
                      {cat.subtitle}
                    </p>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide leading-none">
                      {cat.label}
                    </h3>
                  </div>
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-[8px] font-black"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {items.length}
                  </span>
                </div>
                {/* Divider line */}
                <div
                  className={`flex-1 h-px bg-gradient-to-r ${cat.sectionLine}`}
                />
              </div>

              {/* Empty state */}
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-2 border-dashed ${cat.emptyBorder} rounded-[2rem] p-10 text-center`}
                  style={{ background: 'rgba(255,255,255,0.5)' }}
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.emptyIconBg} flex items-center justify-center mx-auto mb-3`}>
                    <cat.icon className={`w-7 h-7 ${cat.emptyIcon}`} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    No {cat.label} yet
                  </p>
                  <button
                    onClick={() => { setCustomCategory(cat.id); setShowAddModal(true); }}
                    className={`mt-4 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${cat.addBtnColor} transition-all`}
                  >
                    + Add {cat.label}
                  </button>
                </motion.div>
              ) : (
                /* Cards grid — full width when a section has few items */
                <div
                  className={`grid gap-4 w-full ${
                    items.length === 1
                      ? 'grid-cols-1'
                      : items.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {items.map((item, idx) => {
                    const hasNotes = item.descriptionNotes || item.nutritionNotes || item.cookingNotes;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 120 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleItemClick(item)}
                        className={`w-full rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col relative ${
                          items.length === 1 ? 'col-span-full' : ''
                        }`}
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          boxShadow: 'var(--card-shadow)',
                        }}
                      >
                        {/* Top accent bar */}
                        <div className={`h-1 bg-gradient-to-r ${cat.cardTopBar} flex-shrink-0`} />

                        <div className="p-5 flex flex-col flex-1 gap-3">
                          {/* Badges row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${cat.badgeBg}`}>
                              {item.tags?.includes('custom') ? '★ Custom' : 'Chef Pick'}
                            </span>
                            {hasNotes && (
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 flex items-center gap-0.5">
                                <Pencil className="w-2.5 h-2.5" />
                                Notes
                              </span>
                            )}
                          </div>

                          {/* Dish name */}
                          <h4
                            className="text-sm font-black tracking-tight leading-snug line-clamp-2 transition-colors"
                            style={{ color: 'var(--text-color)' }}
                          >
                            {item.dish}
                          </h4>

                          {/* Description */}
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 flex-1">
                            {item.reasoning || item.description || 'Chef-curated selection for your event.'}
                          </p>

                          {/* Portion */}
                          <div
                            className="flex items-center justify-between border-t pt-3"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {item.portion_per_guest} / pax
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all duration-300 ${cat.detailsBase} ${cat.detailsHover}`}
                              style={{ border: '1px solid currentColor' }}
                            >
                              <Info className="w-3 h-3" />
                              Details
                            </div>
                          </div>
                        </div>

                        {/* Action row */}
                        <div
                          className="px-5 py-3 flex gap-2"
                          style={{ borderTop: '1px solid var(--border-color)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleRegenerateItem(item, e)}
                            disabled={isRegenerating === item.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                            style={{
                              background: 'var(--header-bg)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-color)',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--slate-dark)';
                              (e.currentTarget as HTMLButtonElement).style.color = '#34d399';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--slate-dark)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--header-bg)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-color)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                            }}
                          >
                            {isRegenerating === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-3 h-3" />
                            )}
                            Replace
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleRemoveItem(item.id, e)}
                            className="px-3 py-2.5 rounded-xl text-[#e4572e] transition-all duration-200 hover:bg-[#e4572e] hover:text-white"
                            style={{ background: '#fff1ef', border: '1px solid #fdd5ce' }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Bottom CTA */}
        <div className="flex items-center justify-between py-4 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {guests} Guests · {totalItems} Total Dishes
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-emerald-400 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md"
            style={{ background: 'var(--slate-dark)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Dish
          </motion.button>
        </div>
      </div>

      {/* ── Add Food Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.72)' }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden relative"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              {/* Cream top bar — brand gradient */}
              <div className="h-2 bg-gradient-to-r from-[#166534] via-[#2f7d4d] to-[#e4572e]" />

              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(22,101,52,0.08)', border: '1px solid rgba(22,101,52,0.15)' }}
                    >
                      <Sparkles className="w-5 h-5" style={{ color: 'var(--primary-emerald)' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                        Add Food Item
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        AI will auto-generate recipe details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddCustomFood} className="space-y-5">
                  {/* Dish name */}
                  <div>
                    <label
                      className="text-[9px] font-black uppercase tracking-widest block mb-2"
                      style={{ color: 'var(--text-color)' }}
                    >
                      Dish / Drink Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Beef Kare-Kare, Mango Float, Buko Pandan..."
                      value={customDishName}
                      onChange={(e) => setCustomDishName(e.target.value)}
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition"
                      style={{
                        background: 'var(--header-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                      }}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <label
                      className="text-[9px] font-black uppercase tracking-widest block mb-3"
                      style={{ color: 'var(--text-color)' }}
                    >
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {CATEGORY_CONFIG.map((cat) => (
                        <motion.button
                          key={cat.id}
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setCustomCategory(cat.id)}
                          className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all duration-200 ${
                            customCategory === cat.id
                              ? 'text-white shadow-xl'
                              : 'text-slate-500'
                          }`}
                          style={
                            customCategory === cat.id
                              ? {
                                  background: 'var(--slate-dark)',
                                  border: '2px solid var(--slate-dark)',
                                }
                              : {
                                  background: 'var(--header-bg)',
                                  border: '2px solid var(--border-color)',
                                }
                          }
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          <span>{cat.label}</span>
                          {customCategory === cat.id && (
                            <span
                              className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}
                            >
                              Selected
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isAdding || !customDishName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.2em] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{ background: 'var(--primary-emerald)' }}
                  >
                    {isAdding ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Generating Recipe...</>
                    ) : (
                      <><Zap className="w-4 h-4" />Add &amp; Auto-Generate Recipe</>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3-Segment Food Details Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.72)' }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-[2.5rem] max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              {/* Segment-keyed top bar */}
              <motion.div
                key={activeSegment}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`h-1.5 bg-gradient-to-r ${activeSegCfg.topBar} flex-shrink-0`}
              />

              {/* Modal Header */}
              <div
                className="px-8 py-6 flex items-center justify-between gap-4 flex-shrink-0"
                style={{
                  background: 'var(--card-bg)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {(() => {
                    const catCfg = CATEGORY_CONFIG.find((c) => c.id === selectedItem.category)!;
                    return (
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${catCfg.headerGrad} shadow-lg text-white`}
                      >
                        <catCfg.icon className="w-7 h-7" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {(() => {
                        const catCfg = CATEGORY_CONFIG.find((c) => c.id === selectedItem.category)!;
                        return (
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg ${catCfg.badgeBg}`}>
                            {catCfg.label}
                          </span>
                        );
                      })()}
                      <span
                        className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg"
                        style={{
                          background: 'var(--header-bg)',
                          color: 'var(--text-color)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {selectedItem.portion_per_guest} / pax
                      </span>
                    </div>
                    <h3
                      className="text-xl font-black truncate leading-tight tracking-tight"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {selectedItem.dish}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2.5 rounded-full transition flex-shrink-0"
                  style={{
                    background: 'var(--header-bg)',
                    border: '1px solid var(--border-color)',
                    color: '#94a3b8',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3-Segment Tabs */}
              <div
                className="flex px-6 pt-4 gap-1 flex-shrink-0"
                style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}
              >
                {SEGMENT_CONFIG.map((seg, idx) => {
                  const SegIcon = seg.icon;
                  const isActive = activeSegment === seg.id;
                  const noteField =
                    seg.id === 'description' ? 'descriptionNotes'
                    : seg.id === 'nutrition' ? 'nutritionNotes'
                    : 'cookingNotes';
                  const hasNote = !!(selectedItem as any)[noteField];
                  return (
                    <button
                      key={seg.id}
                      onClick={() => setActiveSegment(seg.id)}
                      className={`relative flex items-center gap-2 px-4 py-3 rounded-t-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex-1 justify-center -mb-px ${
                        isActive ? seg.tabActive : seg.tabInactive
                      }`}
                    >
                      <SegIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? seg.iconActive : ''}`} />
                      <span className="hidden sm:block">
                        {idx === 0 ? 'Description' : idx === 1 ? 'Nutrition' : 'Ingredients'}
                      </span>
                      <span className="sm:hidden font-black">0{idx + 1}</span>
                      {hasNote && (
                        <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${seg.dotColor}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Segment Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary-emerald)' }} />
                      <div
                        className="absolute inset-0 rounded-full border-4 animate-ping"
                        style={{ borderColor: 'rgba(22,101,52,0.15)' }}
                      />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                      Master Chef is loading details...
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSegment}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                      className="p-8 space-y-6"
                    >
                      {/* ── SEGMENT 1: DESCRIPTION ── */}
                      {activeSegment === 'description' && (
                        <>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(22,101,52,0.08)', border: '1px solid rgba(22,101,52,0.15)' }}
                              >
                                <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--primary-emerald)' }} />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                About This Dish
                              </h4>
                            </div>
                            <div
                              className="rounded-2xl p-5"
                              style={{ background: 'var(--header-bg)', border: '1px solid var(--border-color)' }}
                            >
                              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-color)' }}>
                                {selectedItem.description || selectedItem.reasoning || 'A premium culinary selection for your event.'}
                              </p>
                            </div>
                          </div>

                          {((Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0) || (Array.isArray(selectedItem.allergens) && selectedItem.allergens.length > 0)) ? (
                            <div className="space-y-4">
                              {Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tags</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedItem.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                        style={{
                                          background: 'rgba(22,101,52,0.07)',
                                          border: '1px solid rgba(22,101,52,0.15)',
                                          color: 'var(--primary-emerald)',
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(selectedItem.allergens) && selectedItem.allergens.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">⚠️ Allergens</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedItem.allergens.map((al, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                        style={{
                                          background: '#fff1ef',
                                          border: '1px solid #fdd5ce',
                                          color: '#e4572e',
                                        }}
                                      >
                                        {al}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* Notes */}
                          <div className="space-y-2 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2">
                              <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--primary-emerald)' }} />
                              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                Your Notes on Description
                              </label>
                            </div>
                            <textarea
                              placeholder='"Make it less spicy", "Serve cold", "Extra garnish"...'
                              value={selectedItem.descriptionNotes || ''}
                              onChange={(e) => saveSegmentNote(selectedItem.id, 'descriptionNotes', e.target.value)}
                              className="w-full min-h-[90px] rounded-[1.5rem] p-4 text-xs font-bold outline-none transition resize-none focus:ring-4"
                              style={{
                                background: 'var(--header-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-color)',
                              }}
                            />
                            {selectedItem.descriptionNotes && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--primary-emerald)' }} />
                                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary-emerald)' }}>Note saved</p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}

                      {/* ── SEGMENT 2: NUTRITIONAL VALUE ── */}
                      {activeSegment === 'nutrition' && (
                        <>
                          {selectedItem.nutrition ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                                  style={{ background: '#fff1ef', border: '1px solid #fdd5ce' }}
                                >
                                  <Activity className="w-3.5 h-3.5" style={{ color: '#e4572e' }} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                  Nutritional Breakdown
                                </h4>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: 'Calories', val: selectedItem.nutrition.calories || '300 kcal', icon: '🔥', bg: '#fff1ef', border: '#fdd5ce', color: '#e4572e' },
                                  { label: 'Protein', val: selectedItem.nutrition.protein || '20g', icon: '💪', bg: 'rgba(22,101,52,0.07)', border: 'rgba(22,101,52,0.2)', color: 'var(--primary-emerald)' },
                                  { label: 'Carbs', val: selectedItem.nutrition.carbs || '15g', icon: '🌾', bg: 'rgba(242,184,75,0.1)', border: 'rgba(242,184,75,0.3)', color: '#c49b2e' },
                                  { label: 'Fat', val: selectedItem.nutrition.fat || '10g', icon: '🥑', bg: 'var(--header-bg)', border: 'var(--border-color)', color: 'var(--text-color)' },
                                ].map((macro, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="rounded-2xl p-4 text-center"
                                    style={{ background: macro.bg, border: `1px solid ${macro.border}` }}
                                  >
                                    <p className="text-xl mb-1">{macro.icon}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70" style={{ color: macro.color }}>
                                      {macro.label}
                                    </p>
                                    <p className="text-sm font-black leading-none" style={{ color: macro.color }}>
                                      {macro.val}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10">
                              <Activity className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nutritional data loading...</p>
                            </div>
                          )}

                          {/* Notes */}
                          <div className="space-y-2 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2">
                              <Pencil className="w-3.5 h-3.5" style={{ color: '#e4572e' }} />
                              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                Your Nutrition Notes
                              </label>
                            </div>
                            <textarea
                              placeholder='"Low-carb version", "Gluten-free needed", "Reduce salt"...'
                              value={selectedItem.nutritionNotes || ''}
                              onChange={(e) => saveSegmentNote(selectedItem.id, 'nutritionNotes', e.target.value)}
                              className="w-full min-h-[90px] rounded-[1.5rem] p-4 text-xs font-bold outline-none transition resize-none focus:ring-4"
                              style={{
                                background: 'var(--header-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-color)',
                              }}
                            />
                            {selectedItem.nutritionNotes && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--primary-emerald)' }} />
                                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary-emerald)' }}>Note saved</p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}

                      {/* ── SEGMENT 3: INGREDIENTS & HOW TO COOK ── */}
                      {activeSegment === 'cooking' && (
                        <>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                                  style={{ background: 'rgba(242,184,75,0.12)', border: '1px solid rgba(242,184,75,0.3)' }}
                                >
                                  <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: '#c49b2e' }} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                  Ingredients
                                </h4>
                              </div>
                              {Array.isArray(selectedItem.ingredients) && (
                                <span
                                  className="text-[9px] font-black px-2.5 py-0.5 rounded-lg"
                                  style={{
                                    background: 'var(--header-bg)',
                                    border: '1px solid var(--border-color)',
                                    color: '#94a3b8',
                                  }}
                                >
                                  {selectedItem.ingredients.length} items
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Array.isArray(selectedItem.ingredients) && selectedItem.ingredients.map((ing: any, i: number) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.025 }}
                                  className="rounded-2xl p-3.5 flex justify-between items-center"
                                  style={{
                                    background: 'rgba(242,184,75,0.07)',
                                    border: '1px solid rgba(242,184,75,0.2)',
                                  }}
                                >
                                  <span className="text-xs font-bold" style={{ color: 'var(--text-color)' }}>
                                    {ing.item || ing}
                                  </span>
                                  {ing.qty && (
                                    <span
                                      className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg"
                                      style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: '#94a3b8',
                                      }}
                                    >
                                      {ing.qty}
                                    </span>
                                  )}
                                </motion.div>
                              ))}
                              {(!Array.isArray(selectedItem.ingredients) || selectedItem.ingredients.length === 0) && (
                                <p className="text-xs text-slate-400 italic col-span-2">Ingredients not yet loaded.</p>
                              )}
                            </div>
                          </div>

                          {Array.isArray(selectedItem.how_to_cook) && selectedItem.how_to_cook.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                                  style={{ background: 'rgba(242,184,75,0.12)', border: '1px solid rgba(242,184,75,0.3)' }}
                                >
                                  <ChefHat className="w-3.5 h-3.5" style={{ color: '#c49b2e' }} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                  How to Cook
                                </h4>
                              </div>
                              <div className="space-y-2.5">
                                {selectedItem.how_to_cook.map((step, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex gap-4 p-4 rounded-2xl items-start"
                                    style={{
                                      background: 'rgba(242,184,75,0.05)',
                                      border: '1px solid rgba(242,184,75,0.15)',
                                    }}
                                  >
                                    <span
                                      className="w-6 h-6 rounded-xl font-mono font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5"
                                      style={{ background: 'var(--slate-dark)', color: '#34d399' }}
                                    >
                                      {i + 1}
                                    </span>
                                    <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-color)' }}>
                                      {step}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          <div className="space-y-2 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2">
                              <Pencil className="w-3.5 h-3.5" style={{ color: '#c49b2e' }} />
                              <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                                Your Cooking / Preparation Notes
                              </label>
                            </div>
                            <textarea
                              placeholder='"Sauce on the side", "Well-done", "No onions", "Extra crispy"...'
                              value={selectedItem.cookingNotes || ''}
                              onChange={(e) => saveSegmentNote(selectedItem.id, 'cookingNotes', e.target.value)}
                              className="w-full min-h-[90px] rounded-[1.5rem] p-4 text-xs font-bold outline-none transition resize-none focus:ring-4"
                              style={{
                                background: 'var(--header-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-color)',
                              }}
                            />
                            {selectedItem.cookingNotes && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--primary-emerald)' }} />
                                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary-emerald)' }}>Note saved</p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Modal Footer */}
              <div
                className="px-8 py-5 flex items-center justify-between flex-shrink-0"
                style={{ borderTop: '1px solid var(--border-color)', background: 'var(--header-bg)' }}
              >
                <button
                  onClick={() => {
                    const idx = SEGMENT_CONFIG.findIndex((s) => s.id === activeSegment);
                    if (idx > 0) setActiveSegment(SEGMENT_CONFIG[idx - 1].id);
                  }}
                  disabled={activeSegment === 'description'}
                  className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-color)',
                  }}
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-2">
                  {SEGMENT_CONFIG.map((seg) => (
                    <button
                      key={seg.id}
                      onClick={() => setActiveSegment(seg.id)}
                      className={`h-2 rounded-full transition-all duration-300 ${activeSegment === seg.id ? `${seg.pillActive} w-6` : 'bg-slate-200 hover:bg-slate-300 w-2'}`}
                    />
                  ))}
                </div>

                {activeSegment !== 'cooking' ? (
                  <button
                    onClick={() => {
                      const idx = SEGMENT_CONFIG.findIndex((s) => s.id === activeSegment);
                      if (idx < SEGMENT_CONFIG.length - 1) setActiveSegment(SEGMENT_CONFIG[idx + 1].id);
                    }}
                    className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition text-emerald-400"
                    style={{ background: 'var(--slate-dark)' }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition text-white flex items-center gap-1.5"
                    style={{ background: 'var(--primary-emerald)' }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
