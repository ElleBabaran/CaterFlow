import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox, Users, ChefHat, MapPin, Calendar, DollarSign, Send, X, MessageCircle } from 'lucide-react';

interface ReceivedPlan {
  _id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerUid: string;
  eventType: string;
  guests: number;
  budget: string;
  location: string;
  date: string;
  menuSummary: string[];
  quote: string;
  sentAt: string;
  status: 'new' | 'viewed' | 'accepted' | 'declined' | 'delivery_approved';
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

export function AdminInbox({
  plans,
  adminUid,
  adminName,
  onSendMessage,
  onUpdateStatus,
}: {
  plans: ReceivedPlan[];
  adminUid: string;
  adminName: string;
  onSendMessage: (planId: string, text: string) => Promise<void>;
  onUpdateStatus: (planId: string, status: ReceivedPlan['status'], extraFields?: any) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<ReceivedPlan | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const handleSelect = (plan: ReceivedPlan) => {
    setSelectedPlan(plan);
    setDeliveryLocation(plan.location || '');
    if (plan.status === 'new') onUpdateStatus(plan._id, 'viewed');
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedPlan) return;
    setSending(true);
    try {
      await onSendMessage(selectedPlan._id, newMsg.trim());
      const msg: ChatMessage = {
        senderId: adminUid,
        senderName: adminName,
        text: newMsg.trim(),
        timestamp: new Date().toISOString(),
        isAdmin: true,
      };
      setMessages(prev => ({ ...prev, [selectedPlan._id]: [...(prev[selectedPlan._id] || []), msg] }));
      setNewMsg('');
    } finally {
      setSending(false);
    }
  };

  const statusColor = (s: ReceivedPlan['status']) => ({
    new: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    viewed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    declined: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    delivery_approved: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  }[s]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex overflow-hidden admin-card">
      {/* Sidebar — plan list */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--border-color)] flex flex-col bg-[var(--header-bg)]">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
            <Inbox className="w-4.5 h-4.5 text-[var(--accent-color)]" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-color)]">Inbox</h2>
            <p className="text-[9px] text-slate-500">{plans.length} plan{plans.length !== 1 ? 's' : ''} received</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Inbox className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No plans yet</p>
              <p className="text-[9px] text-slate-600 mt-1">Customers will send their event plans here</p>
            </div>
          ) : (
            plans.map(plan => (
              <button
                key={plan._id}
                onClick={() => handleSelect(plan)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${selectedPlan?._id === plan._id ? 'bg-[var(--accent-color)]/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-black text-[var(--text-color)] truncate">{plan.customerName}</p>
                  <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{plan.eventType} · {plan.guests} guests</p>
                <p className="text-[9px] text-slate-500 mt-1">{new Date(plan.sentAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main — plan detail + chat */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-color)]">
        <AnimatePresence mode="wait">
          {!selectedPlan ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-12 h-12 text-slate-800 mb-3" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-600">Select a plan</p>
              <p className="text-xs text-slate-700 mt-1">Choose a customer plan from the left to view details and chat</p>
            </motion.div>
          ) : (
            <motion.div key={selectedPlan._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col overflow-hidden">
              {/* Plan detail header */}
              <div className="p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-[var(--text-color)]">{selectedPlan.customerName}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{selectedPlan.customerEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(selectedPlan._id, 'accepted')}
                      className="admin-button-primary"
                    >Accept</button>
                    <button
                      onClick={() => onUpdateStatus(selectedPlan._id, 'declined')}
                      className="admin-button-secondary border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >Decline</button>
                  </div>
                </div>

                {selectedPlan.status === 'accepted' && (
                  <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-4 space-y-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Logistics & Delivery Approval</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Verify order completion and provide the final delivery location to dispatch the driver.</p>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Delivery Address/Coordinates</label>
                        <input 
                          type="text" 
                          value={deliveryLocation} 
                          onChange={e => setDeliveryLocation(e.target.value)} 
                          className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-color)] outline-none focus:border-purple-500 transition-colors"
                          placeholder="e.g. 14.5995, 120.9842 or 123 Main St"
                        />
                      </div>
                      <button 
                        onClick={() => onUpdateStatus(selectedPlan._id, 'delivery_approved', { deliveryLocation })}
                        className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-purple-900/20"
                      >
                        Approve Delivery
                      </button>
                    </div>
                  </div>
                )}
                {selectedPlan.status === 'delivery_approved' && (
                  <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Delivery Dispatched</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Staff has been authorized to deliver this order.</p>
                    </div>
                    <MapPin className="w-6 h-6 text-emerald-500" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    [Calendar, 'Date', selectedPlan.date],
                    [MapPin, 'Location', selectedPlan.location],
                    [Users, 'Guests', selectedPlan.guests],
                    [DollarSign, 'Budget', selectedPlan.budget],
                  ].map(([Icon, label, value]: any) => (
                    <div key={label} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[var(--accent-color)]" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                      </div>
                      <p className="text-xs font-black text-[var(--text-color)]">{value}</p>
                    </div>
                  ))}
                </div>

                {selectedPlan.menuSummary?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" /> Menu Items
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.menuSummary.map(dish => (
                        <span key={dish} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[9px] font-bold text-[var(--text-color)]">{dish}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--bg-color)]">
                <div className="flex justify-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 bg-white/5 px-4 py-1 rounded-full border border-white/5">Secured Conversation</span>
                </div>
                {(messages[selectedPlan._id] || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-lg ${
                      msg.isAdmin ? 'bg-[var(--accent-color)] text-[#0c111d] font-bold rounded-br-md shadow-[var(--accent-color)]/5' : 'bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded-bl-md'
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[8px] mt-2 opacity-60 font-black uppercase tracking-widest ${msg.isAdmin ? 'text-[#0c111d]' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {(messages[selectedPlan._id] || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <MessageCircle className="w-8 h-8 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type your message to the customer…"
                    className="flex-1 admin-input"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim() || sending}
                    className="admin-button-primary w-14 flex items-center justify-center p-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
