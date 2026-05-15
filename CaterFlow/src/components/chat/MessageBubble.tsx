import React from 'react';
import { motion } from 'motion/react';
import { Pencil, ArrowRight } from 'lucide-react';
import { Message } from '../../types';
import { WeatherForecastCard } from './WeatherForecastCard';

interface MessageBubbleProps {
  key?: React.Key;
  msg: Message;
  isEditing: boolean;
  editingText: string;
  onStartEdit: (msg: Message) => void;
  onUpdateText: (text: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onWeatherChoice?: (choice: boolean) => void;
  onActionChoice?: (choice: string) => void;
}


export function MessageBubble({
  msg,
  isEditing,
  editingText,
  onStartEdit,
  onUpdateText,
  onCommitEdit,
  onCancelEdit,
  onWeatherChoice,
  onActionChoice
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`
        ${msg.role === 'user' ? 'chat-bubble-user' : 
          msg.role === 'system' ? 'bg-amber-50/80 text-amber-900 w-full text-center border border-amber-200/50 rounded-2xl py-3 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm' :
          msg.isWeatherForecast ? 'bg-blue-50/20 border border-blue-100/50 rounded-[2.5rem] p-1.5 shadow-sm overflow-hidden' :
          'chat-bubble-ai'}
      `}>
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              autoFocus
              value={editingText}
              onChange={(e) => onUpdateText(e.target.value)}
              className="min-h-24 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancelEdit} className="px-5 py-2 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button type="button" onClick={onCommitEdit} className="px-5 py-2 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-all shadow-lg">
                Update
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            {msg.isWeatherForecast ? (
              <div className="font-outfit py-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-emerald-600 mb-4 border-b border-emerald-100/50 pb-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  WEATHER INTELLIGENCE
                </div>
                <div className="text-slate-800 space-y-3">
                  <span className="whitespace-pre-wrap block leading-relaxed text-[13px] font-medium text-blue-950/90 selection:bg-blue-100">
                    {msg.content}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                  <span>Verified Forecast Data</span>
                  <span className="text-blue-500/60">Atmospheric Analysis</span>
                </div>
              </div>
            ) : (
              <span className="whitespace-pre-wrap block leading-relaxed">{msg.content}</span>
            )}
            
            {msg.isWeatherChoice && (
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => onWeatherChoice?.(true)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Analyze Forecast
                </button>
                <button 
                  onClick={() => onWeatherChoice?.(false)}
                  className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Skip
                </button>
              </div>
            )}

            {msg.isMenuCompositionChoice && (
              <div className="mt-6 flex flex-col gap-3">
                {[
                  ["System decide best mix to maximize my budget", "🤖 Auto-plan (Maximize my budget)"],
                  ["1-2 main dishes only, keep it simple for my budget", "🍱 Keep it simple (1-2 dishes only)"],
                  ["System decide mains only, no desserts and no drinks", "🥩 Mains Only (No Desserts / Drinks)"],
                  ["CUSTOM_INPUT", "✍️ I'll type my custom counts"]
                ].map(([choice, label]) => (
                  <button 
                    key={choice}
                    onClick={() => onActionChoice?.(choice)}
                    className="w-full px-6 py-4 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100 transition-all flex justify-between items-center group/btn"
                  >
                    <span>{label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                  </button>
                ))}
              </div>
            )}

            {(msg.isFoodChoiceMode || msg.isPortionControlMode) && (
              <div className="mt-6 flex flex-col gap-3">
                {msg.isFoodChoiceMode ? (
                  <>
                    <button onClick={() => onActionChoice?.("Suggest for me")} className="premium-button premium-button-primary">🤖 Suggest for me</button>
                    <button onClick={() => onActionChoice?.("I have specific food")} className="premium-button premium-button-secondary">📝 I have specific food</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onActionChoice?.("System automatically calculate")} className="premium-button premium-button-primary">🤖 Auto-calculate portions</button>
                    <button onClick={() => onActionChoice?.("I will specify portions")} className="premium-button premium-button-secondary">⚖️ I will specify portions</button>
                  </>
                )}
              </div>
            )}

            {msg.role === 'user' && (
              <button
                type="button"
                onClick={() => onStartEdit(msg)}
                className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
                title="Edit message"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        
        <div className={`text-[9px] mt-3 font-bold uppercase tracking-widest opacity-30 ${msg.role === 'user' ? 'text-right text-white' : 'text-left text-slate-500'}`}>
          {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </motion.div>
  );
}
