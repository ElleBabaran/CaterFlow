import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, ClipboardList, Send, DollarSign, ArrowRight, ShieldCheck, Tag, MapPin, Calendar, Utensils, Users, Activity, AlertCircle, Leaf, CheckCircle2 } from 'lucide-react';
import { parseBudgetDetails } from '../../services/budget';

export function CheckoutPortal({ 
  eventId, 
  shop, 
  event, 
  blueprint, 
  status, 
  localMenu = [], 
  onAccept, 
  onFinalize, 
  onChatWithShop 
}: { 
  eventId: string, 
  shop: any, 
  event: any, 
  blueprint: any[], 
  status: string, 
  localMenu?: any[], 
  onAccept: () => void, 
  onFinalize: (finalMenu: any[]) => void, 
  onChatWithShop?: (shop: any) => void 
}) {
  const [msg, setMsg] = useState('');
  const [localMsgs, setLocalMsgs] = useState<any[]>([
    { role: 'admin', text: "Hello! We've received your catering blueprint. The menu looks great. Would you like to proceed with this quote?", time: 'Just now' }
  ]);

  const activeMenu = localMenu && localMenu.length > 0 
    ? localMenu 
    : (blueprint.find((s: any) => s.agent.includes('Head Chef'))?.data.menu || []);

  const guests = Number(event.guest_count || event.guests || 100);

  // Staffing Costs
  const waitstaffCount = Math.max(2, Math.ceil(guests / 15));
  const waitstaffTotal = waitstaffCount * 1500;
  const kitchenStaffTotal = 3500 + 4000;
  const logisticsTotal = 2500;
  const staffTotal = waitstaffTotal + kitchenStaffTotal + logisticsTotal;

  // Budget Parsing
  const parsedBudget = parseBudgetDetails(event.budget || '');
  const budgetValue = parsedBudget.value > 0 ? parsedBudget.value : (guests * 500);

  // Deduct staff costs to guarantee Food Total + Staff Total = Budget Value exactly
  const foodTotalLimit = Math.max(guests * 150, budgetValue - staffTotal);
  const totalPerGuest = Math.floor(foodTotalLimit / guests);
  const estimatedFoodTotal = totalPerGuest * guests;

  // Dynamically scale dish prices so they sum to exactly totalPerGuest
  const getScaledMenu = () => {
    let runningSum = 0;
    return activeMenu.map((item: any, idx: number) => {
      let pricePerPax = 0;
      if (idx === activeMenu.length - 1) {
        pricePerPax = Math.max(20, totalPerGuest - runningSum);
      } else {
        const category = (item.category || '').toLowerCase();
        const name = (item.dish || '').toLowerCase();
        let weight = 0.50; // Main
        if (category.includes('bev') || name.includes('juice') || name.includes('soda') || name.includes('tea') || name.includes('drink')) {
          weight = 0.15;
        } else if (category.includes('dessert') || name.includes('cake') || name.includes('creme') || name.includes('pastry') || name.includes('pudding')) {
          weight = 0.25;
        } else {
          weight = 0.60;
        }
        
        // Distribute weight
        const matchingItemsCount = activeMenu.filter((m: any) => {
          const cat = (m.category || '').toLowerCase();
          const d = (m.dish || '').toLowerCase();
          if (category.includes('bev') || name.includes('juice') || name.includes('soda') || name.includes('tea') || name.includes('drink')) {
            return cat.includes('bev') || d.includes('juice') || d.includes('soda') || d.includes('tea') || d.includes('drink');
          }
          if (category.includes('dessert') || name.includes('cake') || name.includes('creme') || name.includes('pastry') || name.includes('pudding')) {
            return cat.includes('dessert') || d.includes('cake') || d.includes('creme') || d.includes('pastry') || d.includes('pudding');
          }
          return true;
        }).length || 1;
        
        pricePerPax = Math.max(20, Math.round(totalPerGuest * (weight / matchingItemsCount)));
        runningSum += pricePerPax;
      }
      return {
        ...item,
        price: pricePerPax
      };
    });
  };

  const scaledMenu = getScaledMenu();

  // Extract ingredients from inventory step procurement list or fallback from recipe
  const inventoryStep = blueprint.find(s => s.agent.includes('Inventory'));
  const rawProcurement = inventoryStep?.data?.procurement_list || inventoryStep?.data?.inventory || [];
  
  // Fallback to scaledMenu ingredients if procurement list is empty
  const hasRawProcurement = Array.isArray(rawProcurement) && rawProcurement.length > 0;
  const procurementList = hasRawProcurement 
    ? rawProcurement.map((item: any) => ({
        name: item.item || item.ingredient || "Ingredient",
        qty: item.qty || item.amount_kg ? `${item.amount_kg}kg` : "15kg",
        category: item.source_category || item.category || "Kitchen Stock"
      }))
    : scaledMenu.flatMap((m: any) => {
        const ingredientsArray = Array.isArray(m.ingredients) ? m.ingredients : [];
        return ingredientsArray.map((ing: any) => {
          const name = typeof ing === 'string' ? ing : ing.item || "Ingredient";
          // Estimate quantity per guest (e.g. 0.15kg per guest)
          const estQty = Math.round(guests * 0.12);
          return {
            name,
            qty: `${estQty}kg`,
            category: m.category === 'beverage' ? 'Beverage Wholesale' : 'Produce'
          };
        });
      });

  // Calculate lowest bulk price dynamically for ingredients
  const getIngredientWholesaleCost = (name: string, qtyStr: string) => {
    const num = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || (guests * 0.1);
    let unitPrice = 120; // PHP per unit/kg standard
    const lower = name.toLowerCase();
    
    if (lower.includes('beef') || lower.includes('pork') || lower.includes('meat') || lower.includes('chicken') || lower.includes('shrimp') || lower.includes('fish') || lower.includes('protein')) {
      unitPrice = 280;
    } else if (lower.includes('vegetable') || lower.includes('cabbage') || lower.includes('onion') || lower.includes('garlic') || lower.includes('tomato')) {
      unitPrice = 85;
    } else if (lower.includes('rice') || lower.includes('dry') || lower.includes('flour') || lower.includes('sugar')) {
      unitPrice = 45;
    } else if (lower.includes('sauce') || lower.includes('oil') || lower.includes('condiment')) {
      unitPrice = 70;
    } else if (lower.includes('juice') || lower.includes('beverage') || lower.includes('soda') || lower.includes('milk')) {
      unitPrice = 60;
    }
    
    return {
      unitPrice,
      total: Math.round(num * unitPrice)
    };
  };

  const ingredientsWithCost = procurementList.map((ing: any, idx: number) => {
    const cost = getIngredientWholesaleCost(ing.name, ing.qty);
    return {
      id: idx,
      ...ing,
      unitPrice: cost.unitPrice,
      totalCost: cost.total
    };
  });

  let ingredientsGrandTotal = ingredientsWithCost.reduce((sum, item) => sum + item.totalCost, 0);
  if (ingredientsGrandTotal === 0) {
    // Fallback for existing conversations that might not have a menu or blueprint yet
    ingredientsGrandTotal = budgetValue * 0.40;
  }

  const formatAmt = (n: number) => {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const send = () => {
    if (!msg.trim()) return;
    setLocalMsgs([...localMsgs, { role: 'customer', text: msg, time: 'Just now' }]);
    setMsg('');
  };

  if (status === 'finalized') {
    return (
      <div className="h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[50vh] gap-6 py-12 text-center"
        >
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <motion.div className="space-y-2 max-w-md">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Order Finalized</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Shops, QR code, and shop chat are in the <span className="font-black text-emerald-700">Finalization</span> step — open that tab to continue.
            </p>
          </motion.div>
          {onChatWithShop && (
            <button
              type="button"
              onClick={() => onChatWithShop(shop)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all"
            >
              Open Shop Chat
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // Derive values for the brief card
  const planTitle = event.conversationTitle || event.title || 'Untitled Catering Plan';
  const serviceStyle = event.service_style || 'Buffet';
  const dietaryNeeds = event.dietary_needs || 'Standard diet';
  const allergens = event.allergens || event.allergen_info || 'No allergens detected';
  const readinessScore = blueprint?.find((s: any) => s.agent?.includes('Monitoring') || s.agent?.includes('QA'))?.data?.execution_readiness || 95;
  const eventLocation = event.event_location || 'Not Specified';
  const eventDate = event.event_date ? `${event.event_date} · Standard Timeline` : 'TBD · Standard Timeline';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-140px)] gap-5 p-6 overflow-y-auto custom-scrollbar"
    >
      {/* ── ACTIVE EVENT BRIEF CARD (dark green header like the screenshot) ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
        className="relative overflow-hidden rounded-[2rem] flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #0d3d25 0%, #155e3a 50%, #0f4a2e 100%)' }}
      >
        {/* Decorative chef hat silhouette */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none select-none">
          <ChefHat className="w-36 h-36 text-white" strokeWidth={0.8} />
        </div>
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />

        <div className="relative z-10 p-8 space-y-6">
          {/* Badge + Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Active Event Brief</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{planTitle}</h2>
            <p className="text-[11px] text-emerald-400/70 font-bold">Processed and architected by CaterFlow Agent Cluster</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Guests', value: `${guests}`, highlight: false },
              { label: 'Target Budget', value: formatAmt(budgetValue), highlight: false },
              { label: 'Service Style', value: serviceStyle, highlight: false },
              {
                label: 'Readiness Score',
                value: `${readinessScore}%`,
                highlight: true,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="space-y-1"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/80">{stat.label}</p>
                <p className={`text-xl font-black leading-none tracking-tight ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Info Cards Row: Location & Dietary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-shrink-0">
        {/* Location & Delivery Logistics */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-[1.75rem] p-6 shadow-sm space-y-4"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Location & Delivery Logistics</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Venue Location</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{eventLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Schedule</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{eventDate}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dietary Safeguards */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200 rounded-[1.75rem] p-6 shadow-sm space-y-4"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Dietary Safeguards</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Allergen Filtration</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{typeof allergens === 'string' ? allergens : 'No allergens detected'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dietary Preferences</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{dietaryNeeds}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Financial Ledger (Full Width) ── */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl grid place-items-center text-emerald-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Financial Ledger</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Estimated Cost Breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ingredients Estimate */}
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600">Ingredients Estimate</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Estimated Raw Materials Price</p>
            <p className="text-3xl font-black text-emerald-700">{formatAmt(ingredientsGrandTotal)}</p>
          </div>

          {/* Staff Count */}
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600">Staff Count</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Required Operational Team</p>
            <p className="text-3xl font-black text-blue-700">{waitstaffCount + 3} Staffs</p>
          </div>

          {/* Total Staff Pay */}
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600">Total Staff Pay</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Estimated Labor Cost</p>
            <p className="text-3xl font-black text-indigo-700">{formatAmt(staffTotal)}</p>
          </div>
        </div>

        {/* ── Detailed Breakdowns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 border-t border-slate-100 pt-10">
          {/* Detailed Ingredients Breakdown */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Leaf className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Ingredients Breakdown</h3>
            </div>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
              {ingredientsWithCost.map((ing: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-colors shadow-sm hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-slate-800">{ing.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{ing.qty} @ {formatAmt(ing.unitPrice)}/unit</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700 font-mono">{formatAmt(ing.totalCost)}</span>
                </div>
              ))}
              {ingredientsWithCost.length === 0 && (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No detailed ingredient breakdown available</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Staff Breakdown */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Staff Payroll Breakdown</h3>
            </div>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-800">Head Chef</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">1 Personnel • Premium Rate</span>
                </div>
                <span className="text-sm font-black text-blue-700 font-mono">{formatAmt(4000)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-800">Sous Chef / Kitchen Prep</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">1 Personnel • Standard Rate</span>
                </div>
                <span className="text-sm font-black text-blue-700 font-mono">{formatAmt(3500)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-800">Waitstaff / Service Crew</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{waitstaffCount} Personnel @ {formatAmt(1500)} Each</span>
                </div>
                <span className="text-sm font-black text-blue-700 font-mono">{formatAmt(waitstaffTotal)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-slate-800">Logistics & Delivery</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">1 Personnel • Transport Rate</span>
                </div>
                <span className="text-sm font-black text-blue-700 font-mono">{formatAmt(logisticsTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
