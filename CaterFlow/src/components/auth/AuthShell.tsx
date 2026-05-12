import React from 'react';
import { motion } from 'motion/react';
import { Loader2, ChefHat } from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface AuthShellProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  signupRole: WorkspaceRole;
  setSignupRole: (role: WorkspaceRole) => void;
  authError: string | null;
  onEmailAuth: (e: React.FormEvent) => void;
  onGoogleAuth: () => void;
  onBack: () => void;
}

export function AuthShell({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  signupRole,
  setSignupRole,
  authError,
  onEmailAuth,
  onGoogleAuth,
  onBack
}: AuthShellProps) {
  return (
    <div className="login-shell min-h-screen w-full p-5 relative overflow-hidden bg-[#fcf9f2]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,184,75,0.1),transparent_32%)] pointer-events-none" />
      <div className="relative z-20 mx-auto mb-5 flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-700 rounded-xl flex items-center justify-center text-white">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-black text-slate-900 tracking-tight">CaterFlow</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-800"
        >
          Back
        </button>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.08fr_0.92fr]"
      >
        <section className="relative hidden min-h-[660px] overflow-hidden p-8 lg:block">
          <img
            src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=85&w=1200"
            alt="Catering prep"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/24 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Event ops workspace
            </div>
            <div className="max-w-xl space-y-5 text-white">
              <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.03em]">From client brief to service-ready plan.</h2>
              <p className="max-w-md text-sm text-white/70 leading-relaxed">
                Sign in to coordinate menu planning, procurement, logistics, pricing, and risk monitoring with your AI catering team.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12 text-slate-900 flex flex-col justify-center bg-white">
          <div className="mb-8 space-y-3">
            <h1 className="text-4xl font-black tracking-[-0.03em] text-slate-950">
              {authMode === 'login' ? 'Welcome back.' : 'Create workspace.'}
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              {authMode === 'login'
                ? 'Continue building catering plans with your AI team.'
                : 'Set up your account and start planning your first event.'}
            </p>
          </div>

          <form onSubmit={onEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="EX: JOHN DOE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Workspace Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['customer', 'Customer', 'Submit briefs, review menus'],
                      ['admin', 'Admin', 'Dashboard, pricing, suppliers'],
                    ].map(([role, title, copy]) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupRole(role as WorkspaceRole)}
                        className={`rounded-2xl border p-4 text-left transition ${signupRole === role ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
                      >
                        <p className={`text-xs font-black uppercase tracking-widest ${signupRole === role ? 'text-emerald-800' : 'text-slate-700'}`}>{title}</p>
                        <p className="mt-2 text-[9px] leading-4 text-slate-500">{copy}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="USER@DOMAIN.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            
            {authError && (
              <div className="bg-rose-50 p-4 border border-rose-100 rounded-2xl">
                <p className="text-[10px] text-rose-600 font-bold uppercase">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-14 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all"
            >
              {authMode === 'login' ? 'Secure Login' : 'Create Account'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-widest"><span className="bg-white px-3 text-slate-400 font-bold">or</span></div>
          </div>

          <button
            onClick={onGoogleAuth}
            className="w-full min-h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
            Continue with Google
          </button>

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold pt-6">
            {authMode === 'login' ? "New operator?" : "Already registered?"}{" "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-emerald-700 underline"
            >
              {authMode === 'login' ? 'Sign Up' : 'Return to Login'}
            </button>
          </p>
        </section>
      </motion.div>
    </div>
  );
}
