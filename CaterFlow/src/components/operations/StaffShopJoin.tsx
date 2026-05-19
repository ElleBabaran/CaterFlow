import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Key, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { mongoService } from '../../services/mongodb';

export function StaffShopJoin({ onJoined, userName }: { onJoined: (shopId: string) => void, userName: string }) {
  const [pin, setPin] = useState('');
  const [roleInfo, setRoleInfo] = useState('Logistics / Delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!pin || pin.length < 6) {
      setError('Please enter a valid 6-digit PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await mongoService.linkShop(pin, userName, roleInfo);
      if (response && response.shopId) {
        onJoined(response.shopId);
      } else {
        // Assume success if no error was thrown, even if shopId isn't explicitly returned
        onJoined('linked');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link to shop. Check the PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 max-w-md w-full shadow-2xl shadow-emerald-900/5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
          <Store className="w-8 h-8" />
        </div>
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join a Shop</h2>
          <p className="text-sm font-medium text-slate-500">
            Enter the PIN provided by your shop admin to link your staff account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-800 leading-tight">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Key className="w-3 h-3 text-emerald-500" /> Admin Shop PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Your Role
            </label>
            <input
              type="text"
              value={roleInfo}
              onChange={(e) => setRoleInfo(e.target.value)}
              placeholder="e.g. Driver, Chef"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || pin.length < 6}
            className="w-full bg-emerald-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link Account'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
