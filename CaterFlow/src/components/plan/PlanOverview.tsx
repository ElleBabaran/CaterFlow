import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, MapPin, DollarSign, ShieldCheck, Zap, Activity, ChevronRight } from 'lucide-react';

interface PlanOverviewProps {
  steps: any[];
  currentStepIndex: number;
  isProcessing: boolean;
  customerData: any;
  eventData: any;
  pricingData: any;
  monitoringData: any;
  reportView: string;
}


export function PlanOverview({
  steps,
  currentStepIndex,
  isProcessing,
  customerData,
  eventData,
  pricingData,
  monitoringData,
  reportView
}: PlanOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 rounded-[3.5rem] border border-slate-200/60 bg-white shadow-2xl overflow-hidden"
    >
      <div className="p-10 lg:p-12 relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-60" />
        
        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 shadow-xl shadow-slate-900/20">
              <Zap className="h-3.5 w-3.5 fill-emerald-400" />
              Live AI Orchestration
            </div>
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-slate-900 lg:text-6xl uppercase">
                Event Blueprint
              </h2>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-500 mt-2">
                A high-fidelity strategy synthesized by <span className="text-slate-900 font-black">11 specialized agents</span> using real-time culinary intelligence.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-3 pl-8 shadow-inner">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Current Vector</p>
              <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {reportView === 'menu' ? 'Culinary Concept' : reportView === 'logistics' ? 'Operational Ops' : reportView === 'finance' ? 'Budget Matrix' : 'Full Spectrum'}
              </p>
            </div>
            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/20">
              <Activity className="h-7 w-7 text-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-5">
          <StatCard icon={<Users />} label="Guest Profile" value={customerData.guests || eventData.guest_count || '--'} color="emerald" />
          <StatCard icon={<Calendar />} label="Timeline" value={customerData.date || eventData.event_date || '--'} color="blue" />
          <StatCard icon={<MapPin />} label="Venue Vector" value={customerData.location || eventData.event_location || '--'} color="amber" />
          <StatCard icon={<DollarSign />} label="Quote Estimate" value={pricingData.optimized_quote || '--'} color="rose" />
          <StatCard icon={<ShieldCheck />} label="Readiness" value={monitoringData.execution_readiness ? `${monitoringData.execution_readiness}%` : isProcessing ? 'Syncing...' : '--'} color="indigo" />
        </div>

        <div className="mt-12 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Agent Pipeline Flow</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {['Brief', 'Menu', 'Supply', 'Ops', 'Ledger'].map((item, index) => {
            const isDone = index <= (monitoringData.execution_readiness ? 4 : steps.length > 5 ? 2 : 1);
            return (
              <motion.div 
                key={item}
                whileHover={{ y: -5 }}
                className={`relative flex items-center justify-between rounded-2xl border px-6 py-5 transition-all duration-500 ${
                  isDone 
                  ? 'border-emerald-200 bg-emerald-50/30 text-emerald-900 shadow-lg shadow-emerald-900/5' 
                  : 'border-slate-100 bg-slate-50/50 text-slate-300'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item}</span>
                {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {monitoringData.execution_readiness && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="m-10 mt-0 p-12 rounded-[3.5rem] premium-gradient-bg text-white shadow-2xl relative overflow-hidden group"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center not-italic shadow-xl backdrop-blur-md">
                  <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                </div>
                Optimized Strategy
              </h2>
              <div className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em]">
                System Output Verified
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-10 border-y border-white/10">
              <SummaryItem label="BUDGET_CAP" value={customerData.budget || eventData.budget || '--'} highlight />
              <SummaryItem label="TOTAL_GUESTS" value={customerData.guests || eventData.guest_count || '--'} />
              <SummaryItem label="SYSTEM_SCORE" value={`${monitoringData.execution_readiness}%`} highlight />
            </div>

            <div className="mt-10 flex flex-col xl:flex-row xl:items-center gap-8">
              <div className="flex-1 p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                <p className="text-lg font-medium text-slate-100 leading-relaxed italic border-l-4 border-emerald-500/50 pl-8">
                  "{monitoringData.final_summary || 'Synchronizing final data from specialist agents...'}"
                </p>
              </div>
              <button className="premium-button premium-button-primary xl:w-auto px-12 group !bg-white !text-slate-900 hover:!bg-emerald-50">
                Generate Proposal
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorStyles: any = {
    emerald: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50',
    blue: 'text-blue-600 bg-blue-50/50 border-blue-100/50',
    amber: 'text-amber-600 bg-amber-50/50 border-amber-100/50',
    rose: 'text-rose-600 bg-rose-50/50 border-rose-100/50',
    indigo: 'text-indigo-600 bg-indigo-50/50 border-indigo-100/50'
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`rounded-[2.5rem] border p-8 transition-all hover:shadow-2xl hover:shadow-slate-200/50 bg-white group ${colorStyles[color]}`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-white shadow-sm border-inherit border group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight truncate uppercase">{value}</p>
    </motion.div>
  );
}

function SummaryItem({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] block">{label}</span>
      <p className={`text-4xl font-black tracking-tighter uppercase ${highlight ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

