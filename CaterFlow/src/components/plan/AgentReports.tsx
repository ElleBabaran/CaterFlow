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
  Layers,
  Activity,
  Heart
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

export function MenuReport({ data }: { data: any }) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(data.menu || []).map((item: any, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white border border-slate-200/60 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-600 group-hover:border-emerald-500 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                  <Utensils className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest shadow-sm">
                    {item.portion_per_guest}
                  </span>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">
                {item.dish}
              </h3>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                {item.description || "Expertly crafted dish balanced for flavor and nutrition, designed to impress your guests."}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {(item.tags || ['Gourmet', 'Handcrafted']).map((t: string) => (
                  <span key={t} className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest group-hover:border-emerald-100 group-hover:bg-emerald-50/30 group-hover:text-emerald-600 transition-all">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Master Chef's Strategy</p>
              <h4 className="text-lg font-black text-white uppercase tracking-tight">Culinary Justification</h4>
            </div>
          </div>
          <p className="text-xl font-medium leading-relaxed italic text-slate-300 max-w-4xl border-l-4 border-emerald-500 pl-8 py-2">
            "{data.chef_notes || data.justification || 'This menu has been curated to maximize guest satisfaction while maintaining operational efficiency and cost-effectiveness.'}"
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function DietaryReport({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-rose-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-rose-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-600">Critical Allergens</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(data.allergens_to_avoid || []).length > 0 ? (data.allergens_to_avoid || []).map((a: string) => (
                <span key={a} className="text-xs font-black text-rose-700 bg-rose-50 px-5 py-3 rounded-2xl border border-rose-200 shadow-sm">
                  NO {a.toUpperCase()}
                </span>
              )) : (
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  No allergens identified
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-emerald-100 rounded-[3rem] p-10 shadow-sm lg:col-span-2 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Compliance Protocols</p>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">ISO 22000 Ready</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data.safety_controls || ['Cross-contamination check', 'Temperature monitoring', 'Sanitization logs', 'Allergen labeling']).map((s: string) => (
              <div key={s} className="text-xs font-bold text-slate-700 flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-emerald-50/30 group-hover:border-emerald-100 transition-all">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeatherReport({ data }: { data: any }) {
  const isHighRisk = data.risk_level === 'high';
  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200/60 rounded-[3rem] p-10 shadow-sm overflow-hidden relative group">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-bl-full opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-110 ${isHighRisk ? 'bg-rose-500' : 'bg-sky-500'}`} />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className={`p-10 rounded-[3rem] shadow-2xl ${isHighRisk ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-rose-500/30' : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/30'}`}
          >
            {isHighRisk ? <CloudRain className="w-16 h-16" /> : <Droplets className="w-16 h-16" />}
          </motion.div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{data.summary || 'Optimal Conditions'}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-950 text-white shadow-xl">
                <div className={`w-2.5 h-2.5 rounded-full ${isHighRisk ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Risk: {data.risk_level?.toUpperCase() || 'LOW'}</p>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-100 border border-slate-200">
                <Activity className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Adaptive Planning Engaged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data.recommendations || ['Tent setup advised', 'Outdoor cooling engaged', 'Moisture control', 'Staff hydration focus']).map((r: string, i: number) => (
          <div key={i} className="text-xs font-black text-slate-600 bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm hover:border-sky-300 hover:text-sky-700 transition-all flex items-start gap-3">
            <ChevronRight className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceReport({ data }: { data: any }) {
  // Mock data for chart if not provided
  const chartData = [
    { name: 'Food', value: 45, color: '#10b981' },
    { name: 'Labor', value: 25, color: '#3b82f6' },
    { name: 'Logistics', value: 20, color: '#f59e0b' },
    { name: 'Margin', value: 10, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FinanceCard 
          label="Estimated Quote" 
          value={data.optimized_quote} 
          icon={<DollarSign />}
          color="emerald"
          trend="+4.2%"
        />
        <FinanceCard 
          label="Unit Cost / Guest" 
          value={data.unit_cost} 
          icon={<Users />}
          color="blue"
        />
        <FinanceCard 
          label="Profit Forecast" 
          value={data.profit_margin} 
          icon={<TrendingUp />}
          color="indigo"
          trend="8.5%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200/60 rounded-[3rem] p-10 shadow-sm flex flex-col sm:flex-row items-center gap-10">
          <div className="w-full h-48 sm:w-48 sm:h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Budget Allocation</h4>
            <div className="grid grid-cols-2 gap-4">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-700 uppercase">{item.name}</span>
                  <span className="text-[10px] font-black text-slate-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-10 text-white shadow-2xl group">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Capital Strategy</p>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Market Intelligence</h4>
              </div>
            </div>
            <p className="text-lg font-medium italic text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-8">
              "{data.pricing_strategy || 'Pricing has been optimized for market-competitive margins while maintaining premium ingredient standards.'}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, icon, color, trend }: { label: string, value: any, icon: any, color: string, trend?: string }) {
  const colorStyles: any = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50 shadow-emerald-900/5',
    blue: 'text-blue-600 bg-blue-50 border-blue-100/50 shadow-blue-900/5',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50 shadow-indigo-900/5'
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={`bg-white border rounded-[3rem] p-10 transition-all hover:shadow-2xl ${colorStyles[color]}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border shadow-sm ${colorStyles[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        {trend && (
          <div className="px-3 py-1 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black tracking-widest shadow-lg shadow-emerald-500/20">
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-black tracking-tighter text-slate-950 font-mono">{value || '--'}</p>
    </motion.div>
  );
}

export function LogisticsReport({ data }: { data: any }) {
  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="absolute left-[39px] top-8 bottom-8 w-1 bg-slate-100 hidden md:block" />
        <div className="grid grid-cols-1 gap-6">
          {(data.timeline || []).map((t: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-8 items-center group relative"
            >
              <div className="flex-shrink-0 w-20 h-20 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center shadow-sm group-hover:border-emerald-500 group-hover:shadow-xl group-hover:shadow-emerald-900/5 transition-all duration-500 z-10">
                <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest">Time</span>
                <span className="text-sm font-black text-slate-900">{t.time}</span>
              </div>
              <div className="flex-1 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group-hover:border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-700 transition-colors">{t.activity}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operational Task Pending</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                  <Clock className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OpsCard 
          title="Staffing Matrix" 
          content={data.staffing_needs} 
          icon={<Users className="w-6 h-6" />}
          color="amber"
        />
        <OpsCard 
          title="Dispatch Vector" 
          content={data.transport_plan} 
          icon={<Truck className="w-6 h-6" />}
          color="rose"
        />
      </div>
    </div>
  );
}

function OpsCard({ title, content, icon, color }: { title: string, content: string, icon: any, color: string }) {
  const styles: any = {
    amber: 'bg-amber-50 border-amber-100 text-amber-700 shadow-amber-900/5',
    rose: 'bg-rose-50 border-rose-100 text-rose-700 shadow-rose-900/5'
  };

  return (
    <div className={`${styles[color]} border rounded-[3rem] p-10 shadow-sm group hover:shadow-2xl transition-all duration-700`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-inherit">
          {icon}
        </div>
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-base text-slate-800 font-bold leading-relaxed">{content}</p>
    </div>
  );
}

export function ConciergeReport({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <InfoItem label="Event Type" value={data.event_type} icon={<Layers />} />
        <InfoItem label="Servings" value={data.guests} icon={<Users />} />
        <InfoItem label="Budget" value={data.budget} icon={<DollarSign />} />
        <InfoItem label="Venue" value={data.location} icon={<MapPin />} />
        <InfoItem label="Cuisine" value={data.cuisine_preference} icon={<Utensils />} />
        <InfoItem label="Style" value={data.service_style} icon={<ShieldCheck />} />
      </div>
      
      {data.cultural_profile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-500 p-10 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                <Heart className="w-6 h-6 text-rose-300 fill-rose-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-200">Cultural Alignment Matrix</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-white mb-4">
              {data.cultural_profile.language?.toUpperCase()} Input Profile Detected
            </p>
            <p className="text-lg font-medium leading-relaxed text-sky-50 max-w-4xl italic">
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
      whileHover={{ y: -5 }}
      className="bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 truncate block uppercase tracking-tight">{value || '--'}</span>
    </motion.div>
  );
}


