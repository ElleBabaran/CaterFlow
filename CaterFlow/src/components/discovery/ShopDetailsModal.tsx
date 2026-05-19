import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Globe, 
  Star,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  DollarSign,
  Utensils
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon URLs (broken by webpack asset bundling)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const isValidCoordinate = (coords: any): coords is { lat: number; lng: number } => {
  return typeof coords === 'object' && 
         coords !== null && 
         typeof coords.lat === 'number' && !isNaN(coords.lat) && 
         typeof coords.lng === 'number' && !isNaN(coords.lng);
};

interface ShopDetailsModalProps {
  shopId: string;
  onClose: () => void;
  onStartChat: (shop: any) => void;
}

export const ShopDetailsModal: React.FC<ShopDetailsModalProps> = ({ shopId, onClose, onStartChat }) => {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/shops/${shopId}`);
        const data = await response.json();
        setShop(data);
      } catch (err) {
        console.error("Failed to fetch shop details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [shopId]);

  if (loading) return null; // Or a loader

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-white transition-all shadow-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner */}
          <div className="relative h-64 sm:h-80 bg-slate-900">
            <img 
              src={shop.banner || 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200&auto=format&fit=crop'} 
              className="w-full h-full object-cover opacity-70"
              alt="banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            
            <div className="absolute -bottom-16 left-10 flex items-end gap-6">
              <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-2xl border border-slate-100">
                <img 
                  src={shop.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=10b981&color=fff&bold=true`} 
                  className="w-full h-full object-cover rounded-[1.5rem]" 
                  alt="logo" 
                />
              </div>
              <div className="pb-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{shop.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[10px] font-black">
                    <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                    {shop.rating || '4.8'}
                  </div>
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{shop.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-10 pt-24 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">About the Provider</h3>
                <p className="text-slate-600 leading-relaxed text-lg italic">
                  "{shop.description || 'We pride ourselves on delivering exceptional culinary experiences tailored to your unique event needs. From intimate gatherings to grand celebrations, our team ensures every detail is perfect.'}"
                </p>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Available Packages</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(shop.menuPackages || [
                    { name: 'Classic Fiesta', price: 1500, items: ['Pork Adobo', 'Chicken Inasal', 'Java Rice', 'Buko Pandan'], image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400' },
                    { name: 'Royal Banquet', price: 2500, items: ['Roast Beef', 'Garlic Prawns', 'Mixed Veggies', 'Cheesecake'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }
                  ]).map((pkg: any, i: number) => (
                    <div key={i} className="group bg-slate-50 border border-slate-200 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <h4 className="text-xl font-black text-slate-800 mb-1">{pkg.name}</h4>
                      <p className="text-2xl font-black text-emerald-600 mb-4">₱{pkg.price}<span className="text-[10px] font-bold text-slate-400 ml-1">/head</span></p>
                      <div className="space-y-2">
                        {pkg.items?.map((item: string, j: number) => (
                          <div key={j} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-500">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-950/20">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-6">Contact Channels</h3>
                <div className="space-y-6">
                  <ContactItem icon={Phone} label="Phone" value={shop.contactInfo?.phone || '+63 917 123 4567'} />
                  <ContactItem icon={Mail} label="Email" value={shop.contactInfo?.email || 'hello@catering.com'} />
                  <ContactItem icon={Facebook} label="Social" value={shop.contactInfo?.facebook || '/catering.official'} />
                  <ContactItem icon={MapPin} label="Address" value={shop.contactInfo?.address || shop.location} />
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                  <button 
                    onClick={() => onStartChat(shop)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with Shop Admin
                  </button>
                  <p className="text-[9px] text-center text-white/40 font-bold uppercase tracking-widest">Only verified admins can respond</p>
                </div>
              </div>

              {/* Mini Map */}
              {isValidCoordinate(shop.coordinates) ? (
                <div className="rounded-[2.5rem] h-48 overflow-hidden border border-emerald-100 shadow-inner">
                  <MapContainer center={[shop.coordinates.lat, shop.coordinates.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[shop.coordinates.lat, shop.coordinates.lng]}>
                      <Popup><strong>{shop.name}</strong><br />{shop.location}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] h-48 flex flex-col items-center justify-center gap-2">
                  <MapPin className="w-8 h-8 text-emerald-400" />
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Location: {shop.location || 'TBD'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ContactItem: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold truncate max-w-[150px]">{value}</p>
    </div>
  </div>
);
