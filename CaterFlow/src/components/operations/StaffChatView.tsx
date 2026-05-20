import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, Loader2, User, Truck, ChefHat } from 'lucide-react';

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isStaff?: boolean;
}

interface StaffChatViewProps {
  assignedOrder: any;
  currentUser: any;
}

export function StaffChatView({ assignedOrder, currentUser }: StaffChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const eventId = assignedOrder?._id || assignedOrder?.eventId || '';

  const loadChat = async () => {
    if (!eventId || !currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/chat/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: ChatMessage[] = (data.messages || []).map((m: any) => ({
          senderId: m.senderId,
          senderName: m.senderName || (m.senderId === currentUser.uid ? currentUser.displayName || 'Staff' : 'Customer / Admin'),
          text: m.text || '',
          timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
          isStaff: m.senderId === currentUser.uid,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to load staff chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !eventId || !currentUser) return;
    setSending(true);
    try {
      const token = await currentUser.getIdToken();
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId,
          text: newMsg.trim(),
          senderName: currentUser.displayName || 'Staff Member',
        }),
      });
      setMessages(prev => [
        ...prev,
        {
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Staff Member',
          text: newMsg.trim(),
          timestamp: new Date().toISOString(),
          isStaff: true,
        },
      ]);
      setNewMsg('');
    } catch {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!assignedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8"
      >
        <div className="w-20 h-20 bg-amber-50 rounded-[1.8rem] flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
          <MessageCircle className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">No Order Assigned</h2>
        <p className="text-xs font-medium text-slate-500 mt-2 max-w-xs leading-relaxed">
          You need an assigned order to access the chat. Check your Duty Roster first.
        </p>
      </motion.div>
    );
  }

  const eventInfo = assignedOrder?.eventData || assignedOrder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto"
    >
      {/* Order info header */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 mb-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 flex-shrink-0">
          <Truck className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-800 uppercase tracking-widest truncate">
            {eventInfo?.event_type || 'Catering Order'}
          </p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {eventInfo?.event_location || 'Location TBD'} · {eventInfo?.guest_count || '--'} guests · {eventInfo?.event_date || '--'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Chat box */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-amber-50/50 to-transparent">
          <MessageCircle className="w-4 h-4 text-amber-500" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Order Chat</p>
            <p className="text-[9px] text-slate-400 font-medium">Messages with customer & admin</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No messages yet</p>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">Start the conversation with the customer or admin</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isStaff ? 'justify-end' : 'justify-start'}`}>
                {!msg.isStaff && (
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mr-2 self-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.isStaff
                      ? 'bg-amber-500 text-white font-bold rounded-br-md shadow-amber-900/10'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-md'
                  }`}
                >
                  {!msg.isStaff && (
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{msg.senderName}</p>
                  )}
                  <p>{msg.text}</p>
                  <p className={`text-[8px] mt-1.5 opacity-60 font-bold uppercase tracking-widest ${msg.isStaff ? 'text-white' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.isStaff && (
                  <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 ml-2 self-end">
                    <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Message customer or admin..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMsg.trim() || sending}
              className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-900/15 hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
