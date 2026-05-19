import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MapPin,
  Star,
  MessageCircle,
  QrCode,
  ChefHat,
  Globe,
  Loader2,
  Sparkles,
  Store,
  BadgeCheck,
  Phone,
  ArrowRight,
  Navigation,
  Zap,
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
  const [shopsVisible, setShopsVisible] = useState(false);

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

  const guestsCount = Number(eventData?.guest_count || eventData?.guests || 100);

  // Staffing cost calculation
  const waitstaffCount = Math.max(2, Math.ceil(guestsCount / 15));
  const waitstaffTotal = waitstaffCount * 1500;
  const kitchenStaffTotal = 3500 + 4000;
  const logisticsTotal = 2500;
  const staffTotal = waitstaffTotal + kitchenStaffTotal + logisticsTotal;
  const targetBudget = budgetValue > 0 ? budgetValue : guestsCount * 500;
  const foodTotal = Math.max(guestsCount * 150, targetBudget - staffTotal);
  const foodPricePerGuest = Math.floor(foodTotal / guestsCount);
  const grandTotal = foodTotal + staffTotal;

  const fallbackNearbyShops = [
    {
      _id: 'shop-fallback-1',
      name: "Pamela's Catering Specialties",
      location: '456 Quezon Avenue, Quezon City, Metro Manila, 1100',
      rating: 4.9,
      specialties: 'Premium Filipino-Spanish Fusion, Traditional Wedding Feasts',
      baseQuote: 320,
      logo: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=100&auto=format&fit=crop',
      socials: 'facebook.com/pamelascatering',
    },
    {
      _id: 'shop-fallback-2',
      name: 'Grand Horizon Event Planners & Catering',
      location: '789 Katipunan Avenue, Loyola Heights, Quezon City, 1108',
      rating: 4.8,
      specialties: 'International Buffet, Modern French Culinary Cuisine',
      baseQuote: 450,
      logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format&fit=crop',
      socials: 'grandhorizonevents.com',
    },
    {
      _id: 'shop-fallback-3',
      name: 'Casa de Fiesta Catering Services',
      location: '123 Taft Avenue, Malate, City of Manila, 1004',
      rating: 4.7,
      specialties: 'Roast Beef Specialties, Seafood Extravaganza, Native Dessert Bars',
      baseQuote: 280,
      logo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=100&auto=format&fit=crop',
      socials: 'casadefiestacatering.ph',
    },
  ];

  useEffect(() => {
    // QR shows after 800ms
    const qrTimer = setTimeout(() => setQrVisible(true), 800);
    // Auto-start fetching shops
    fetchShops();
    return () => clearTimeout(qrTimer);
  }, []);

  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const [nearbyRes, allRes] = await Promise.all([
        fetch(`/api/shops/discovery?location=${encodeURIComponent(location)}`),
        fetch(`/api/shops`),
      ]);

      const nearbyData = nearbyRes.ok ? await nearbyRes.json() : [];
      const allData = allRes.ok ? await allRes.json() : [];

      const finalNearby = (Array.isArray(nearbyData) && nearbyData.length > 0) ? nearbyData : fallbackNearbyShops;
      const finalAll = (Array.isArray(allData) && allData.length > 0) ? allData : fallbackNearbyShops;

      setNearbyShops(finalNearby);
      setAvailableShops(finalAll);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      setNearbyShops(fallbackNearbyShops);
      setAvailableShops(fallbackNearbyShops);
    } finally {
      setLoadingShops(false);
      setTimeout(() => setShopsVisible(true), 300);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full w-full space-y-10 pb-24"
    >
      {/* ── Congratulations Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-10 text-white shadow-2xl shadow-emerald-900/30"
      >
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-emerald-500/20 rounded-full" />
        <div className="absolute top-8 right-8 w-8 h-8 bg-amber-400/20 rounded-full animate-ping" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </motion.div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 inline" /> Order Finalized
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              Your {eventData?.event_type || 'event'} plan is locked in!
            </h1>
            <p className="text-emerald-200/80 text-sm mt-1 font-medium">
              {guestsCount} guests · {eventData?.event_date || '--'} · {eventData?.event_location || 'Venue TBD'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">Your Exact Budget</p>
            <p className="text-4xl font-black tracking-tight text-white">{exactBudget}</p>
            <p className="text-[10px] text-emerald-300/70 font-bold mt-0.5">Total approved amount</p>
          </div>
        </div>
      </motion.div>

      {/* ── Premium Thermal Receipt ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-auto max-w-lg bg-[#faf9f6] border border-slate-200 shadow-xl relative p-8 font-mono text-xs text-slate-800 rounded-3xl"
        style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
      >
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-sm font-black tracking-widest uppercase">*** CATERFLOW OUTLET ***</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Official Event Billing & Receipt</p>
          <p className="text-[9px] text-slate-400">ORDER REF: #{orderId.slice(0, 8).toUpperCase()}</p>
          <p className="text-[9px] text-slate-400">DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="text-slate-300 font-bold">----------------------------------------</div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-bold uppercase text-slate-400">CLIENT:</span>
              <span className="text-slate-700 font-bold truncate max-w-[180px]">{eventData?.customer_name || 'VALUED CUSTOMER'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase text-slate-400">EVENT:</span>
              <span className="text-slate-700 font-bold">{(eventData?.event_type || 'CELEBRATION').toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase text-slate-400">VENUE:</span>
              <span className="text-slate-700 font-bold text-right truncate max-w-[180px]">{(eventData?.event_location || 'METRO MANILA').toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase text-slate-400">GUESTS:</span>
              <span className="text-slate-700 font-bold">{guestsCount} PAX</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold">----------------------------------------</div>

          <div className="space-y-2">
            <p className="font-bold text-[10px] uppercase text-emerald-700 tracking-wider">--- FOOD & BEVERAGES ---</p>
            <div className="flex justify-between">
              <span>CATERING MENU ({guestsCount} PAX x {formatBudget(foodPricePerGuest)})</span>
              <span className="font-bold">{formatBudget(foodTotal)}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-bold text-[10px] uppercase text-emerald-700 tracking-wider">--- SERVICE & STAFFING ---</p>
            <div className="flex justify-between">
              <span>KITCHEN CREW (CHEF & ASST)</span>
              <span>{formatBudget(kitchenStaffTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>SERVICE WAITSTAFF ({waitstaffCount} WAITERS)</span>
              <span>{formatBudget(waitstaffTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>LOGISTICS COORDINATION</span>
              <span>{formatBudget(logisticsTotal)}</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold">========================================</div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-black">
              <span className="uppercase text-slate-900">GRAND TOTAL</span>
              <span className="text-emerald-700 font-black">{formatBudget(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span className="uppercase font-bold">APPROVED BUDGET</span>
              <span className="font-bold text-emerald-600">{exactBudget}</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold">========================================</div>

          <div className="flex flex-col items-center justify-center py-4 space-y-1">
            <div className="w-full h-8 bg-[repeating-linear-gradient(90deg,#1e293b,#1e293b_2px,transparent_2px,transparent_6px,#1e293b_6px,#1e293b_10px)] opacity-85" />
            <p className="text-[8px] text-slate-400 tracking-[0.4em] uppercase font-bold">*{orderId.slice(0, 10).toUpperCase()}*</p>
          </div>

          <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
            🥂 THANK YOU FOR CHOOSING CATERFLOW!<br />
            YOUR GOLD-STANDARD EVENT IS READY.
          </div>
        </div>
      </motion.div>

      {/* ── QR Code ── */}
      <AnimatePresence>
        {qrVisible && orderId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            className="flex flex-col items-center gap-6 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <QrCode className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Order QR Code</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                Share with your caterer to confirm the order
              </p>
            </div>
            <div className="relative">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`}
                  alt="Order QR Code"
                  className="w-[220px] h-[220px]"
                />
              </div>
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                Budget: <span className="text-emerald-700">{exactBudget}</span>
              </p>
              <p className="text-[9px] text-slate-400 font-mono break-all max-w-xs">
                {qrUrl}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suggested Catering Services Near Your Place (Auto-loads) ── */}
      <AnimatePresence>
        {shopsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70 }}
            className="space-y-10"
          >
            {/* Nearby Shops Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Live Recommendations</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Suggested Catering Services
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    Near {location || 'your location'}
                  </p>
                </div>
                {loadingShops && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
              </div>

              {loadingShops ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-56 bg-slate-100 rounded-[2rem] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {nearbyShops.map((shop: any, idx: number) => (
                    <motion.div
                      key={shop._id || idx}
                      initial={{ opacity: 0, y: 20, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.08, type: 'spring', stiffness: 90 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-200 transition-all duration-500 flex flex-col"
                    >
                      {/* Banner */}
                      <div className="relative h-28 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                        {(shop.shopImage || shop.logo || shop.banner) && (
                          <img
                            src={shop.shopImage || shop.banner || shop.logo}
                            alt={shop.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
                        {/* Logo badge */}
                        <div className="absolute bottom-3 left-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-lg flex items-center justify-center overflow-hidden">
                            {shop.logo ? (
                              <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <ChefHat className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                        </div>
                        {/* Rating badge */}
                        {shop.rating && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md border border-white/20">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-slate-900">{shop.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1 gap-3">
                        {/* Shop name + address */}
                        <div>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                            {shop.name || 'Catering Shop'}
                          </h3>
                          <div className="flex items-start gap-1 mt-1.5">
                            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                              {shop.location || 'Address not available'}
                            </p>
                          </div>
                        </div>

                        {/* Specialties */}
                        {shop.specialties && (
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                            {typeof shop.specialties === 'string' ? shop.specialties : shop.specialties?.join(', ')}
                          </p>
                        )}

                        {/* Footer: price + badge */}
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
                          {shop.baseQuote ? (
                            <div>
                              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Starting at</p>
                              <p className="text-base font-black text-slate-900">
                                ₱{Number(shop.baseQuote).toLocaleString()}
                                <span className="text-[10px] text-slate-400 font-bold">/head</span>
                              </p>
                            </div>
                          ) : <div />}
                          <div className="flex items-center gap-1.5">
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                          </div>
                        </div>

                        {/* Socials link */}
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
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Available Catering Services to Chat */}
            {availableShops.length > 0 && (
              <section className="space-y-6">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white shadow-2xl">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full" />
                  <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-teal-500/10 rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Direct Connect</p>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">
                      Available Catering Services to Chat
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Directly message these verified catering shops
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {availableShops.map((shop: any, idx: number) => (
                    <motion.div
                      key={shop._id || idx}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07, type: 'spring', stiffness: 100 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group"
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                        {shop.shopImage || shop.logo ? (
                          <img src={shop.shopImage || shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <Store className="w-7 h-7 text-emerald-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {shop.name || 'Catering Shop'}
                        </p>
                        {/* Exact address */}
                        <div className="flex items-start gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-slate-500 leading-snug line-clamp-2">
                            {shop.location || 'Address unavailable'}
                          </p>
                        </div>
                        {shop.specialties && (
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                            {typeof shop.specialties === 'string' ? shop.specialties.split(',').slice(0, 2).join(', ') : ''}
                          </p>
                        )}
                      </div>

                      {/* Online indicator */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hidden sm:block">Online</span>
                      </div>

                      {/* Chat button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChatWithShop(shop)}
                        className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md shadow-emerald-900/15 flex-shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading shops placeholder while QR shows */}
      {!shopsVisible && !loadingShops && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Finding catering services near you...
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
