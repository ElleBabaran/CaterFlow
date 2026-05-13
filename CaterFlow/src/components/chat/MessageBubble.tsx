import React from 'react';
import { motion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { Message } from '../../types';

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
}


export function MessageBubble({
  msg,
  isEditing,
  editingText,
  onStartEdit,
  onUpdateText,
  onCommitEdit,
  onCancelEdit,
  onWeatherChoice
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
            <span className="whitespace-pre-wrap block leading-relaxed">{msg.content}</span>
            
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
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </motion.div>
  );
}
