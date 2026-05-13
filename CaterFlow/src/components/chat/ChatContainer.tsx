import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../types';
import { SUMMARY_FIELDS } from '../../services/questions';

interface ChatContainerProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  isChatting: boolean;
  isListening: boolean;
  showSummary: boolean;
  eventData: any;
  editingMessageId: string | null;
  editingText: string;
  onChatSubmit: (e: React.FormEvent) => void;
  onVoiceInput: () => void;
  onStartEdit: (msg: Message) => void;
  onUpdateEditingText: (text: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onUpdateEventField: (key: string, value: string) => void;
  onConfirmOrder: () => void;
  onAddMore: () => void;
  onSave: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onWeatherChoice?: (choice: boolean) => void;
  activeConversationId: string | null;
}

export function ChatContainer({
  messages,
  input,
  setInput,
  isProcessing,
  isChatting,
  isListening,
  showSummary,
  eventData,
  editingMessageId,
  editingText,
  onChatSubmit,
  onVoiceInput,
  onStartEdit,
  onUpdateEditingText,
  onCommitEdit,
  onCancelEdit,
  onUpdateEventField,
  onConfirmOrder,
  onAddMore,
  onSave,
  onRestart,
  onDelete,
  onWeatherChoice,
  activeConversationId
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isProcessing, showSummary]);

  return (
    <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4 overflow-hidden h-full">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Event Brief</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Guided AI Intake</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSave} className="p-1.5 rounded-full hover:bg-sky-50 text-sky-700 transition-all" title="Save">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRestart} className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">New</button>
            {activeConversationId && (
              <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-rose-50 text-rose-700 transition-all" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fffaf0] custom-scrollbar" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isEditing={editingMessageId === msg.id}
                editingText={editingText}
                onStartEdit={onStartEdit}
                onUpdateText={onUpdateEditingText}
                onCommitEdit={onCommitEdit}
                onCancelEdit={onCancelEdit}
                onWeatherChoice={onWeatherChoice}
              />
            ))}
            
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-[0.12em]">Review Event Details</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SUMMARY_FIELDS.filter((field: any) => field.key !== "special_requests" || eventData[field.key]).map((field: any) => (
                      <div
                        key={field.key}
                        className={`rounded-2xl border p-3 ${field.important ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
                      >
                        <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                          {field.label}
                        </label>
                        {field.compact ? (
                          <input
                            value={String(eventData[field.key] || "")}
                            onChange={(e) => onUpdateEventField(field.key, e.target.value)}
                            placeholder="Not provided"
                            className="w-full rounded-xl border border-white bg-white px-3 py-2 text-[12px] font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          />
                        ) : (
                          <textarea
                            value={String(eventData[field.key] || "")}
                            onChange={(e) => onUpdateEventField(field.key, e.target.value)}
                            placeholder="Not provided"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-white bg-white px-3 py-2 text-[12px] font-semibold leading-5 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={onConfirmOrder}
                      className="py-3 bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg"
                    >
                      Confirm & Plan
                    </button>
                    <button
                      onClick={onAddMore}
                      className="py-3 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Add More
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isProcessing && isChatting && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
          <form onSubmit={onChatSubmit} className="flex flex-col space-y-3">
            <div className="relative flex flex-col group">
              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onChatSubmit(e as any);
                  }
                }}
                placeholder={isProcessing ? "Planning..." : "Type your answer here"}
                disabled={isProcessing || !isChatting}
                className="w-full p-4 pr-24 bg-slate-50 text-slate-800 rounded-3xl text-sm leading-relaxed border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none min-h-[96px] placeholder:text-slate-400 transition-all outline-none"
                required
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onVoiceInput}
                  className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}`}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !isChatting}
                  className="p-2.5 bg-emerald-700 text-white rounded-full hover:bg-emerald-800 disabled:bg-slate-300 transition-all shadow-lg"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
