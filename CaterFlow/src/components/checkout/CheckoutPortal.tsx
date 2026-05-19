import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChefHat, ClipboardList, Send } from 'lucide-react';
import { parseBudgetDetails } from '../../services/budget';
import { PostFinalizationView } from '../plan/PostFinalizationView';

export function CheckoutPortal({ eventId, shop, event, blueprint, status, localMenu = [], onAccept, onFinalize, onChatWithShop }: { eventId: string, shop: any, event: any, blueprint: any[], status: string, localMenu?: any[], onAccept: () => void, onFinalize: () => void, onChatWithShop?: (shop: any) => void }) {
  const [msg, setMsg] = useState('');
  const [localMsgs, setLocalMsgs] = useState<any[]>([
    { role: 'admin', text: "Hello! We've received your catering blueprint. The menu looks great. Would you like to proceed with this quote?", time: 'Just now' }
  ]);

  const activeMenu = localMenu && localMenu.length > 0 
    ? localMenu 
    : (blueprint.find((s: any) => s.agent.includes('Head Chef'))?.data.menu || []);

  const guests = Number(event.guest_count || event.guests || 100);
  const totalPerGuest = activeMenu.reduce((sum: number, item: any) => sum + parseBudgetDetails(item.price).value, 0);
  const estimatedTotal = totalPerGuest * guests;

  const parsed = parseBudgetDetails(event.budget || "");
  const currency = parsed.currency || "PHP";
  const formatAmt = (n: number) => {
    if (currency === 'PHP') return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (currency === 'USD') return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const send = () => {
    if (!msg.trim()) return;
    setLocalMsgs([...localMsgs, { role: 'customer', text: msg, time: 'Just now' }]);
    setMsg('');
  };

  if (status === 'finalized') {
    return (
      <div className="h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar p-6">
        <PostFinalizationView 
          eventData={event} 
          orderId={eventId} 
          exactBudgetAmt={estimatedTotal} 
          onChatWithShop={onChatWithShop || (() => {})} 
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-140px)] gap-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl grid place-items-center text-emerald-700">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900">Casa Mesa Catering</h2>
                   <p className="text-xs text-slate-500">Official Partner Recommendation</p>
                </div>
             </div>
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {status.toUpperCase()}
             </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-y border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Total</span>
              <span className="text-2xl font-black text-slate-950">{estimatedTotal > 0 ? formatAmt(estimatedTotal) : 'TBD'}</span>
            </div>
            {status === 'suggested' && (
              <div className="flex gap-3">
                <button onClick={onAccept} className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
                  Accept Recommendation
                </button>
                <button className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Reject
                </button>
              </div>
            )}
            {status === 'accepted' && (
              <button onClick={onFinalize} className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
                Proceed to Final Agreement
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex flex-col flex-1 overflow-hidden">
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {localMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${m.role === 'customer' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                    <span className={`text-[8px] mt-1 block uppercase font-bold ${m.role === 'customer' ? 'text-emerald-200' : 'text-slate-400'}`}>{m.time}</span>
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-4 flex gap-2">
             <input 
              value={msg} onChange={e => setMsg(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Chat with catering owner..."
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:border-emerald-500 shadow-sm"
             />
             <button onClick={send} className="w-12 h-12 bg-emerald-700 text-white rounded-2xl grid place-items-center hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
               <Send className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm overflow-y-auto custom-scrollbar">
         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
           <ClipboardList className="w-4 h-4" />
           Catering Receipt (Blueprint)
         </h3>
         <div className="space-y-8">
            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Event Brief</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Guests</p>
                    <p className="font-bold text-slate-800">{event.guest_count || '150'}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Cuisine</p>
                    <p className="font-bold text-slate-800">{event.cuisine_preference || 'Filipino'}</p>
                 </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Menu Selection</p>
              <div className="space-y-2">
                 {activeMenu.map((m: any, i: number) => {
                   const itemPrice = parseBudgetDetails(m.price).value;
                   return (
                     <div key={i} className="flex justify-between items-center text-xs p-3 border-b border-slate-50">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-800">{m.dish}</span>
                           <span className="text-[10px] text-slate-400">{m.portion_per_guest}</span>
                        </div>
                        <span className="font-mono text-slate-600 font-bold">{itemPrice > 0 ? `${formatAmt(itemPrice)} / pax` : '--'}</span>
                     </div>
                   );
                 })}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Operational Timeline</p>
              <div className="space-y-2 border-l-2 border-emerald-100 pl-4 ml-2">
                 {blueprint.find(s => s.agent.includes('Logistics'))?.data.timeline?.slice(0, 5).map((t: any, i: number) => (
                   <div key={i} className="relative py-1">
                      <div className="absolute -left-[21px] top-2.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <p className="text-[10px] font-black text-emerald-800 font-mono">{t.time}</p>
                      <p className="text-[11px] font-medium text-slate-600">{t.activity}</p>
                   </div>
                 ))}
              </div>
            </section>
         </div>
      </div>
    </motion.div>
  );
}
