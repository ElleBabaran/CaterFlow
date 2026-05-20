import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ChefHat, 
  Info,
  Clock,
  Utensils,
  Truck
} from 'lucide-react';
import { calculateOrderFinance, estimateCookingMinutes, formatCurrencyAmount } from '../../services/budget';
import { CustomerTrackingMap } from '../operations/CustomerTrackingMap';



export const PublicOrderView: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/public/orders/${orderId}`);
        if (!response.ok) throw new Error("Order not found");
        setOrder(await response.json());
      } catch (err) {
        console.error("Failed to fetch public order:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500">
        <Info className="w-10 h-10" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase">Invalid Order</h1>
        <p className="text-slate-400 mt-2">The QR code you scanned is either expired or incorrect.</p>
      </div>
    </div>
  );

  const { menu = [], event = {}, pricing = {}, logistics = {} } = order;
  const guests = Number(event?.guest_count || event?.guests || 1);
  const finance = calculateOrderFinance(menu, guests, event?.budget || "", pricing);
  const cooking = estimateCookingMinutes(menu, guests);
  const formatAmt = (value: number) => formatCurrencyAmount(value, finance.currency);
  const staffTasks = [
    ...(logistics?.timeline || []).slice(0, 4).map((item: any) => `${item.time || 'Prep'} - ${item.activity || item.text || 'Kitchen task'}`),
    ...(event?.staffing_needs ? [`Staffing: ${event.staffing_needs}`] : []),
  ].slice(0, 5);

  const deliveryApproved = order.status === 'delivery_approved';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order Verified</h1>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Receipt #{orderId.slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatTile icon={Calendar} label="Event Date" value={event?.event_date || 'TBD'} color="bg-blue-50 text-blue-600" />
          <StatTile icon={Users} label="Guest Count" value={String(guests || 0)} color="bg-amber-50 text-amber-600" />
          <StatTile icon={MapPin} label="Location" value={event?.event_location || 'Venue'} color="bg-rose-50 text-rose-600" />
          <StatTile icon={ShoppingBag} label="Total Value" value={finance.estimatedTotal > 0 ? formatAmt(finance.estimatedTotal) : 'TBD'} color="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile icon={ShoppingBag} label="Per Guest" value={finance.totalPerGuest > 0 ? formatAmt(finance.totalPerGuest) : 'TBD'} color="bg-slate-50 text-slate-600" />
          <StatTile icon={Clock} label="Cooking Time" value={cooking.totalMinutes > 0 ? `${cooking.totalMinutes} min` : 'TBD'} color="bg-amber-50 text-amber-600" />
          <StatTile icon={CheckCircle2} label="Status" value={String(order.status || 'planned').toUpperCase()} color="bg-emerald-50 text-emerald-600" />
        </div>

        {/* Delivery Tracking Map (if approved) */}
        {deliveryApproved && (
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-10 py-8 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1">Live Tracking</p>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Delivery in Progress</h3>
              </div>
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="h-64 sm:h-[450px] w-full relative">
              <CustomerTrackingMap 
                status={order.status}
                venueLocation={event?.event_location || order.deliveryLocation || 'Manila'}
              />
            </div>
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100">
               <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Driver dispatched and currently en route to {event?.event_location || order.deliveryLocation || 'your location'}.
               </p>
            </div>
          </div>
        )}

        {/* Food List */}
        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Catering Blueprint</p>
              <h3 className="text-xl font-black uppercase tracking-tight">Food & Beverage List</h3>
            </div>
            <Utensils className="w-6 h-6 text-emerald-400 opacity-50" />
          </div>
          <div className="p-8 space-y-6">
            {menu?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-start group">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                    <span className="text-lg font-black">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-none">{item.dish}</h4>
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Qty: {item.quantity || 1} x {item.portion_per_guest || 'Standard'}</p>
                    <p className="text-[10px] text-amber-600 mt-1 font-black uppercase tracking-widest">
                      Cook: {cooking.items.find((estimate) => estimate.dish === item.dish)?.minutes || '--'} min
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">
                    {formatAmt((finance.lines.find((line) => line.dish === item.dish)?.lineTotal || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex flex-col items-center">
             <div className="w-16 h-1 bg-slate-200 rounded-full mb-6" />
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center max-w-xs leading-relaxed">
               This is a digital record generated by CaterFlow. <br />
               Please present this screen to the catering staff for verification.
             </p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-10 py-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1">Staff Segment</p>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Kitchen & Service Tasks</h3>
            </div>
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="p-8 space-y-3">
            {staffTasks.length > 0 ? staffTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{task}</p>
              </div>
            )) : (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-6">No staff tasks listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-800 truncate">{value}</p>
    </div>
  </div>
);
