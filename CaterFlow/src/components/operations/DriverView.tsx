import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, Send, Users } from 'lucide-react';

export function DriverView({ event, logistics }: { event: any, logistics: any }) {
  const [driverMsg, setDriverMsg] = useState('');
  const [chat, setChat] = useState<any[]>([
    { sender: 'driver', text: "Just arrived at the kitchen. Loading the packages now.", time: '10:05 AM' }
  ]);

  const send = () => {
    if (!driverMsg.trim()) return;
    setChat([...chat, { sender: 'staff', text: driverMsg, time: '10:12 AM' }]);
    setDriverMsg('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
         <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#f0f9f1] cyber-grid opacity-30" />
            <div className="relative h-full flex flex-col">
               <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      Live Logistics Route
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Plate to Venue Delivery</p>
                  </div>
                  <div className="bg-emerald-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20">
                    IN TRANSIT
                  </div>
               </div>
               <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden border border-slate-300">
                  <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-40" alt="Map mockup" />
                  <div className="absolute inset-0 bg-emerald-900/10" />
                  <div className="absolute top-[30%] left-[20%] w-32 h-32 border-4 border-dashed border-emerald-500/50 rounded-full animate-pulse" />
                  <motion.div 
                    animate={{ x: [0, 100, 200, 300], y: [0, -20, 10, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-[10%] w-10 h-10 bg-white rounded-2xl shadow-2xl grid place-items-center border-2 border-emerald-600 z-10"
                  >
                    <Truck className="w-6 h-6 text-emerald-700" />
                  </motion.div>
                  <div className="absolute top-[40%] right-[10%] w-12 h-12 bg-emerald-700 rounded-2xl shadow-2xl grid place-items-center text-white z-10 border-2 border-white">
                    <MapPin className="w-6 h-6" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col flex-1 overflow-hidden">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
             <Users className="w-4 h-4" />
             Chat with Driver
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-bold ${m.sender === 'staff' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                    <span className="text-[7px] mt-1 block opacity-60 uppercase">{m.time}</span>
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-4 flex gap-2">
             <input 
              value={driverMsg} onChange={e => setDriverMsg(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Send message to driver..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 font-bold"
             />
             <button onClick={send} className="w-11 h-11 bg-emerald-700 text-white rounded-xl grid place-items-center hover:bg-emerald-800 transition-all shadow-lg">
               <Send className="w-4 h-4" />
             </button>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-sm text-white overflow-y-auto custom-scrollbar h-64">
           <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-6">Delivery Checklist</h3>
           <div className="space-y-4">
              {logistics?.timeline?.map((t: any, i: number) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="w-5 h-5 rounded-lg border-2 border-emerald-500/30 group-hover:bg-emerald-500/20 transition-all flex-shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black text-emerald-400 font-mono mb-1">{t.time}</p>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed">{t.activity}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
