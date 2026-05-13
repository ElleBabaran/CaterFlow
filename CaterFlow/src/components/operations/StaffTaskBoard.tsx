import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react';

interface StaffTask {
  text: string;
  completed: boolean;
}

export function StaffTaskBoard({ tasks, onToggle }: { tasks: StaffTask[], onToggle: (index: number) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
          <ListTodo className="w-6 h-6 text-[var(--accent-color)]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Duty Roster</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kitchen & Service task synchronization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="staff-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent-color)]" />
              Active Assignments
            </h3>
            <span className="text-[10px] font-black text-[var(--accent-color)] bg-[var(--accent-color)]/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {tasks.filter(t => !t.completed).length} Pending
            </span>
          </div>
          
          <div className="space-y-3">
            {tasks.map((task, idx) => (
              <button
                key={idx}
                onClick={() => onToggle(idx)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                  task.completed 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-[var(--border-color)] hover:border-[var(--accent-color)]/30 hover:shadow-md'
                }`}
              >
                <div className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-[var(--accent-color)]'}`}>
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {task.text}
                </span>
              </button>
            ))}
            {tasks.length === 0 && (
              <div className="py-12 text-center text-slate-300 italic text-xs uppercase tracking-widest">
                No tasks assigned for this shift
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="staff-card p-6 bg-gradient-to-br from-white to-[#fff9f8] border-[var(--accent-color)]/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Shift Briefing</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Maintain standard food safety protocols. All prep must be finalized 2 hours before event start. Coordinate with the delivery team for weighted procurement handoff.
            </p>
          </div>
          <div className="staff-card p-6 bg-[var(--accent-color)] text-white shadow-xl shadow-[var(--accent-color)]/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Urgent Notification</h3>
            <p className="text-lg font-black leading-tight uppercase tracking-tight italic">
              "Customer requested extra napkins and chili oil for the Lechon portion."
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
