import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Users, Package, Truck, ShieldCheck, X } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} brand-mark grid place-items-center rounded-2xl text-white shadow-lg shadow-emerald-900/20`}
      >
        <ChefHat className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <div>
        <p
          className={`${compact ? 'text-sm' : 'text-lg'} brand-word font-black leading-none tracking-[-0.02em] text-slate-950`}
        >
          CaterFlow
        </p>
        {!compact && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Smart event operations
          </p>
        )}
      </div>
    </div>
  );
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Welcome to CaterFlow!',
      desc: 'CaterFlow is your digital partner for managing your catering business. We help you organize everything from menus to delivery using Smart AI Agents.',
      icon: <ChefHat className="w-8 h-8 text-emerald-600" />,
    },
    {
      title: 'Talk to our AI',
      desc: 'No complex forms needed. Just tell our Customer Agent your event details (date, guest count, budget) and let us handle the heavy lifting.',
      icon: <Users className="w-8 h-8 text-blue-600" />,
    },
    {
      title: 'Smart Orchestration',
      desc: 'Our team of 11 AI Agents work simultaneously to generate your menu, inventory list, logistics plan, and pricing analysis in seconds.',
      icon: <Package className="w-8 h-8 text-amber-600" />,
    },
    {
      title: 'Manage with Ease',
      desc: 'Once planned, everything is available in your Dashboard. Chat with delivery drivers, check receipts, and finalize every detail of your event.',
      icon: <Truck className="w-8 h-8 text-rose-600" />,
    },
    {
      title: 'Multi-Role Workspace',
      desc: 'CaterFlow adapts to you. Switch between Owner view to manage your shop, Staff view for delivery tasks, or Customer view to track your own event.',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-700" />,
    },
  ];

  return (
    <div className="landing-shell min-h-screen w-full overflow-hidden text-slate-950">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLogo />
        <button
          onClick={onStart}
          className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          Sign in
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-10 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-tomato"></span>
            Multi-agent catering planner
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.03em] text-slate-950 sm:text-7xl">
              Plan beautiful events without the operations mess.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              CaterFlow turns one customer brief into a menu, procurement list, logistics timeline, quote, and risk monitor through a coordinated AI catering team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-emerald-700 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-2xl shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Start planning
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="rounded-full border border-slate-300 bg-white/80 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            >
              Show tutorial
            </button>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-3 pt-4">
            {[
              ['11', 'specialist agents'],
              ['1', 'complete event plan'],
              ['0', 'spreadsheet chaos'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur"
              >
                <p className="text-3xl font-black text-emerald-800">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="preview" className="relative">
          <div className="landing-plate-card overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
            <div className="relative h-[520px] overflow-hidden rounded-[1.5rem] bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1529539795054-3c162aab037a?auto=format&fit=crop&q=85&w=1000"
                alt="Catered table"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
                <BrandLogo compact />
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Live plan
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 grid gap-3">
                {[
                  ['Menu Agent', '6 dishes balanced for allergies and budget', 'bg-emerald-500'],
                  ['Inventory Agent', 'Procurement list and supplier match ready', 'bg-amber-500'],
                  ['Logistics Agent', 'Prep, delivery, staffing timeline generated', 'bg-rose-500'],
                ].map(([agent, copy, dot]) => (
                  <div key={agent} className="rounded-2xl bg-white/92 p-4 shadow-lg backdrop-blur">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`}></span>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                        {agent}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => setShowTutorial(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                    Step {tutorialStep + 1} of {tutorialSteps.length}
                  </div>
                  <div className="flex gap-1">
                    {tutorialSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                          i === tutorialStep ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="min-h-[200px]"
                  >
                    <div className="mb-6 p-4 bg-slate-50 w-fit rounded-3xl">
                      {tutorialSteps[tutorialStep].icon}
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-950 mb-6">
                      {tutorialSteps[tutorialStep].title}
                    </h2>
                    <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                      {tutorialSteps[tutorialStep].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-12 flex gap-4">
                  {tutorialStep > 0 && (
                    <button
                      onClick={() => setTutorialStep((prev) => prev - 1)}
                      className="px-8 py-5 border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Back
                    </button>
                  )}
                  {tutorialStep < tutorialSteps.length - 1 ? (
                    <button
                      onClick={() => setTutorialStep((prev) => prev + 1)}
                      className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowTutorial(false);
                        setTutorialStep(0);
                      }}
                      className="flex-1 py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20"
                    >
                      Done, I&apos;m ready
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}