import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Utensils, 
  ArrowRight, 
  ChefHat, 
  CheckCircle2,
  Clock,
  Globe,
  PlusCircle
} from 'lucide-react';

interface BlueprintSummaryProps {
  eventData: any;
  onNext: () => void;
  onBack: () => void;
}

export const BlueprintSummary: React.FC<BlueprintSummaryProps> = ({ eventData, onNext, onBack }) => {
  const stats = [
    { label: 'Guests', value: eventData.guest_count || 'Not specified', icon: Users, color: 'bg-blue-500' },
    { label: 'Budget', value: eventData.budget || 'Not specified', icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Location', value: eventData.event_location || 'Not specified', icon: MapPin, color: 'bg-rose-500' },
    { label: 'Date', value: eventData.event_date || 'Not specified', icon: Calendar, color: 'bg-amber-500' },
  ];

  const preferences = [
    { label: 'Cuisine', value: eventData.cuisine_preference, icon: Globe },
    { label: 'Cooking Style', value: eventData.food_style_preference, icon: ChefHat },
    { label: 'Dietary Needs', value: eventData.dietary_needs, icon: PlusCircle },
    { label: 'Menu Style', value: eventData.menu_composition, icon: Utensils },
  ].filter(p => p.value);

  return (
    <div className="relative min-h-[calc(100vh-140px)] w-full overflow-y-auto px-4 py-8 custom-scrollbar">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-300/10 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-300/10 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-widest shadow-sm"
          >
            <CheckCircle2 className="w-3 h-3" />
            Intake Complete
          </motion.div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            The Event Architect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Blueprint Summary</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            I've gathered your requirements. Review your event blueprint below before we generate your custom catering recommendations.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core Stats Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-0 overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">Core Specifications</h3>
              <p className="text-xl font-bold">Event Vitals</p>
            </div>
            <div className="p-8 grid grid-cols-1 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 shadow-sm`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Preferences Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="premium-card p-0"
          >
            <div className="bg-emerald-700 p-6 text-white">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">Culinary Preferences</h3>
              <p className="text-xl font-bold">Style & Flavor</p>
            </div>
            <div className="p-8 space-y-8">
              {preferences.length > 0 ? (
                preferences.map((pref, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 border border-slate-100">
                      <pref.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{pref.label}</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{pref.value}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 italic text-sm">
                  No specific preferences set. System will auto-curate.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Special Requests */}
        {eventData.special_requests && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="premium-card bg-slate-50 border-slate-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Additional Requests</h3>
            </div>
            <p className="text-slate-700 italic leading-relaxed text-sm">
              "{eventData.special_requests}"
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 pb-12">
          <button 
            onClick={onBack}
            className="px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 text-slate-400 hover:text-slate-900"
          >
            Back to Chat
          </button>
          <button 
            onClick={onNext}
            className="premium-button premium-button-primary bg-emerald-700 hover:bg-emerald-800"
          >
            Next: Find Nearby Shops
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
