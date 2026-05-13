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
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/60 rounded-[3rem] shadow-sm overflow-hidden chat-container-gradient">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md flex-shrink-0 relative z-10">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Concierge Session</h2>
            <p className="text-lg font-black text-slate-900 tracking-tight uppercase mt-0.5">Event Blueprint</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSave} className="p-2.5 rounded-2xl hover:bg-emerald-50 text-emerald-700 transition-all border border-transparent hover:border-emerald-100" title="Save Session">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={onRestart} className="text-[10px] font-black text-white bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-900 uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-slate-900/10">New</button>
            {activeConversationId && (
              <button onClick={onDelete} className="p-2.5 rounded-2xl hover:bg-rose-50 text-rose-700 transition-all border border-transparent hover:border-rose-100" title="Delete Session">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
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
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-900/10"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Verification Phase</p>
                      <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">Blueprint Review</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {SUMMARY_FIELDS.filter((field: any) => field.key !== "special_requests" || eventData[field.key]).map((field: any) => (
                      <div
                        key={field.key}
                        className={`rounded-[1.5rem] border p-4 transition-all ${field.important ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}
                      >
                        <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {field.label}
                        </label>
                        {field.compact ? (
                          <input
                            value={String(eventData[field.key] || "")}
                            onChange={(e) => onUpdateEventField(field.key, e.target.value)}
                            placeholder="Not provided"
                            className="w-full rounded-xl border border-white bg-white/80 px-4 py-2.5 text-[12px] font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                          />
                        ) : (
                          <textarea
                            value={String(eventData[field.key] || "")}
                            onChange={(e) => onUpdateEventField(field.key, e.target.value)}
                            placeholder="Not provided"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-white bg-white/80 px-4 py-2.5 text-[12px] font-semibold leading-5 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button
                      onClick={onConfirmOrder}
                      className="premium-button premium-button-primary"
                    >
                      Confirm & Start Planning
                    </button>
                    <button
                      onClick={onAddMore}
                      className="py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      Update Details
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isProcessing && isChatting && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.1s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analysing Response</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md flex-shrink-0">
          <form onSubmit={onChatSubmit} className="flex flex-col space-y-4">
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
                placeholder={isProcessing ? "Processing..." : "Describe your event needs..."}
                disabled={isProcessing || !isChatting}
                className="w-full p-6 pr-28 bg-slate-50/50 text-slate-800 rounded-[2rem] text-sm leading-relaxed border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 resize-none min-h-[120px] placeholder:text-slate-400 transition-all outline-none"
                required
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onVoiceInput}
                  className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !isChatting}
                  className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-slate-900/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
  );
}
