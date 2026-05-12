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
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      Waiting for procurement data...
    </div>
  );

  const chartData = inventory.slice(0, 8).map(ing => ({
    name: ing.item,
    cost: ing.estimated_cost_php || 0
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Owner Cost Controls
        </h2>
        <div className="flex gap-2">
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">ON BUDGET</span>
          <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">ADMIN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Procurement Cost</p>
          <p className="text-2xl font-black text-slate-900">PHP {inventory.reduce((acc, curr) => acc + (curr.estimated_cost_php || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Projected Margin</p>
          <p className="text-2xl font-black text-emerald-600">{pricing?.profit_margin || '32%'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Unit Cost/Guest</p>
          <p className="text-2xl font-black text-slate-900">{pricing?.unit_cost || '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            Budget-per-Ingredient Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="cost"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Ingredient Price Estimation
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={8} tick={{ fontSize: 8 }} />
                <YAxis fontSize={8} />
                <Tooltip />
                <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
