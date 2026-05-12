import React from 'react';
import { CloudRain, Droplets, Utensils, AlertTriangle, Truck, Clock } from 'lucide-react';

export function MenuReport({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.menu || []).map((item: any, i: number) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-2">{item.dish}</h3>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed line-clamp-3">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">{item.portion_per_guest}</span>
              {(item.tags || []).map((t: string) => (
                <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Chef's Strategy</p>
        <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">"{data.chef_notes || data.justification || 'Menu optimized for event scale and preferences.'}"</p>
      </div>
    </div>
  );
}

export function DietaryReport({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-3">Allergens</p>
        <div className="flex flex-wrap gap-2">
          {(data.allergens_to_avoid || []).map((a: string) => (
            <span key={a} className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">No {a}</span>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-4 md:col-span-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-3">Safety Controls</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(data.safety_controls || []).map((s: string) => (
            <div key={s} className="text-[10px] font-medium text-slate-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeatherReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-[2rem] ${data.risk_level === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'}`}>
          {data.risk_level === 'high' ? <CloudRain className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800">{data.summary}</h3>
          <p className={`text-[10px] font-black uppercase tracking-widest ${data.risk_level === 'high' ? 'text-rose-600' : 'text-sky-600'}`}>Risk Level: {data.risk_level}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(data.recommendations || []).map((r: string, i: number) => (
          <div key={i} className="text-xs text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceReport({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Quote</p>
          <p className="text-2xl font-black text-slate-900">{data.optimized_quote}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Per Guest</p>
          <p className="text-xl font-black text-slate-800">{data.unit_cost}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Yield Margin</p>
          <p className="text-xl font-black text-emerald-600">{data.profit_margin}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-fuchsia-50 border border-fuchsia-100 p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 mb-2">Pricing Strategy</p>
        <p className="text-xs text-slate-700 font-semibold italic leading-relaxed">"{data.pricing_strategy}"</p>
      </div>
    </div>
  );
}

export function LogisticsReport({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.timeline || []).map((t: any, i: number) => (
          <div key={i} className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl">
            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full">{t.time}</span>
            <span className="text-sm font-bold text-slate-800">{t.activity}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Staffing Needs</p>
          <p className="text-sm text-slate-700 font-semibold">{data.staffing_needs}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2">Transport Plan</p>
          <p className="text-sm text-slate-700 font-semibold">{data.transport_plan}</p>
        </div>
      </div>
    </div>
  );
}
export function ConciergeReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <InfoItem label="proto" value={data.event_type} />
        <InfoItem label="count" value={data.guests} />
        <InfoItem label="cred" value={data.budget} />
        <InfoItem label="zone" value={data.location} />
        <InfoItem label="pref" value={data.cuisine_preference} />
        <InfoItem label="style" value={data.service_style} />
      </div>
      {data.cultural_profile && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 mt-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-700">Language + Culture (Winning Feature)</p>
          <p className="mt-2 text-xs leading-5 text-slate-700">
            {data.cultural_profile.language} input detected. {data.cultural_profile.adaptation}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-white border border-slate-100 p-3 rounded-2xl">
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">{label}</span>
      <span className="text-xs font-black text-slate-800 truncate block">{value || '--'}</span>
    </div>
  );
}
