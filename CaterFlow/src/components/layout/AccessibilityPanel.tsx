import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Volume2, Type } from 'lucide-react';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  largeText: boolean;
  setLargeText: (val: boolean) => void;
  voiceFeedback: boolean;
  setVoiceFeedback: (val: boolean) => void;
}

export function AccessibilityPanel({
  isOpen,
  onClose,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  voiceFeedback,
  setVoiceFeedback
}: AccessibilityPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Eye className="w-4 h-4" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Accessibility</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 p-5 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Visual Settings</h3>
                
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${highContrast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">High Contrast</p>
                      <p className="text-[10px] text-slate-500">Increase visual distinction</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${highContrast ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${highContrast ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${largeText ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Large Text</p>
                      <p className="text-[10px] text-slate-500">Increase global font size</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${largeText ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${largeText ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Audio Settings</h3>
                
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${voiceFeedback ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Voice Feedback</p>
                      <p className="text-[10px] text-slate-500">Read AI messages aloud</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${voiceFeedback ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${voiceFeedback ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={voiceFeedback} onChange={(e) => setVoiceFeedback(e.target.checked)} />
                </label>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                CaterFlow Accessibility Engine <br/> v1.2.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
