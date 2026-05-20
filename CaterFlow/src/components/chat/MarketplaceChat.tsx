import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  MessageCircle, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ChefHat,
  X
} from 'lucide-react';

interface Message {
  senderId: string;
  role: 'customer' | 'admin';
  text: string;
  type: 'text' | 'receipt' | 'quote' | 'chat_history';
  attachment?: any;
  timestamp: Date;
}

export const MarketplaceChat: React.FC<{ 
  eventId: string, 
  shop: any, 
  currentUser: any,
  eventData: any,
  menuItems: any[],
  chatbotHistory?: any[],
  allPlans?: any[],
  onClose?: () => void
}> = ({ eventId, shop, currentUser, eventData, menuItems, chatbotHistory = [], allPlans = [], onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Polling for real-time messages (every 3 seconds)
  useEffect(() => {
    if (!eventId || !currentUser) return;

    const fetchChat = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/chat/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Chat polling failed:", err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [eventId, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (type: 'text' | 'receipt' | 'chat_history' = 'text', customPayload?: any) => {
    if ((!inputText.trim() && type === 'text') || isSending) return;

    setIsSending(true);
    
    // Use customPayload for the specific plan if provided, otherwise fallback to current context
    const planEventData = customPayload?.eventData || eventData;
    const planMenu = customPayload?.menuItems || menuItems;
    const planHistory = customPayload?.chatbotHistory || chatbotHistory;
    
    const payload = {
      eventId, // This is now the unified thread ID
      shopId: shop._id,
      text: type === 'receipt' 
        ? "I've sent an order summary for review." 
        : type === 'chat_history'
        ? "I've shared my AI chatbot intake conversation."
        : inputText,
      type,
      attachment: type === 'receipt' ? {
        menu: planMenu,
        event: planEventData,
        customer: currentUser.displayName || currentUser.email
      } : type === 'chat_history' ? {
        chatHistory: planHistory,
        customer: currentUser.displayName || currentUser.email
      } : null
    };

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setMessages(data.messages);
      setInputText('');

      if (type === 'receipt') {
        const cleanPrice = (val: any) => {
          const text = String(val || "").trim();
          const numeric = text.replace(/[, ]/g, "").match(/\d+(?:\.\d+)?/)?.[0];
          const amount = numeric ? Number(numeric) : 0;
          return Number.isFinite(amount) ? amount : 0;
        };
        const quoteVal = planMenu?.reduce((acc: number, cur: any) => acc + (cleanPrice(cur.price) * (cur.quantity || 1)), 0) || 0;
        
        const planPayload = {
          shopId: shop._id,
          eventId: eventId,
          customerName: currentUser.displayName || currentUser.email || 'Client',
          customerEmail: currentUser.email || 'client@caterflow.com',
          eventType: planEventData?.event_type || planEventData?.eventType || 'Catering Event',
          guests: Number(planEventData?.guest_count || planEventData?.guests || 0),
          budget: String(planEventData?.budget || 'TBD'),
          location: planEventData?.event_location || planEventData?.location || 'TBD',
          date: planEventData?.event_date || planEventData?.date || 'TBD',
          menuSummary: planMenu?.map((item: any) => item.dish) || [],
          quote: `₱${quoteVal.toLocaleString()}`
        };
        await fetch('/api/plans/send', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(planPayload)
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl relative">
      {/* Chat Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{shop.name}</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPlanSelector(true)}
            className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
          >
            <FileText className="w-4 h-4" />
            Send Order Plan
          </button>
          <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100">
            <MoreVertical className="w-5 h-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
              title="Close Chat & Return to Chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            Messages are end-to-end synchronized
          </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] space-y-2`}>
              {msg.type === 'receipt' ? (
                <OrderSummaryCard attachment={msg.attachment} isOwn={msg.senderId === currentUser.uid} />
              ) : msg.type === 'chat_history' ? (
                <ChatHistoryCard attachment={msg.attachment} isOwn={msg.senderId === currentUser.uid} />
              ) : (
                <div className={`px-5 py-3.5 rounded-[1.8rem] shadow-sm text-sm leading-relaxed ${
                  msg.senderId === currentUser.uid 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              )}
              <div className={`flex items-center gap-2 px-2 ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Selector Modal */}
      <AnimatePresence>
        {showPlanSelector && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-8 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[60%]"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Select a Plan to Send</h4>
              <button onClick={() => setShowPlanSelector(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {allPlans.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">No AI plans available.</div>
              ) : (
                allPlans.map(plan => {
                  const title = plan.title || plan.eventData?.event_type || plan.event_type || 'Catering Plan';
                  const dateStr = plan.updatedAt || plan.createdAt ? new Date(plan.updatedAt || plan.createdAt).toLocaleDateString() : '';
                  return (
                    <button
                      key={plan._id}
                      onClick={() => {
                        const customPayload = {
                          eventData: plan.eventData || plan,
                          menuItems: plan.eventData?.menu || plan.menu,
                          chatbotHistory: plan.messages || []
                        };
                        handleSendMessage('receipt', customPayload);
                        setShowPlanSelector(false);
                      }}
                      className="w-full text-left p-3 rounded-2xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 mb-2 last:mb-0"
                    >
                      <p className="text-xs font-black text-slate-800 uppercase truncate">{title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{plan.eventData?.event_date || plan.event_date || 'TBD'} • {dateStr}</p>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Type your message to the admin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all pr-12"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-emerald-400 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderSummaryCard: React.FC<{ attachment: any, isOwn: boolean }> = ({ attachment, isOwn }) => {
  if (!attachment) return null;
  const { menu, event } = attachment;

  const cleanPrice = (val: any) => {
    const text = String(val || "").trim();
    const numeric = text.replace(/[, ]/g, "").match(/\d+(?:\.\d+)?/)?.[0];
    const amount = numeric ? Number(numeric) : 0;
    return Number.isFinite(amount) ? amount : 0;
  };

  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl max-w-sm ${isOwn ? 'ml-auto' : ''}`}>
      <div className="bg-slate-900 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Order Summary</span>
        </div>
        <h4 className="text-xl font-black uppercase tracking-tight">Catering Receipt</h4>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          {menu?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">{item.dish} x{item.quantity || 1}</span>
              <span className="font-mono text-slate-500">₱{(cleanPrice(item.price) * (item.quantity || 1)).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-dashed border-slate-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Date</span>
            <span className="text-xs font-bold text-slate-800">{event?.event_date || 'TBD'}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Guests</span>
            <span className="text-xs font-bold text-slate-800">{event?.guest_count || '0'}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center border border-emerald-100">
            <span className="text-[10px] font-black uppercase text-emerald-700">Estimated Total</span>
            <span className="text-lg font-black text-emerald-700">₱{menu?.reduce((acc: number, cur: any) => acc + (cleanPrice(cur.price) * (cur.quantity || 1)), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatHistoryCard: React.FC<{ attachment: any, isOwn: boolean }> = ({ attachment, isOwn }) => {
  if (!attachment) return null;
  const { chatHistory, customer } = attachment;

  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl max-w-md ${isOwn ? 'ml-auto' : ''}`}>
      <div className="bg-slate-900 p-6 text-white animate-pulse-subtle">
        <div className="flex items-center justify-between mb-2">
          <MessageCircle className="w-5 h-5 text-amber-400 animate-bounce" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Intake Conversation</span>
        </div>
        <h4 className="text-xl font-black uppercase tracking-tight">Chatbot Dialogue Log</h4>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Shared by client: {customer || 'Anonymous'}</p>
      </div>
      <div className="p-6 max-h-[300px] overflow-y-auto custom-scrollbar space-y-4 bg-slate-50">
        {Array.isArray(chatHistory) && chatHistory.map((item: any, i: number) => {
          const isUser = item.role === 'user';
          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">
                {isUser ? 'Client Request' : 'CaterFlow Planner Agent'}
              </span>
              <div className={`px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed max-w-[90%] font-medium ${
                isUser 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {item.content}
              </div>
            </div>
          );
        })}
        {(!chatHistory || chatHistory.length === 0) && (
          <div className="py-8 text-center text-slate-400 italic text-[11px]">
            No raw dialogue available
          </div>
        )}
      </div>
    </div>
  );
};
