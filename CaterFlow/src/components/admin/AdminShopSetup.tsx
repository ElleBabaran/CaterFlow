import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Save, Store, DollarSign, Utensils, Globe, Camera, ShieldCheck } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { inferVenueCoordinates } from '../../services/knowledgeBase';

// Fix default leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green pin for the shop
const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function InteractiveMarker({ position, setPosition, name, location }: any) {
  const { useMapEvents } = require('react-leaflet');
  const map = useMapEvents({
    click(e: any) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          setPosition(marker.getLatLng());
        },
      }}
      icon={shopIcon}
    >
      <Popup>
        <strong>{name || 'Your Shop'}</strong><br />
        {location}<br/>
        <span className="text-[9px] text-emerald-600 mt-1 block">(You can drag this pin)</span>
      </Popup>
    </Marker>
  );
}

export function AdminShopSetup({ profile, onSave }: { profile: any; onSave: (data: any) => void }) {
  const [name, setName] = useState(profile?.name || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [socials, setSocials] = useState(profile?.socials || '');
  const [shopImage, setShopImage] = useState(profile?.shopImage || '');
  const [specialties, setSpecialties] = useState(profile?.specialties || '');
  const [baseQuote, setBaseQuote] = useState(profile?.baseQuote || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Geocode when location changes (debounced)
  useEffect(() => {
    if (!location.trim() || location.trim().length < 4) {
      setCoords(null);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await inferVenueCoordinates(location);
      setCoords(result);
    }, 800);
    return () => clearTimeout(timer);
  }, [location]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, location, socials, shopImage, specialties, baseQuote: Number(baseQuote), coordinates: coords });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
          <Store className="w-6 h-6 text-[var(--accent-color)]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[var(--text-color)] uppercase tracking-widest">Shop Profile</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Appear on the CaterFlow map and get recommended to customers</p>
        </div>
      </div>

      <div className="admin-card p-8 space-y-6">
        {/* Shop Name */}
        <div className="space-y-2">
          <label className="admin-label">
            <Store className="w-3 h-3" /> Shop Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full admin-input"
            placeholder="e.g. Gourmet Manila Events"
          />
        </div>

        {/* Socials / Verification Link */}
        <div className="space-y-2">
          <label className="admin-label">
            <Globe className="w-3 h-3" /> Website / Socials (FB/IG)
          </label>
          <input
            value={socials}
            onChange={e => setSocials(e.target.value)}
            className="w-full admin-input"
            placeholder="facebook.com/your-catering"
          />
        </div>

        {/* Shop Image */}
        <div className="space-y-2">
          <label className="admin-label">
            <Camera className="w-3 h-3" /> Shop Photo URL
          </label>
          <input
            value={shopImage}
            onChange={e => setShopImage(e.target.value)}
            className="w-full admin-input"
            placeholder="https://images.unsplash.com/..."
          />
          {shopImage && (
            <div className="mt-3 h-40 w-full overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-inner">
              <img src={shopImage} alt="Shop preview" className="w-full h-full object-cover opacity-80" />
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="admin-label">
            <MapPin className="w-3 h-3" /> Location / Address
          </label>
          <div className="relative">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full admin-input pl-11"
              placeholder="City, District (e.g. BGC Taguig)"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Interactive Map */}
        <div className="space-y-3">
          <label className="admin-label">📍 Pin Your Shop on the Map</label>
          <div className="h-64 overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-inner z-0 relative">
            <MapContainer center={coords ? [coords.lat, coords.lng] : [14.5995, 120.9842]} zoom={coords ? 15 : 11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <InteractiveMarker position={coords} setPosition={setCoords} name={name} location={location} />
            </MapContainer>
          </div>
          <div className="flex items-center justify-between">
             <p className="text-[9px] text-[var(--accent-color)] font-bold flex items-center gap-1 uppercase tracking-widest">
               <ShieldCheck className="w-3 h-3" /> {coords ? 'Verified Address on Map' : 'Click map to pin location'}
             </p>
             {coords && <p className="text-[9px] text-slate-500 font-mono">Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</p>}
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <label className="admin-label">
            <Utensils className="w-3 h-3" /> Specialties
          </label>
          <textarea
            value={specialties}
            onChange={e => setSpecialties(e.target.value)}
            className="w-full admin-input h-24 resize-none"
            placeholder="Filipino Fusion, Corporate Buffet, Halal, Vegan options…"
          />
        </div>

        {/* Base Quote */}
        <div className="space-y-2">
          <label className="admin-label">
            <DollarSign className="w-3 h-3" /> Starting Quote (PHP / pax)
          </label>
          <input
            type="number"
            value={baseQuote}
            onChange={e => setBaseQuote(e.target.value)}
            className="w-full admin-input"
            placeholder="1200"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full min-h-[60px] admin-button-primary mt-4 flex items-center justify-center gap-3 transition-all ${
            saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : ''
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? 'Saved Successfully ✓' : 'Update Shop Profile'}
        </button>
      </div>
    </motion.div>
  );
}
