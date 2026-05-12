import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

export function StaffTaskBoard({ tasks, onToggle }: { tasks: any[], onToggle: (index: number) => void }) {
  if (!tasks || tasks.length === 0) return (
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      Waiting for logistics timeline...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          Operational Task Board
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          {tasks.filter(t => t.completed).length} / {tasks.length} DONE
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div 
            key={i} 
            onClick={() => onToggle(i)}
            className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200'}`}>
              {task.completed && <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-emerald-700 font-mono">{task.time}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Duration: {task.duration}</span>
              </div>
              <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.activity}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
