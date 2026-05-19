import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MapPin,
  Star,
  MessageCircle,
  QrCode,
  ArrowRight,
  ChefHat,
  Phone,
  Globe,
  Loader2,
  Sparkles,
  Store,
  BadgeCheck
} from 'lucide-react';
import { parseBudgetDetails } from '../../services/budget';

interface PostFinalizationViewProps {
  eventData: any;
  orderId: string;
  exactBudgetAmt?: number;
  onChatWithShop: (shop: any) => void;
}

export function PostFinalizationView({ eventData, orderId, exactBudgetAmt, onChatWithShop }: PostFinalizationViewProps) {
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [availableShops, setAvailableShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [qrVisible, setQrVisible] = useState(false);
  const [wantsSuggestions, setWantsSuggestions] = useState<boolean | null>(null);

  // Parse exact budget
  const parsed = parseBudgetDetails(eventData?.budget || '');
  const currency = parsed.currency || 'PHP';
  const budgetValue = exactBudgetAmt !== undefined ? exactBudgetAmt : parsed.value;
  const formatBudget = (n: number) => {
    if (currency === 'PHP') return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (currency === 'USD') return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency} ${n.toLocaleString()}`;
  };
  const exactBudget = budgetValue > 0 ? formatBudget(budgetValue) : (eventData?.budget || 'N/A');

  const location = eventData?.event_location || '';
  const qrUrl = `${window.location.origin}?orderId=${orderId}`;

  useEffect(() => {
    setTimeout(() => setQrVisible(true), 800);
  }, []);

  const handleWantSuggestions = (wants: boolean) => {
    setWantsSuggestions(wants);
    if (wants) {
      fetchShops();
    }
  };

  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      // Fetch nearby shops (filtered by location if available)
      const nearbyRes = await fetch(`/api/shops/discovery?location=${encodeURIComponent(location)}`);
      const nearbyData = nearbyRes.ok ? await nearbyRes.json() : [];
      setNearbyShops(Array.isArray(nearbyData) ? nearbyData : []);

      // Fetch all admin shops for the "available to chat" section
      const allRes = await fetch(`/api/shops`);
      const allData = allRes.ok ? await allRes.json() : [];
      setAvailableShops(Array.isArray(allData) ? allData : []);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoadingShops(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full w-full space-y-10 pb-20"
    >
      {/* ── Congratulations Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-10 text-white shadow-2xl shadow-emerald-900/30"
      >
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-emerald-500/20 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300 mb-1">
              <Sparkles className="w-3 h-3 inline mr-1" /> Order Finalized
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              Your catering plan is locked in!
            </h1>
            <p className="text-emerald-200/80 text-sm mt-1 font-medium">
              {eventData?.event_type || 'Event'} · {eventData?.guest_count || '--'} guests · {eventData?.event_date || '--'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">Exact Budget</p>
            <p className="text-4xl font-black tracking-tight text-white">{exactBudget}</p>
            <p className="text-[10px] text-emerald-300/70 font-bold mt-0.5">{eventData?.event_location || 'Location TBD'}</p>
          </div>
        </div>
      </motion.div>

      {/* ── QR Code ── */}
      <AnimatePresence>
        {qrVisible && orderId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm"
          >
            <div className="text-center">
              <QrCode className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Order QR Code</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                Share with your caterer to confirm the order
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`}
                alt="Order QR Code"
                className="w-[220px] h-[220px]"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Budget: <span className="text-emerald-700">{exactBudget}</span>
              </p>
              <p className="text-[9px] text-slate-400 font-mono break-all max-w-xs">
                {qrUrl}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Want Suggestions Prompt ── */}
      {wantsSuggestions === null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-sm">
          <Store className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Find a Catering Shop?</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto font-medium">
            Would you like us to suggest catering services near your location that match your finalized event plan?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleWantSuggestions(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
            >
              Yes, suggest shops
            </button>
            <button
              onClick={() => handleWantSuggestions(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              No, thanks
            </button>
          </div>
        </motion.div>
      )}

      {wantsSuggestions === true && (
        <>
          {/* ── Suggested Catering Services Near Your Place ── */}
          <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Suggested Catering Services
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              Near {location || 'your location'}
            </p>
          </div>
          {loadingShops && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
        </div>

        {loadingShops ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 bg-slate-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : nearbyShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {nearbyShops.map((shop: any, idx: number) => (
              <motion.div
                key={shop._id || idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:shadow-emerald-900/8 hover:border-emerald-200 transition-all duration-300 flex flex-col gap-4"
              >
                {/* Shop header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {shop.shopImage || shop.logo ? (
                      <img src={shop.shopImage || shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <ChefHat className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {shop.name || 'Catering Shop'}
                    </h3>
                    {/* Exact address */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 truncate">
                        {shop.location || 'Address not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating + specialties */}
                <div className="space-y-2">
                  {shop.rating && (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(shop.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-[10px] font-bold text-slate-400 ml-1">{shop.rating}</span>
                    </div>
                  )}
                  {shop.specialties && (
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {typeof shop.specialties === 'string' ? shop.specialties : shop.specialties?.join(', ')}
                    </p>
                  )}
                </div>

                {/* Base quote */}
                {shop.baseQuote && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Starting at</p>
                      <p className="text-base font-black text-slate-900">₱{Number(shop.baseQuote).toLocaleString()}<span className="text-[10px] text-slate-400 font-bold">/head</span></p>
                    </div>
                    <BadgeCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                )}

                {shop.socials && (
                  <a
                    href={shop.socials.startsWith('http') ? shop.socials : `https://${shop.socials}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    View Profile
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
            <Store className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No shops found near your location</p>
            <p className="text-xs text-slate-300 mt-2">Check back once catering partners register in your area.</p>
          </div>
        )}
      </section>

      {/* ── Available Catering Services to Chat ── */}
      {availableShops.length > 0 && (
        <section className="space-y-6">
          <div className="border-t-2 border-dashed border-slate-100 pt-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Available Catering Services to Chat
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Directly message these verified catering shops
            </p>
          </div>

          <div className="space-y-3">
            {availableShops.map((shop: any, idx: number) => (
              <motion.div
                key={shop._id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {shop.shopImage || shop.logo ? (
                    <img src={shop.shopImage || shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Store className="w-6 h-6 text-emerald-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{shop.name || 'Catering Shop'}</p>
                  {/* Exact address name */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-slate-500 truncate">
                      {shop.location || 'Address unavailable'}
                    </p>
                  </div>
                  {shop.specialties && (
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                      {typeof shop.specialties === 'string' ? shop.specialties.split(',').slice(0, 2).join(', ') : ''}
                    </p>
                  )}
                </div>

                {/* Online status dot */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Available</span>
                </div>

                {/* Chat button */}
                <button
                  onClick={() => onChatWithShop(shop)}
                  className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md shadow-emerald-900/15 group-hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}
        </>
      )}
    </motion.div>
  );
}
