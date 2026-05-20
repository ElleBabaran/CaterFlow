import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, CheckCircle2 } from 'lucide-react';
import {
  buildOrderPublicUrl,
  getLoopbackQrHint,
  getPublicAppBaseUrl,
  getStoredPublicAppUrl,
  isQrUrlLoopback,
  setStoredPublicAppUrl,
} from '../../utils/publicUrl';

export function QrPublicUrlField({
  orderId,
  onUrlChange,
}: {
  orderId: string;
  onUrlChange?: (url: string) => void;
}) {
  const [loopback, setLoopback] = useState(isQrUrlLoopback());
  const [draft, setDraft] = useState(getStoredPublicAppUrl() || getLoopbackQrHint());
  const [activeBase, setActiveBase] = useState(getPublicAppBaseUrl());

  useEffect(() => {
    onUrlChange?.(buildOrderPublicUrl(orderId));
  }, [orderId, onUrlChange]);

  const save = () => {
    setStoredPublicAppUrl(draft);
    setActiveBase(getPublicAppBaseUrl());
    setLoopback(isQrUrlLoopback());
    onUrlChange?.(buildOrderPublicUrl(orderId));
  };

  // Non-loopback: show a green "ready" banner so user can see the active URL
  if (!loopback) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
            QR Ready for Mobile
          </p>
        </div>
        <p className="text-[10px] text-emerald-900/80 font-medium leading-relaxed break-all">
          Scanning will open:{' '}
          <span className="font-mono font-bold">{activeBase}?orderId={orderId}</span>
        </p>
        <p className="text-[9px] text-emerald-700/70 font-medium">
          Make sure your phone is on the same WiFi network as this PC.
        </p>
      </div>
    );
  }

  // Loopback: show the amber edit panel
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
            QR will not work on localhost
          </p>
          <p className="text-[10px] text-amber-900/80 mt-1 leading-relaxed font-medium">
            Phones cannot open localhost. Enter your PC's LAN IP below, or set{' '}
            <span className="font-mono">VITE_PUBLIC_APP_URL</span> in .env.
          </p>
        </div>
      </div>
      <label className="block space-y-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          Public link for QR
        </span>
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={getLoopbackQrHint()}
          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-emerald-500"
        />
      </label>
      <button
        type="button"
        onClick={save}
        className="w-full py-2.5 rounded-xl bg-amber-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-900 transition-colors"
      >
        Apply to QR
      </button>
      <p className="text-[9px] text-amber-800/70 font-medium">
        Tip: Your LAN IP is likely <span className="font-mono">192.168.0.100</span>. Use port 3000 (e.g. http://192.168.0.100:3000).
      </p>
    </div>
  );
}
