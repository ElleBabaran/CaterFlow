import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Package,
  Calendar,
  DollarSign,
  ShieldCheck,
  Send, 
  Users,
  Lock
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { inferVenueCoordinates } from '../../services/knowledgeBase';

// Custom tomato pin for the driver
const tomatoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function DriverView({ event, logistics }: { event: any, logistics: any }) {
  const [status, setStatus] = useState<'prep' | 'transit' | 'arrived' | 'setup' | 'completed'>(
    event?.eventData?.delivery_status || 'prep'
  );
  const [venueCoords, setVenueCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  const deliveryLoc =
    event?.deliveryLocation ||
    event?.eventData?.deliveryLocation ||
    event?.eventData?.event_location ||
    event?.event_location ||
    'Manila';

  useEffect(() => {
    inferVenueCoordinates(deliveryLoc).then(c => {
      setVenueCoords(c || { lat: 14.5995, lng: 120.9842 });
      setGeoLoading(false);
    });
  }, [deliveryLoc]);

  const steps = [
    { id: 'prep', label: 'Preparation', icon: ChefHat },
    { id: 'transit', label: 'In Transit', icon: Truck },
    { id: 'arrived', label: 'Arrived', icon: MapPin },
    { id: 'setup', label: 'Setting Up', icon: Utensils },
    { id: 'completed', label: 'Event Live', icon: CheckCircle2 },
  ];

  const handleUpdateStatus = async (newStatus: 'prep' | 'transit' | 'arrived' | 'setup' | 'completed') => {
    setStatus(newStatus);
    try {
      await fetch(`/api/events/${event._id}/delivery-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update delivery status:", err);
    }
  };

  if (event?.status !== 'delivery_approved') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-inner border border-slate-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Delivery Locked</h2>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
          Awaiting admin verification. The admin must verify the order completion and provide the destination location before you can dispatch.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
            <Navigation className="w-6 h-6 text-[var(--accent-color)]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Delivery Command</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Real-time logistics & route management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur px-4 py-2 rounded-2xl border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">GPS Uplink Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Map Preview */}
          <div className="staff-card h-[450px] overflow-hidden relative group">
            {!geoLoading && venueCoords ? (
              <MapContainer center={[venueCoords.lat, venueCoords.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[venueCoords.lat, venueCoords.lng]} icon={tomatoIcon}>
                  <Popup>
                    <strong>Delivery Destination</strong><br />
                    {deliveryLoc}
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Destination Coords...</span>
              </div>
            )}
            <div className="absolute bottom-6 left-6 right-6 z-[1000]">
              <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-xs font-black text-slate-800 uppercase">{deliveryLoc}</p>
                </div>
                <button className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Launch Navigation
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="staff-card p-8">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Journey Progression</h3>
              <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Step {steps.findIndex(s => s.id === status) + 1} of 5</span>
            </div>
            <div className="relative flex justify-between items-center px-4">
              <div className="absolute left-8 right-8 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 -z-10" />
              <div 
                className="absolute left-8 h-0.5 bg-[var(--accent-color)] top-1/2 -translate-y-1/2 -z-10 transition-all duration-700" 
                style={{ width: `${(steps.findIndex(s => s.id === status) / (steps.length - 1)) * 100}%` }}
              />
              
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = steps.findIndex(s => s.id === status) >= idx;
                const isActive = status === step.id;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => handleUpdateStatus(step.id as any)}
                    className="flex flex-col items-center gap-4 group"
                  >
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2
                      ${isCompleted ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20' : 'bg-white border-slate-100 text-slate-300 group-hover:border-[var(--accent-color)]/30'}
                      ${isActive ? 'ring-4 ring-[var(--accent-color)]/10 scale-110' : ''}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-800' : 'text-slate-300'}`}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="staff-card p-6 bg-[var(--accent-color)] text-white shadow-xl shadow-[var(--accent-color)]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">ETA to Venue</p>
                <p className="text-xl font-black italic uppercase tracking-tighter">14 Minutes</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Current Traffic</p>
                <p className="text-sm font-bold">Moderate Condition (EDSA)</p>
              </div>
              <button className="w-full bg-white text-[var(--accent-color)] rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-95">
                Update Status
              </button>
            </div>
          </div>

          <div className="staff-card p-6 border-dashed bg-white/30 backdrop-blur">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">Venue Logistics</h3>
            <div className="space-y-4">
              {[
                'Entrance: Loading Dock 3 (Behind South Wing)',
                'Point of Contact: Event coordinator',
                'Special Handling: Fragile AI-recommended platter',
              ].map((note, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] mt-1.5 flex-shrink-0" />
                  <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase tracking-tight">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="staff-card p-6">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Operations Feed</h3>
             <div className="space-y-4">
                {logistics?.timeline?.slice(0, 3).map((t: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                     <div className="w-1 h-8 rounded-full bg-slate-100 flex-shrink-0" />
                     <div>
                        <p className="text-[10px] font-black text-[var(--accent-color)] mb-0.5">{t.time}</p>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{t.activity}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
