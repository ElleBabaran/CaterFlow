import React from 'react';
import { motion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  msg: Message;
  isEditing: boolean;
  editingText: string;
  onStartEdit: (msg: Message) => void;
  onUpdateText: (text: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
}

export function MessageBubble({
  msg,
  isEditing,
  editingText,
  onStartEdit,
  onUpdateText,
  onCommitEdit,
  onCancelEdit
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`
        max-w-[88%] px-4 py-3 text-[13px] leading-relaxed relative rounded-3xl shadow-sm
        ${msg.role === 'user' ? 'bg-emerald-700 text-white rounded-br-md' : 
          msg.role === 'system' ? 'bg-amber-50 text-amber-800 w-full text-center border border-amber-100 rounded-2xl text-[11px] font-semibold' :
          'bg-white text-slate-800 border border-slate-100 rounded-bl-md'}
      `}>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editingText}
              onChange={(e) => onUpdateText(e.target.value)}
              className="min-h-20 w-full rounded-2xl border border-emerald-200 bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onCancelEdit} className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
                Cancel
              </button>
              <button type="button" onClick={onCommitEdit} className="rounded-full bg-emerald-700 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                Update
              </button>
            </div>
          </div>
        ) : (
          <>
            {msg.content}
            {msg.role === 'user' && (
              <button
                type="button"
                onClick={() => onStartEdit(msg)}
                className="ml-2 inline-flex align-middle text-white/70 transition hover:text-white"
                title="Edit message"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </>
        )}
        <div className={`text-[9px] mt-2 opacity-45 ${msg.role === 'user' ? 'text-right text-white' : 'text-left text-slate-500'}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </motion.div>
  );
}
