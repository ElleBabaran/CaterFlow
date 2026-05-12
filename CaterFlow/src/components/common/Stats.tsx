import React from 'react';

export function InfoItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white p-3 border border-slate-100 rounded-2xl flex flex-col gap-1 min-h-[64px]">
      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{label}</span>
      <span className="font-bold truncate text-sm text-slate-800">{value || 'None'}</span>
    </div>
  );
}

export function InfoTile({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 min-h-[82px]">
      <div className="text-emerald-600 mb-2">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-[11px] font-bold text-slate-800 truncate">{value || '--'}</p>
    </div>
  );
}
