import React from 'react';
import { LogOut, History, ShieldCheck, ChefHat } from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface HeaderProps {
  user: any;
  workspaceRole: WorkspaceRole;
  isProcessing: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
  onShowAccessibility: () => void;
  onLogout: () => void;
}

export function Header({
  user,
  workspaceRole,
  isProcessing,
  showHistory,
  onToggleHistory,
  onShowAccessibility,
  onLogout
}: HeaderProps) {
  return (
    <header className="h-16 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
          <ChefHat className="w-5 h-5" />
        </div>
        <h1 className="text-sm font-black tracking-tight text-slate-950">
          CaterFlow <span className="text-slate-400 font-bold text-[9px] ml-2 uppercase tracking-widest hidden sm:inline">Operating System</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Role</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{workspaceRole}</span>
        </div>
        
        <button 
          onClick={onShowAccessibility}
          className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 transition-all"
          title="Accessibility"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onToggleHistory}
          className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-emerald-700 text-white shadow-lg' : 'hover:bg-emerald-50 text-slate-500'}`}
          title="History"
        >
          <History className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Agents {isProcessing ? 'Working' : 'Idle'}</span>
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <img src={user?.photoURL || "https://i.pravatar.cc/150?u=default"} className="w-7 h-7 rounded-full border border-slate-200" alt="User" />
          <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
