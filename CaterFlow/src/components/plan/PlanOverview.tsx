import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, MapPin, DollarSign, ShieldCheck } from 'lucide-react';
import { InfoTile } from '../common/Stats';

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Dashboard Flow</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Brief to executable catering plan</h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
            Review the customer brief first, then inspect menu decisions, operations, and pricing.
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Current View</p>
          <p className="text-sm font-black text-emerald-950 uppercase tracking-tighter">
            {reportView === 'menu' ? 'Menu Strategy' : reportView === 'logistics' ? 'Ops & Logistics' : reportView === 'finance' ? 'Finance' : 'Full Workflow'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <InfoTile icon={<Users className="w-4 h-4" />} label="Servings" value={customerData.guests || eventData.guest_count || '--'} />
        <InfoTile icon={<Calendar className="w-4 h-4" />} label="Date" value={customerData.date || eventData.event_date || '--'} />
        <InfoTile icon={<MapPin className="w-4 h-4" />} label="Location" value={customerData.location || eventData.event_location || '--'} />
        <InfoTile icon={<DollarSign className="w-4 h-4" />} label="Quote" value={pricingData.optimized_quote || '--'} />
        <InfoTile icon={<ShieldCheck className="w-4 h-4" />} label="Readiness" value={monitoringData.execution_readiness ? `${monitoringData.execution_readiness}%` : isProcessing ? 'Planning' : '--'} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-5">
        {['Brief', 'Menu', 'Procurement', 'Logistics', 'Quote'].map((item, index) => {
          const isDone = index <= (monitoringData.execution_readiness ? 4 : steps.length > 5 ? 2 : 1);
          return (
            <div key={item} className={`rounded-xl border px-3 py-2 ${isDone ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-slate-50'}`}>
              {item}
            </div>
          );
        })}
      </div>

      {monitoringData.execution_readiness && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-emerald-600 to-fuchsia-700 text-white shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tighter uppercase font-mono italic mb-6">Smart Catering Plan</h2>
            <div className="grid grid-cols-3 gap-6 py-5 border-y border-white/10">
              <div>
                <span className="text-[8px] uppercase font-bold text-emerald-200/60 block mb-1">ALLOCATED_BUDGET</span>
                <p className="text-xl font-bold font-mono text-emerald-300">{customerData.budget || eventData.budget || '--'}</p>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-emerald-200/60 block mb-1">IDENTIFIED_GUESTS</span>
                <p className="text-xl font-bold font-mono">{customerData.guests || eventData.guest_count || '--'}</p>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-emerald-200/60 block mb-1">PLAN_READINESS</span>
                <p className="text-xl font-bold font-mono text-emerald-300">{monitoringData.execution_readiness}%</p>
              </div>
            </div>
            <p className="mt-6 text-[11px] font-medium font-mono text-emerald-100/80 leading-relaxed bg-black/10 p-3 rounded-xl border-l-2 border-emerald-400">
              {monitoringData.final_summary || 'Synchronizing final data...'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
