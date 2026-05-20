import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'motion/react';
import {
  QrCode,
  Download,
  ExternalLink,
  CheckCircle2,
  Smartphone,
  Users,
  DollarSign,
  Clock,
  ChefHat,
  Calendar,
  MapPin,
} from 'lucide-react';
import { calculateOrderFinance, estimateCookingMinutes, formatCurrencyAmount } from '../../services/budget';
import { buildOrderPublicUrl } from '../../utils/publicUrl';
import { QrPublicUrlField } from './QrPublicUrlField';

interface OrderQRProps {
  orderId: string;
  orderData?: any;
}

export const OrderQR: React.FC<OrderQRProps> = ({ orderId, orderData }) => {
  const [publicUrl, setPublicUrl] = useState(() => buildOrderPublicUrl(orderId));

  useEffect(() => {
    setPublicUrl(buildOrderPublicUrl(orderId));
  }, [orderId]);

  // Derive finance and cooking summaries from orderData if available
  const menu: any[] = orderData?.menu || [];
  const event: any = orderData?.event || {};
  const pricing: any = orderData?.pricing || {};
  const guests = Math.max(1, Number(event?.guest_count || event?.guests || orderData?.finance?.guestCount || 1));

  const finance = orderData?.finance ?? calculateOrderFinance(menu, guests, event?.budget || '', pricing);
  const cooking = orderData?.cooking ?? estimateCookingMinutes(menu, guests);

  const currency = finance?.currency || 'PHP';
  const formatAmt = (n: number) => formatCurrencyAmount(n, currency);

  const summaryTiles = [
    {
      icon: Users,
      label: 'Guests',
      value: String(guests),
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      icon: DollarSign,
      label: 'Est. Total',
      value: finance?.estimatedTotal > 0 ? formatAmt(finance.estimatedTotal) : (pricing?.optimized_quote || 'TBD'),
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      icon: DollarSign,
      label: 'Per Guest',
      value: finance?.totalPerGuest > 0 ? formatAmt(finance.totalPerGuest) : 'TBD',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      icon: Clock,
      label: 'Cook Time',
      value: cooking?.totalMinutes > 0 ? `${cooking.totalMinutes} min` : 'TBD',
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
  ].filter(t => t.value && t.value !== 'TBD' && t.value !== '1');

  const handleDownloadQR = () => {
    const canvas = document.getElementById('order-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `caterflow-order-${orderId.slice(-6)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-2xl max-w-lg mx-auto space-y-8"
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order Finalized!</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Digital Receipt · #{orderId.slice(-6).toUpperCase()}
        </p>
      </div>

      {/* Event quick-info */}
      {(event?.event_type || event?.event_date || event?.event_location) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {event.event_type && (
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-600">
              <ChefHat className="w-3 h-3" /> {event.event_type}
            </span>
          )}
          {event.event_date && (
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-600">
              <Calendar className="w-3 h-3" /> {event.event_date}
            </span>
          )}
          {event.event_location && (
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-600">
              <MapPin className="w-3 h-3" /> {event.event_location}
            </span>
          )}
        </div>
      )}

      {/* Summary tiles */}
      {summaryTiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {summaryTiles.map((tile, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-center">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mx-auto mb-2 ${tile.color}`}>
                <tile.icon className="w-4 h-4" />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{tile.label}</p>
              <p className="text-sm font-black text-slate-900 font-mono truncate">{tile.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Menu list (compact) */}
      {menu.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Confirmed Menu ({menu.length} dishes)
          </p>
          {menu.slice(0, 5).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 truncate">{item.dish}</span>
              <span className="font-mono text-slate-400 ml-2 flex-shrink-0">
                {item.price ? item.price : ''}
              </span>
            </div>
          ))}
          {menu.length > 5 && (
            <p className="text-[9px] text-slate-400 font-bold">+{menu.length - 5} more dishes</p>
          )}
        </div>
      )}

      <QrPublicUrlField orderId={orderId} onUrlChange={setPublicUrl} />

      {/* QR Code */}
      <div className="relative p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group text-center">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl inline-block transition-transform duration-500 group-hover:scale-105">
          <QRCodeCanvas
            id="order-qr-canvas"
            value={publicUrl}
            size={180}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: 'https://ui-avatars.com/api/?name=CF&background=10b981&color=fff',
              x: undefined,
              y: undefined,
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
        </div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          Scan to view full order receipt on mobile
        </p>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500 opacity-40" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500 opacity-40" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500 opacity-40" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500 opacity-40" />
      </div>

      {/* Info callout */}
      <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
        <Smartphone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-[10px] text-left font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
          Finalized order securely encoded. <br />
          Share this QR with the event coordinator or catering staff.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => window.open(publicUrl, '_blank')}
          className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <ExternalLink className="w-4 h-4" />
          Open Receipt
        </button>
        <button
          onClick={handleDownloadQR}
          className="p-4 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 hover:text-slate-700"
          title="Download QR"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
        <QrCode className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Verified by CaterFlow · Order #{orderId.slice(-6).toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
};
