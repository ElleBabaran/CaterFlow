import React from 'react';
import { motion } from 'motion/react';
import { 
  CloudRain, 
  Droplets, 
  Utensils, 
  AlertTriangle, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Info, 
  DollarSign, 
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronRight,
  Calendar,
  MapPin,
  Layers,
  Activity,
  Heart,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';


export function ReportSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card h-64" />
        ))}
      </div>
      <div className="h-40 skeleton rounded-[3rem]" />
    </div>
  );
}

export function MenuReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;
  
  const menuItems = Array.isArray(data?.menu) ? data.menu : [];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {menuItems.map((item: any, i: number) => (
          <motion.div 
            key={item.id || i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card group"
          >
            <div className="absolute top-0 right-0 p-6">
              <div className="premium-tag group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-500">
                {item.category || "Main Course"}
              </div>
            </div>

            <div className="mb-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:rotate-6 transition-all duration-500 shadow-sm mb-6">
                <Utensils className="w-8 h-8 text-slate-300 group-hover:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">
                {item.dish}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {item.portion_per_guest ? `${item.portion_per_guest} portion` : "Standard Serving"}
              </p>
            </div>

            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium line-clamp-3">
              {item.description || "Gourmet preparation crafted with fresh, seasonal ingredients to provide an exceptional culinary experience."}
            </p>

            <div className="space-y-6">
              {item.ingredients?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.slice(0, 4).map((ing: string) => (
                    <span key={ing} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      {ing}
                    </span>
                  ))}
                  {item.ingredients.length > 4 && (
                    <span className="text-[9px] font-bold text-slate-400 px-2 py-1.5">+ {item.ingredients.length - 4} more</span>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Info className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chef's Reasoning</p>
                    <p className="text-xs font-bold text-slate-700 line-clamp-2">{item.reasoning || "Selected for optimal flavor balance and thematic alignment."}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {data?.justification && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-gradient-bg p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-8">
              <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">AI Culinary Intelligence</p>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Menu Blueprint Strategy</h4>
              </div>
            </div>
            <p className="text-2xl font-medium leading-relaxed italic text-slate-200 border-l-4 border-emerald-500/50 pl-10 py-2">
              "{data.justification}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function DietaryReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="premium-card border-rose-100 group">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-rose-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Critical Safety</p>
              <h3 className="text-xl font-black text-rose-700 uppercase tracking-tight">Allergen Matrix</h3>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {Array.isArray(data?.allergens_to_avoid) && data.allergens_to_avoid.length > 0 ? (
              data.allergens_to_avoid.map((a: string) => (
                <span key={a} className="text-xs font-black text-rose-700 bg-rose-100/50 px-6 py-4 rounded-2xl border border-rose-200 shadow-sm uppercase tracking-widest">
                  NO {a}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 w-full">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No critical allergens identified in user brief</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="premium-card border-emerald-100 group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Protocol</p>
              <h3 className="text-xl font-black text-emerald-700 uppercase tracking-tight">Health Compliance</h3>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {Array.isArray(data?.safety_controls) && data.safety_controls.length > 0 ? (
            data.safety_controls.map((s: string) => (
              <div key={s} className="text-xs font-bold text-slate-700 flex items-center gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                {s}
              </div>
            ))
          ) : (
            <div className="text-xs font-bold text-slate-400 italic">No specific safety protocols provided by AI.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WeatherReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;
  
  const isHighRisk = data?.risk_level === 'high' || data?.risk_level === 'critical';
  
  return (
    <div className="space-y-8">
      <div className="premium-card group overflow-hidden">
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-bl-full opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-110 ${isHighRisk ? 'bg-rose-500' : 'bg-sky-500'}`} />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className={`p-12 rounded-[3.5rem] shadow-2xl ${isHighRisk ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-rose-500/30' : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/30'}`}
          >
            {isHighRisk ? <CloudRain className="w-20 h-20" /> : <Droplets className="w-20 h-20" />}
          </motion.div>
          
          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${isHighRisk ? 'text-rose-600' : 'text-sky-600'}`}>Forecast Analytics</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{data?.summary || 'Stable Conditions'}</h3>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-950 text-white shadow-xl">
                <div className={`w-2.5 h-2.5 rounded-full ${isHighRisk ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Environmental Risk: {data?.risk_level?.toUpperCase() || 'NORMAL'}</p>
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100 border border-slate-200">
                <Activity className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-bold">Dynamic Mitigation Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(data?.recommendations) && data.recommendations.map((r: string, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card !p-8 flex items-start gap-5 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 transition-all duration-500">
              <ChevronRight className="w-5 h-5 text-sky-500 group-hover:text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed pt-1">{r}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FinanceReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;

  // Try to parse values, or use reasonable defaults based on quote if missing.
  const baseQuoteStr = String(data?.optimized_quote || data?.total_estimate || "₱ 0").replace(/[^0-9.]/g, "");
  const baseQuote = parseFloat(baseQuoteStr) || 15000;
  
  // Ingredients usually ~40% of quote
  const estIngredients = baseQuote * 0.40;
  // Staff usually ~20% of quote, 1 staff per 25 guests or fallback
  const estStaffCost = baseQuote * 0.20;
  const staffCount = Math.max(3, Math.round(baseQuote / 5000));
  
  const formatAmt = (val: number) => `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FinanceCard 
          label="Estimated Ingredients Price" 
          value={formatAmt(estIngredients)} 
          icon={<DollarSign />}
          color="emerald"
          trend="Market Rate"
        />
        <FinanceCard 
          label="Staff Count" 
          value={`${staffCount} Staffs`} 
          icon={<Users />}
          color="blue"
        />
        <FinanceCard 
          label="Total Staff Pay" 
          value={formatAmt(estStaffCost)} 
          icon={<TrendingUp />}
          color="indigo"
        />
      </div>

      <div className="premium-gradient-bg p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Cost Breakdown</p>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Ingredient & Staffing Estimates</h4>
            </div>
          </div>
          <p className="text-xl font-medium italic text-slate-200 leading-relaxed border-l-4 border-emerald-500/30 pl-10">
            "Based on the initial culinary requirements, the estimated raw material (ingredients) price is projected at {formatAmt(estIngredients)}. We estimate needing {staffCount} staff members to seamlessly execute the service, totaling {formatAmt(estStaffCost)} in labor costs."
          </p>
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, icon, color, trend }: { label: string, value: any, icon: any, color: string, trend?: string }) {
  const colorStyles: any = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
    blue: 'text-blue-600 bg-blue-50 border-blue-100/50',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="premium-card group"
    >
      <div className="flex items-center justify-between mb-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-500 group-hover:bg-slate-900 ${colorStyles[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: `w-8 h-8 group-hover:text-emerald-400 transition-colors` })}
        </div>
        {trend && (
          <div className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <p className="text-4xl font-black tracking-tighter text-slate-900 font-mono">{value || '--'}</p>
    </motion.div>
  );
}

export function LogisticsReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-12">
      <div className="relative pl-12 md:pl-20">
        <div className="absolute left-[24px] md:left-[40px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />
        <div className="space-y-10">
          {Array.isArray(data?.timeline) && data.timeline.length > 0 ? (
            data.timeline.map((t: any, i: number) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col md:flex-row gap-6 md:items-center group relative"
              >
                <div className="absolute left-[-32px] md:left-[-52px] top-6 md:top-auto w-6 h-6 bg-white border-4 border-slate-900 rounded-full z-10 transition-transform duration-500 group-hover:scale-125" />
                
                <div className="flex-shrink-0 w-24 h-24 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center shadow-sm group-hover:border-slate-900 transition-all duration-500 z-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase</span>
                  <span className="text-lg font-black text-slate-900">{t.time}</span>
                </div>
                
                <div className="flex-1 premium-card !p-8 group-hover:border-emerald-200 transition-all flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">{t.activity}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">High Priority Task</p>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 transition-all duration-500">
                    <Clock className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center premium-card">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Operational timeline being synchronized...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OpsCard 
          title="Staffing Requirements" 
          content={data?.staffing_needs} 
          icon={<Users className="w-6 h-6" />}
          color="amber"
        />
        <OpsCard 
          title="Transport & Distribution" 
          content={data?.transport_plan} 
          icon={<Truck className="w-6 h-6" />}
          color="rose"
        />
      </div>
    </div>
  );
}

function OpsCard({ title, content, icon, color }: { title: string, content: string, icon: any, color: string }) {
  const styles: any = {
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700'
  };

  return (
    <div className={`premium-card ${styles[color]} group hover:shadow-2xl transition-all duration-700`}>
      <div className="flex items-center gap-5 mb-8">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-inherit transition-all duration-500 group-hover:bg-slate-900 group-hover:text-white">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Logistics Segment</p>
          <h4 className="text-xl font-black uppercase tracking-tight">{title}</h4>
        </div>
      </div>
      <p className="text-lg text-slate-800 font-medium leading-relaxed">
        {content || "Analyzing requirement vectors based on event scale and venue constraints..."}
      </p>
    </div>
  );
}

export function ConciergeReport({ data, isLoading }: { data: any, isLoading?: boolean }) {
  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <InfoItem label="Event Type" value={data?.event_type} icon={<Layers />} />
        <InfoItem label="Guest List" value={data?.guests} icon={<Users />} />
        <InfoItem label="Budget Cap" value={data?.budget} icon={<DollarSign />} />
        <InfoItem label="Venue Spec" value={data?.location} icon={<MapPin />} />
        <InfoItem label="Cuisine Profile" value={data?.cuisine_preference} icon={<Utensils />} />
        <InfoItem label="Service Mode" value={data?.service_style || "Standard"} icon={<ShieldCheck />} />
      </div>
      
      {data?.cultural_profile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-gradient-bg p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400">Contextual Adaptation</p>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Cultural Alignment Matrix</h4>
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter text-white mb-6 uppercase">
              {data.cultural_profile.language} Linguistic Core Detected
            </p>
            <p className="text-2xl font-medium leading-relaxed text-sky-50 max-w-5xl italic border-l-4 border-white/20 pl-10 py-2">
              "{data.cultural_profile.adaptation}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: any, icon: any }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="premium-card !p-8 group"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-slate-900 group-hover:text-emerald-400 transition-all duration-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-600 transition-colors">{label}</span>
      </div>
      <span className="text-base font-black text-slate-900 truncate block uppercase tracking-tight">{value || '--'}</span>
    </motion.div>
  );
}

