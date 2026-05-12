import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Save } from 'lucide-react';

export function AdminShopSetup({ profile, onSave }: { profile: any, onSave: (data: any) => void }) {
  const [name, setName] = useState(profile?.name || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [specialties, setSpecialties] = useState(profile?.specialties || '');
  const [baseQuote, setBaseQuote] = useState(profile?.baseQuote || '');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Setup Your Catering Shop</h2>
        <p className="text-slate-500 text-sm">Appear on the CaterFlow map and get recommended to customers.</p>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shop Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
              placeholder="e.g. Gourmet Manila Events"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location / Address</label>
            <div className="relative">
              <input 
                value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
                placeholder="City, District"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialties</label>
            <textarea 
              value={specialties} onChange={e => setSpecialties(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500 h-24" 
              placeholder="Filipino Fusion, Corporate Buffet, etc."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Quote Estimate (PHP)</label>
            <input 
              type="number" value={baseQuote} onChange={e => setBaseQuote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
              placeholder="50000"
            />
          </div>
        </div>
        <button 
          onClick={() => onSave({ name, location, specialties, baseQuote: Number(baseQuote) })}
          className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          Update Shop Profile
        </button>
      </div>
    </motion.div>
  );
}
