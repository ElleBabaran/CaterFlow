import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  ChefHat,
  Users,
  MapPin,
  Calendar,
  Utensils,
  AlertCircle,
  Coffee,
  Package,
  Truck,
  Star,
  Timer,
} from 'lucide-react';
import { estimateCookingMinutes } from '../../services/budget';

interface StaffTask {
  text?: string;
  time?: string;
  activity?: string;
  completed: boolean;
}

interface StaffTaskBoardProps {
  tasks: StaffTask[];
  onToggle: (index: number) => void;
  menu?: any[];
  guestCount?: number;
  logisticsTimeline?: any[];
  eventData?: any;
  assignedOrders?: any[];
  onSelectOrder?: (order: any) => void;
}

export function StaffTaskBoard({
  tasks,
  onToggle,
  menu = [],
  guestCount = 0,
  logisticsTimeline = [],
  eventData = {},
  assignedOrders = [],
  onSelectOrder,
}: StaffTaskBoardProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'cooking' | 'brief'>('roster');

  const deliveryReadyOrders = (assignedOrders || []).filter(o => o.status === 'delivery_approved' || o.eventData?.delivery_status === 'transit' || o.eventData?.delivery_status === 'prep');

  const guests = Math.max(1, Number(guestCount) || Number(eventData?.guest_count) || 1);
  const cooking = estimateCookingMinutes(menu, guests);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const eventBriefItems = [
    { label: 'Event Type', value: eventData?.event_type || '--', icon: Star, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Guests', value: String(guests), icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Date', value: eventData?.event_date || '--', icon: Calendar, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Venue', value: eventData?.event_location || '--', icon: MapPin, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { label: 'Service', value: eventData?.service_style || 'Buffet', icon: Utensils, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: 'Kitchen Lead Time', value: cooking.totalMinutes > 0 ? `${cooking.totalMinutes} min` : '--', icon: Timer, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  ];

  const getCookingPriority = (minutes: number) => {
    if (minutes >= 60) return { label: 'High Priority', color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (minutes >= 35) return { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Quick Prep', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Staff Operations</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Kitchen &amp; Service task synchronization
            </p>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">{progressPct}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                progressPct === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : progressPct > 50
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-slate-400 to-slate-500'
              }`}
            />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {completedCount} of {totalCount} tasks done
          </p>
        </div>
      )}

      {/* Delivery Ready Banner */}
      {deliveryReadyOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] p-5 text-white shadow-xl shadow-emerald-900/20 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Delivery Ready</p>
              <p className="text-sm font-black">{deliveryReadyOrders.length} order{deliveryReadyOrders.length > 1 ? 's' : ''} awaiting dispatch</p>
            </div>
          </div>
          <div className="w-3 h-3 rounded-full bg-white animate-ping" />
        </motion.div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
        {(
          [
            ['roster', 'Duty Roster', ListTodo],
            ['cooking', 'Cooking Plan', Clock],
            ['brief', 'Event Brief', Utensils],
          ] as const
        ).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-md border border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── DUTY ROSTER ── */}
        {activeTab === 'roster' && (
          <motion.div
            key="roster"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Column 1: Assigned Catering Orders */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  Assigned Orders
                </h3>
                <span className="text-[10px] font-black text-emerald-755 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                  {assignedOrders.length} Active
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {assignedOrders.map((order, i) => {
                  const data = order.eventData || {};
                  return (
                    <div 
                      key={order._id || i}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition flex flex-col space-y-3"
                    >
                      <div>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                          Active Agreement
                        </span>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mt-1.5">
                          {data.event_type || "Catering Event"} Order
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{data.event_location || "TBD Address"}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-200/60 pt-2">
                        <span>{data.guest_count || 100} Guests</span>
                        <span className="text-slate-500 font-black">{data.delivery_status || 'Prep'}</span>
                      </div>

                      {onSelectOrder && (
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition active:scale-95"
                        >
                          Manage Delivery Tracking
                        </button>
                      )}
                    </div>
                  );
                })}
                {assignedOrders.length === 0 && (
                  <div className="py-12 text-center text-slate-300 italic text-xs uppercase tracking-widest">
                    No active shop orders assigned
                  </div>
                )}
              </div>
            </div>

            {/* Active tasks (Column 2) */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Active Assignments
                </h3>
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100">
                  {tasks.filter((t) => !t.completed).length} Pending
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map((task, idx) => {
                  const label =
                    task.text ||
                    [task.time, task.activity].filter(Boolean).join(' — ') ||
                    'Staff task';
                  return (
                    <button
                      key={idx}
                      onClick={() => onToggle(idx)}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group ${
                        task.completed
                          ? 'bg-slate-50 border-slate-100 opacity-60'
                          : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      <div
                        className={`mt-0.5 transition-colors flex-shrink-0 ${
                          task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-amber-500'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-bold leading-relaxed ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="py-12 text-center text-slate-300 italic text-xs uppercase tracking-widest">
                    No tasks assigned for this shift
                  </div>
                )}
              </div>
            </div>

            {/* Shift Briefing */}
            <div className="space-y-4">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  Shift Briefing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {eventData?.service_style
                    ? `Service style is ${eventData.service_style}.`
                    : 'Maintain standard food safety protocols.'}{' '}
                  All prep must be finalized{' '}
                  {cooking.totalMinutes > 0
                    ? `at least ${Math.ceil(cooking.totalMinutes / 60)}h`
                    : '2 hours'}{' '}
                  before event start. Coordinate with delivery team for weighted procurement handoff.
                  {eventData?.dietary_needs && eventData.dietary_needs !== 'None'
                    ? ` Note dietary restrictions: ${eventData.dietary_needs}.`
                    : ''}
                </p>
              </div>

              {eventData?.staffing_needs && (
                <div className="bg-amber-600 rounded-[2rem] p-6 shadow-xl shadow-amber-600/20 text-white">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Staffing Requirement
                  </h3>
                  <p className="text-lg font-black leading-tight uppercase tracking-tight">
                    "{eventData.staffing_needs}"
                  </p>
                </div>
              )}

              {logisticsTimeline.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    Logistics Timeline
                  </h3>
                  <div className="space-y-3 border-l-2 border-amber-100 pl-4 ml-1">
                    {logisticsTimeline.slice(0, 5).map((item: any, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                        <p className="text-[10px] font-black text-amber-700 font-mono uppercase tracking-widest">
                          {item.time || `Stop ${i + 1}`}
                        </p>
                        <p className="text-xs font-semibold text-slate-600">{item.activity || item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── COOKING PLAN ── */}
        {activeTab === 'cooking' && (
          <motion.div
            key="cooking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {cooking.totalMinutes > 0 ? (
              <>
                {/* Summary header */}
                <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-amber-700/30 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-y-4 translate-x-4">
                    <Clock className="w-48 h-48" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">
                    Estimated Kitchen Lead Time
                  </p>
                  <p className="text-5xl font-black tracking-tight mb-1">{cooking.totalMinutes} min</p>
                  <p className="text-sm font-bold opacity-70">
                    {guests} guests · {cooking.items.length} dishes
                  </p>
                </div>

                {/* Per-dish cooking timeline */}
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-900 px-8 py-5 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      Per-Dish Prep Schedule
                    </h3>
                    <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {guests} guests
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {cooking.items.map((item, i) => {
                      const priority = getCookingPriority(item.minutes);
                      const barWidth = Math.min(100, Math.round((item.minutes / cooking.totalMinutes) * 100));
                      return (
                        <div key={i} className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate">{item.dish}</p>
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${priority.color}`}
                            >
                              {priority.label}
                            </span>
                            <span className="text-lg font-black text-amber-700 font-mono w-20 text-right">
                              {item.minutes} min
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-8 py-5 bg-amber-50 border-t border-amber-100 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                      Total Kitchen Lead Time
                    </span>
                    <span className="text-xl font-black text-amber-900 font-mono">
                      {cooking.totalMinutes} min
                    </span>
                  </div>
                </div>

                {/* Cooking tip */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">
                      Kitchen Tip
                    </p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      Start high-priority dishes first. Dishes marked{' '}
                      <span className="font-black text-rose-600">High Priority</span> require 60+ min prep —
                      begin these immediately upon shift start.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center shadow-sm">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  No menu data yet
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  Cooking time estimates appear after the AI planner generates a menu
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── EVENT BRIEF ── */}
        {activeTab === 'brief' && (
          <motion.div
            key="brief"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {eventBriefItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-3"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Menu assigned to kitchen */}
            {menu.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-900 px-8 py-5 flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Menu for This Event
                  </h3>
                  <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {menu.length} dishes
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {menu.map((dish: any, i: number) => {
                    const cookInfo = cooking.items.find((c) => c.dish === dish.dish);
                    return (
                      <div key={i} className="flex items-center gap-5 px-8 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{dish.dish}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {dish.category || dish.tags?.[0] || 'Main'} · {dish.portion_per_guest || 'Standard portion'}
                          </p>
                        </div>
                        {cookInfo && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full uppercase tracking-widest flex-shrink-0">
                            {cookInfo.minutes} min
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dietary note */}
            {eventData?.dietary_needs && eventData.dietary_needs !== 'None' && (
              <div className="bg-rose-50 rounded-[2rem] border border-rose-200 p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-1">
                    Dietary Restrictions — Kitchen Alert
                  </p>
                  <p className="text-sm font-bold text-rose-800 leading-relaxed">{eventData.dietary_needs}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
