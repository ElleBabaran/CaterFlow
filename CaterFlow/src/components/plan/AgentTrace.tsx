import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface AgentTraceProps {
  agent: string;
  data: any;
  isExpanded: boolean;
  onToggle: () => void;
  renderAgentReport: (agent: string, data: any) => React.ReactNode;
}

export function AgentTrace({
  agent,
  data,
  isExpanded,
  onToggle,
  renderAgentReport
}: AgentTraceProps) {
  const getStatusColor = (name: string) => {
    if (name.includes('Accountant') || name.includes('Pricing')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
    if (name.includes('Chef') || name.includes('Menu')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (name.includes('Logistics')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (name.includes('Supplier')) return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all group ${isExpanded ? 'ring-2 ring-emerald-500/20 shadow-lg' : 'hover:border-emerald-200 shadow-sm'}`}>
      <div 
        onClick={onToggle}
        className="p-4 flex justify-between items-center cursor-pointer select-none bg-white"
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-emerald-700 transition-colors">
            {agent.replace(' Agent', '')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${getStatusColor(agent)}`}>
            Step Complete
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
             <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
             </svg>
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-5 border-t border-slate-100 bg-slate-50/30">
              {renderAgentReport(agent, data)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
