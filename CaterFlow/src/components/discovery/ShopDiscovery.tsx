import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  ChevronRight, 
  Search, 
  Filter, 
  ArrowRight,
  Info,
  ExternalLink,
  MessageCircle,
  Award
} from 'lucide-react';

interface Shop {
  _id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  baseQuote: number;
}

export const ShopDiscovery: React.FC<{ 
  eventData: any, 
  onSelectShop: (shopId: string) => void 
}> = ({ eventData, onSelectShop }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(eventData.event_location || '');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shops/discovery?location=${searchTerm}`);
      const data = await response.json();
      setShops(data);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-10 py-10 px-4 max-w-7xl mx-auto custom-scrollbar overflow-y-auto max-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em]"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Marketplace
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Nearby Providers</span>
          </h2>
          <p className="text-slate-500 font-medium">Found {shops.length} verified catering partners near {searchTerm}</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Change location..."
              className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 pl-10"
            />
          </div>
          <button 
            onClick={fetchShops}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
          >
            Update
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-[420px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : shops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shops.map((shop, idx) => (
            <ShopCard key={shop._id} shop={shop} idx={idx} onSelect={() => onSelectShop(shop._id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-800">No Shops Found</h3>
          <p className="text-slate-400 max-w-xs mx-auto mt-2">We couldn't find any catering partners in this area yet. Try searching for a larger city.</p>
        </div>
      )}
    </div>
  );
};

const ShopCard: React.FC<{ shop: Shop, idx: number, onSelect: () => void }> = ({ shop, idx, onSelect }) => {
  const bannerImg = shop.banner || `https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop`;
  const logoImg = shop.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=10b981&color=fff&bold=true`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={bannerImg} 
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2 shadow-lg">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black text-slate-900">{shop.rating}</span>
            <span className="text-[10px] font-bold text-slate-400">({shop.reviewCount})</span>
          </div>
        </div>
        <div className="absolute -bottom-6 left-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100">
            <img src={logoImg} className="w-full h-full object-cover rounded-xl" alt="logo" />
          </div>
        </div>
      </div>

      <div className="p-8 pt-10 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase">
            {shop.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-slate-400">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{shop.location}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-6">
          {shop.description || "Premium catering services specializing in elegant events and custom curated menus for every occasion."}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {shop.specialties?.slice(0, 3).map((spec, i) => (
            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
              {spec}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base Package</p>
            <p className="text-lg font-black text-slate-900 tracking-tighter">₱{shop.baseQuote || '2,500'}<span className="text-[10px] font-bold text-slate-400 ml-1">/head</span></p>
          </div>
          <button 
            onClick={onSelect}
            className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-emerald-400 transition-all duration-500 shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
