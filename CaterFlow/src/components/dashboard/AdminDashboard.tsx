import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export function AdminDashboard({ inventory, pricing }: { inventory: any[], pricing: any }) {
  if (!inventory || inventory.length === 0) return (
    <div className="p-20 text-center text-slate-600 font-black uppercase tracking-[0.3em] opacity-40">
      Waiting for procurement data...
    </div>
  );

  const chartData = inventory.slice(0, 8).map(ing => ({
    name: ing.item,
    cost: ing.estimated_cost_php || 0
  }));

  const COLORS = ['#f2b84b', '#f59e0b', '#fbbf24', '#d97706', '#b45309', '#92400e'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[var(--app-accent)]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--app-text)] tracking-tight uppercase tracking-widest">
              Owner Cost Controls
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time financial analytics and margin tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-black text-[var(--app-accent)] bg-[var(--app-accent)]/10 px-4 py-1.5 rounded-full border border-[var(--app-accent)]/20 uppercase tracking-widest">ON BUDGET</span>
          <span className="text-[10px] font-black text-slate-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">ADMIN PORTAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          ['Total Procurement Cost', `PHP ${inventory.reduce((acc, curr) => acc + (curr.estimated_cost_php || 0), 0).toLocaleString()}`, 'bg-white/5'],
          ['Projected Margin', pricing?.profit_margin || '32%', 'bg-[var(--app-accent)]/10 border-[var(--app-accent)]/20'],
          ['Unit Cost/Guest', pricing?.unit_cost || '--', 'bg-white/5'],
        ].map(([label, value, extraClass]) => (
          <div key={label} className={`admin-card p-6 shadow-2xl ${extraClass}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{label}</p>
            <p className={`text-3xl font-black ${label.includes('Margin') ? 'text-[var(--app-accent)]' : 'text-[var(--app-text)]'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="admin-card p-8 bg-gradient-to-br from-[var(--card-bg)] to-[#1a2235]">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-3">
          <PieIcon className="w-4 h-4 text-[var(--app-accent)]" />
          Business Analytics Overview
        </h3>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-[var(--app-accent)]/10 rounded-full flex items-center justify-center mb-6 border border-[var(--app-accent)]/20">
            <BarChart3 className="w-10 h-10 text-[var(--app-accent)]" />
          </div>
          <p className="text-lg font-black text-[var(--app-text)] uppercase tracking-widest">Analytics Active</p>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed font-medium uppercase tracking-wider">High-level cost controls and margin tracking are enabled for your catering operations. Detailed reports are being generated.</p>
        </div>
      </div>

    </motion.div>
  );
}
