import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Download, 
  Share2, 
  Smartphone,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface OrderQRProps {
  orderId: string;
  orderData: any;
}

export const OrderQR: React.FC<OrderQRProps> = ({ orderId, orderData }) => {
  const publicUrl = `${window.location.origin}?orderId=${orderId}`;

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-2xl max-w-md mx-auto text-center space-y-8">
      <div className="space-y-2">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Digital Receipt QR</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Scan to view order details on mobile</p>
      </div>

      <div className="relative p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl inline-block transition-transform duration-500 group-hover:scale-105">
          <QRCodeSVG 
            value={publicUrl} 
            size={180}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "https://ui-avatars.com/api/?name=CF&background=10b981&color=fff",
              x: undefined,
              y: undefined,
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
        </div>
        
        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500 opacity-40" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500 opacity-40" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500 opacity-40" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500 opacity-40" />
      </div>

      <div className="space-y-4">
        <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
          <Smartphone className="w-5 h-5 text-emerald-600" />
          <p className="text-[10px] text-left font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
            Finalized Order Securely Encoded. <br />
            Share this QR with the event coordinator.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => window.open(publicUrl, '_blank')}
            className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Open Link
          </button>
          <button className="p-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified by CaterFlow Security</span>
      </div>
    </div>
  );
};
