import React from 'react';
import { motion } from 'motion/react';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

interface WeatherData {
  temp: string;
  condition: string;
  rain: string;
  humidity: string;
  wind: string;
  score: number;
  risk: string;
  recommendation: string;
}

interface WeatherForecastCardProps {
  data: WeatherData;
  location: string;
}

export function WeatherForecastCard({ data, location }: WeatherForecastCardProps) {
  // Remove any potential asterisks from the AI recommendation if they exist
  const cleanRecommendation = data.recommendation.replace(/\*\*/g, '');

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getConditionIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('showers')) return <CloudRain className="w-10 h-10 text-blue-500" />;
    if (c.includes('sun') || c.includes('clear')) return <Sun className="w-10 h-10 text-amber-500" />;
    return <Cloud className="w-10 h-10 text-slate-400" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-white rounded-[2rem] border border-slate-200/60 shadow-xl overflow-hidden"
    >
      {/* Premium Header */}
      <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Atmospheric Data</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100/50 animate-pulse">
              <span className="w-1 h-1 bg-blue-500 rounded-full" />
              <span className="text-[7px] font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
          <p className="text-sm font-black text-slate-900 mt-1 uppercase tracking-tight">{location}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-sm ${getRiskColor(data.risk)}`}>
          {data.risk} Risk
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
              {getConditionIcon(data.condition)}
            </div>
            <div>
              <p className="text-5xl font-black text-slate-900 tracking-tighter">{data.temp}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{data.condition}</p>
            </div>
          </div>
          <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Suitability</p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-black text-emerald-600 leading-none">{data.score}</span>
              <span className="text-xs font-bold text-emerald-300">/10</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CloudRain, label: 'Precipitation', value: data.rain, color: 'text-blue-500' },
            { icon: Droplets, label: 'Humidity', value: data.humidity, color: 'text-cyan-500' },
            { icon: Wind, label: 'Wind Speed', value: data.wind, color: 'text-slate-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all">
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2 opacity-70 group-hover:opacity-100 transition-opacity`} />
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className="text-[11px] font-black text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Visualizer */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Readiness Meter</p>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              {data.score > 7 ? 'Excellent' : data.score > 4 ? 'Optimal' : 'Caution Required'}
            </p>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full p-0.5 border border-slate-200/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.score * 10}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className={`h-full rounded-full shadow-sm ${
                data.score > 7 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                data.score > 4 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 
                'bg-gradient-to-r from-rose-400 to-rose-600'
              }`}
            />
          </div>
        </div>

        {/* Analysis Footer */}
        <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Info className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Agent Recommendation</p>
            </div>
            <p className="text-[13px] font-medium leading-relaxed text-slate-200 italic">
              "{cleanRecommendation}"
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
