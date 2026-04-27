/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ChefHat, 
  Package, 
  Truck, 
  DollarSign, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  Utensils,
  AlertCircle,
  Mic,
  MicOff,
  LogOut,
  History,
  CloudRain,
  ShieldCheck,
  Search,
  Droplets,
  Sun,
  Moon
} from 'lucide-react';
import { auth, signInWithGoogle, logout, db, loginWithEmail, signupWithEmail } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { orchestrateCatering, predictWeather } from './services/orchestrator';

interface AgentStep {
  agent: string;
  data: any;
}

interface Message {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  agent?: string;
  timestamp: Date;
}

const QUESTIONS = [
  { key: "event_type", text: "👋 Hi! I'm your AI Catering Assistant. What type of event are you planning? (e.g. Wedding, Birthday, Corporate)" },
  { key: "guest_count", text: "👥 How many guests are you expecting?" },
  { key: "event_location", text: "📍 Where will the event be held? (City or venue name)" },
  { key: "event_date", text: "📅 What is the event date?" },
  { key: "budget", text: "💰 What is your total budget? (Please include the currency, e.g. $5000, ₱50000, 1000€)" },
  { key: "cuisine_preference", text: "🍽️ Any cuisine preference? (e.g. Filipino, Italian, Japanese, BBQ)" },
  { key: "dietary_needs", text: "🥗 Any dietary needs or restrictions? (e.g. None, Vegetarian, Allergies)" },
  { key: "dessert_preference", text: "🍰 Would you like to include desserts in the menu? (Yes/No, or specific types)" },
  { key: "drink_preference", text: "🥤 What are your preferences for drinks? (e.g. Soft drinks, Juices, Cocktails, Coffee)" },
  { key: "special_requests", text: "✨ Any final special requests? (e.g. Themed setup, specific equipment)" },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [eventData, setEventData] = useState<any>({});
  const [isChatting, setIsChatting] = useState(true);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchHistory(u.uid);
        // Start conversation if empty
        if (messages.length === 0) {
          setMessages([{ id: 'bot-start', role: 'bot', content: QUESTIONS[0].text, timestamp: new Date() }]);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [messages.length]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'events'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const hist = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(hist);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    const currentQuestion = QUESTIONS[qIndex];
    
    // Add user message
    const newMessages: Message[] = [...messages, { 
      id: `user-${Date.now()}`,
      role: 'user', 
      content: userText, 
      timestamp: new Date() 
    }];
    setMessages(newMessages);
    setInput("");

    // Update event data
    let refinedAmount = userText;
    const currencyRegex = /[\$\£\€\¥\₱\₹]|(USD|PHP|EUR|GBP|AED|CAD|AUD|JPY|CNY|PESO|PESOS)/i;
    
    if (currentQuestion.key === 'budget' && eventData.budget && !currencyRegex.test(eventData.budget)) {
      // If we are clarifying currency, join them
      if (currencyRegex.test(userText) || /^\w{3}$/.test(userText)) {
        refinedAmount = `${eventData.budget} ${userText}`;
      }
    }

    const newEventData = { ...eventData, [currentQuestion.key]: refinedAmount };

    // Validation for Budget Currency
    if (currentQuestion.key === 'budget') {
      const hasCurrency = currencyRegex.test(refinedAmount);
      if (!hasCurrency && /^\d+$/.test(refinedAmount.replace(/[,. ]/g, ''))) {
        setMessages([...newMessages, { 
          id: `bot-currency-${Date.now()}`,
          role: 'bot', 
          content: "I've noted the amount! Just to be precise, which currency are you using? (e.g., $, ₱, USD, PHP, Pesos)", 
          timestamp: new Date() 
        }]);
        return; // Don't advance to next question
      }
    }

    setEventData(newEventData);

    if (qIndex < QUESTIONS.length - 1) {
      const nextIdx = qIndex + 1;
      setIsProcessing(true);

      // Check if we just answered location or date, and if we have both, check weather
      let botMessage = QUESTIONS[nextIdx].text;
      
      if (currentQuestion.key === 'event_location' || currentQuestion.key === 'event_date') {
        const loc = newEventData.event_location;
        const dat = newEventData.event_date;
        if (loc && dat) {
          try {
            const weather = await predictWeather(loc, dat);
            if (weather && weather.summary) {
              setMessages(prev => [...prev, { 
                role: 'bot', 
                content: `🌦️ Weather Forecast: ${weather.summary}. Risk Level: ${weather.risk_level.toUpperCase()}. With this info, we will decide what food should we suggest!`, 
                timestamp: new Date() 
              }]);
              // Also store it for orchestration
              setEventData(prev => ({ ...prev, weather_data: weather }));
            }
          } catch (err) {
            console.error("Chat weather error:", err);
          }
        }
      }

      setTimeout(() => {
        setQIndex(nextIdx);
        setMessages(prev => [...prev, { 
          id: `bot-q-${Date.now()}`,
          role: 'bot', 
          content: botMessage, 
          timestamp: new Date() 
        }]);
        setIsProcessing(false);
      }, 800);
    } else {
      // End of questions - Trigger Orchestration
      setIsChatting(false);
      setIsProcessing(true);
      setSteps([]);
      setCurrentStepIndex(-1);

      const fullPrompt = Object.entries(newEventData)
        .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
        .join(', ');

      setMessages(prev => [...prev, { 
        id: `sys-proc-${Date.now()}`,
        role: 'system', 
        content: "🤖 Activating all AI agents. Collaboration in progress...", 
        timestamp: new Date() 
      }]);

      try {
        const result = await orchestrateCatering(fullPrompt, (step) => {
          setSteps(prev => [...prev, step]);
          setCurrentStepIndex(prev => prev + 1);
        });

        if (result && result.clarification_required) {
          setMessages(prev => [...prev, { 
            id: `bot-clarification-${Date.now()}`,
            role: 'bot', 
            content: result.message, 
            timestamp: new Date() 
          }]);
          setIsProcessing(false);
          setIsChatting(true);
          return;
        }
        
        if (result.success) {
          if (user) {
            await addDoc(collection(db, 'events'), {
              userId: user.uid,
              rawInput: fullPrompt,
              steps: [
                { agent: "Customer Interaction Agent", data: result.data.customer },
                { agent: "Dietary & Allergens Agent", data: result.data.dietary },
                { agent: "Weather Intelligence Agent", data: result.data.weather },
                { agent: "Menu Planning Agent", data: result.data.menu },
                { agent: "Inventory & Procurement Agent", data: result.data.inventory },
                { agent: "Logistics Planning Agent", data: result.data.logistics },
                { agent: "Pricing & Optimization Agent", data: result.data.pricing },
                { agent: "Monitoring Agent", data: result.data.monitoring }
              ],
              createdAt: Timestamp.now()
            });
            fetchHistory(user.uid);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const loadFromHistory = (item: any) => {
    setSteps(item.steps);
    setIsChatting(false);
    setShowHistory(false);
    setCurrentStepIndex(item.steps.length);
  };
  
  const restartChat = () => {
    setMessages([{ role: 'bot', content: QUESTIONS[0].text, timestamp: new Date() }]);
    setQIndex(0);
    setEventData({});
    setIsChatting(true);
    setSteps([]);
    setCurrentStepIndex(-1);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        await signupWithEmail(email, password, name);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden cyber-grid transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-violet-500/30 p-8 shadow-[0_0_30px_rgba(139,92,246,0.1)] z-10 space-y-6 theme-shadow"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-violet-600/20 rounded-none border border-violet-500/30 mb-2 relative group">
              <ChefHat className="w-8 h-8 text-violet-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-violet-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
            </div>
            <h1 className="text-3xl font-bold tracking-[0.2em] font-mono neon-text-violet">CATER-AI</h1>
            <p className="text-violet-400/60 text-[10px] uppercase tracking-widest font-bold">Neural Ops Infrastructure</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-violet-500/60 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="EX: JOHN DOE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-violet-500/20 rounded-none px-4 py-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none font-mono"
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-violet-500/60 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="USER@DOMAIN.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-violet-500/20 rounded-none px-4 py-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-violet-500/60 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-violet-500/20 rounded-none px-4 py-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none font-mono"
                required
              />
            </div>
            
            {authError && (
              <p className="text-[9px] text-pink-400 bg-pink-400/5 p-2 border border-pink-400/20 font-mono uppercase">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all active:scale-[0.98] shadow-lg shadow-violet-600/20 uppercase text-xs tracking-widest"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
            >
              {authMode === 'login' ? 'Secure Login' : 'Create Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-violet-500/20"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em]"><span className="bg-[#0a0510] px-3 text-violet-500/40 font-bold">Alternative Access</span></div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full py-3 bg-white/5 border border-violet-500/20 text-white rounded-none font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] font-mono text-xs uppercase tracking-widest"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale contrast-200" alt="Google" />
            Continue with Google
          </button>

          <p className="text-center text-[10px] text-violet-500/40 uppercase tracking-widest font-bold">
            {authMode === 'login' ? "New operator?" : "Already registered?"}{" "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-violet-400 font-bold hover:text-white transition-colors underline decoration-violet-500/30"
            >
              {authMode === 'login' ? 'Sign Up' : 'Return to Login'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden cyber-grid transition-colors duration-300">
      {/* Header */}
      <header className="h-14 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-violet-500/20 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-violet-600 rounded-none flex items-center justify-center font-bold text-lg shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}>C</div>
          <h1 className="text-sm font-bold tracking-[0.2em] font-mono neon-text-violet">CATER-AI <span className="text-violet-400/40 font-normal text-[10px] ml-2 uppercase tracking-[0.3em] hidden sm:inline">Multi-Agent Protocol</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-none hover:bg-violet-600/20 text-violet-500/60 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-none transition-all ${showHistory ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'hover:bg-violet-600/20 text-violet-400/60'}`}
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 bg-black border border-violet-500/20 px-3 py-1 rounded-none shadow-[inset_0_0_10px_rgba(139,92,246,0.1)]">
            <span className={`w-1.5 h-1.5 rounded-none rotate-45 ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]'}`}></span>
            <span className="text-[9px] font-mono uppercase tracking-tighter text-violet-400/80">Kernel {isProcessing ? 'Processing' : 'Idle'}</span>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-violet-500/20">
            <img src={user.photoURL || ''} className="w-6 h-6 rounded-none border border-violet-500/20 grayscale hover:grayscale-0 transition-all" alt="User" />
            <button onClick={logout} className="text-violet-400/40 hover:text-pink-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden relative">
        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-y-4 left-4 w-72 bg-black/90 backdrop-blur-xl rounded-none z-30 border border-violet-500/30 overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
            >
              <div className="p-4 border-b border-violet-500/10 flex items-center justify-between bg-violet-950/20">
                <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-violet-400">Memory Modules</h3>
                <button onClick={() => setShowHistory(false)} className="text-violet-400/40 hover:text-violet-400 transition-all">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 border border-violet-500/10 hover:border-violet-500/40 bg-white/5 hover:bg-violet-600/10 transition-all group"
                  >
                    <p className="text-[10px] font-bold text-violet-100 truncate mb-1 group-hover:text-violet-400 transition-colors uppercase font-mono">{item.rawInput}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-violet-500/60 uppercase font-bold tracking-tighter">
                        {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                      <span className="text-[8px] px-1 bg-violet-500/20 text-violet-400 font-mono italic">#{item.steps?.length}A</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Control Panel: Chat Interface */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4 overflow-hidden">
          <div className="high-density-card flex-1 flex flex-col min-h-[400px]">
            <div className="high-density-header flex justify-between items-center">
              <h2 className="high-density-label">Staff Uplink</h2>
              <button onClick={restartChat} className="text-[9px] font-bold text-violet-400 hover:text-white uppercase tracking-widest bg-violet-600/20 px-2 py-0.5 border border-violet-500/20">Purge</button>
            </div>
            
            {/* Chat Bubble Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40" ref={chatScrollRef} style={{ backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 0)', backgroundSize: '10px 10px' }}>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[85%] px-3 py-2 text-[11px] leading-relaxed relative
                      ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-none shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 
                        msg.role === 'system' ? 'bg-black text-violet-400/60 w-full text-center italic border border-violet-500/20 rounded-none font-mono text-[9px]' :
                        'bg-slate-900 text-slate-100 border border-violet-500/20 rounded-none'}
                    `}>
                      {msg.role === 'user' && <div className="absolute top-0 right-0 w-2 h-2 bg-white/20 translate-x-1/2 -translate-y-1/2 rotate-45" />}
                      {msg.role === 'bot' && <div className="absolute top-0 left-0 w-2 h-2 bg-violet-500 -translate-x-1/2 -translate-y-1/2 rotate-45" />}
                      {msg.content}
                      <div className={`text-[7px] mt-1 opacity-40 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isProcessing && isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-violet-500/20 px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-violet-500 rounded-none rotate-45 animate-bounce"></div>
                      <div className="w-1 h-1 bg-violet-500 rounded-none rotate-45 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-violet-500 rounded-none rotate-45 animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-violet-500/20 bg-black/60">
              <form onSubmit={handleChatSubmit} className="flex flex-col space-y-3">
                <div className="relative flex flex-col group">
                  <textarea
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit(e as any);
                      }
                    }}
                    placeholder={isProcessing ? "ANALYZING..." : "INPUT_VECTOR"}
                    disabled={isProcessing || !isChatting}
                    className="w-full p-3 bg-black text-violet-100 rounded-none text-xs font-mono leading-relaxed border border-violet-500/20 focus:border-violet-500 focus:ring-0 resize-none min-h-[80px] placeholder:text-violet-900 transition-all"
                    required
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-none transition-all ${isListening ? 'bg-pink-600 text-white animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-violet-900/40 text-violet-400 hover:bg-violet-600 hover:text-white'}`}
                    >
                      {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !isChatting}
                      className="p-2 bg-violet-600 text-white rounded-none hover:bg-violet-500 disabled:bg-slate-800 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-1 h-1 bg-violet-500/40"></div>
                  <div className="absolute bottom-0 left-0 w-1 h-1 bg-violet-500/40"></div>
                </div>
              </form>
            </div>
          </div>

          {/* Workflow Status */}
          <div className="high-density-card flex flex-col" style={{ flexBasis: '40%' }}>
            <div className="high-density-header">
              <h2 className="high-density-label">System Kernel Matrix</h2>
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto">
              {[
                { name: 'Customer Interaction', desc: 'Requirement Extraction' },
                { name: 'Dietary & Allergens', desc: 'Constraint Analysis' },
                { name: 'Weather Intelligence', desc: 'Atmospheric Risk' },
                { name: 'Menu Planning', desc: 'Dish Synthesis' },
                { name: 'Inventory & Procurement', desc: 'Resource Sourcing' },
                { name: 'Logistics Planning', desc: 'Protocol Execution' },
                { name: 'Pricing & Optimization', desc: 'Economic Synthesis' },
                { name: 'Safety Monitoring', desc: 'QA Verification' }
              ].map((agent, i) => {
                const isActive = currentStepIndex === i;
                const isCompleted = currentStepIndex > i;
                
                return (
                  <div key={agent.name} className={`flex items-center gap-3 p-1.5 border border-transparent transition-all ${isActive ? 'bg-violet-600/10 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : ''}`}>
                    <div className={`
                      w-4 h-4 text-[8px] flex items-center justify-center flex-shrink-0 font-mono rounded-none rotate-45
                      ${isActive ? 'bg-violet-600 text-white animate-pulse' : ''}
                      ${isCompleted ? 'bg-violet-400 text-black' : 'border border-violet-500/20 text-violet-500/40'}
                    `}>
                      <span className="-rotate-45">{isCompleted ? <CheckCircle2 className="w-2.5 h-2.5" /> : i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[9px] font-bold truncate tracking-widest ${isActive ? 'text-violet-400' : isCompleted ? 'text-violet-100' : 'text-violet-500/30'}`}>
                        {agent.name.toUpperCase()}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Middle Performance Area */}
        <section className="col-span-12 lg:col-span-6 flex flex-col space-y-4 h-[calc(100vh-140px)] min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth custom-scrollbar pb-20" ref={scrollRef}>
            <AnimatePresence mode="popLayout">
              {steps.length === 0 && !isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 bg-white border border-dashed border-slate-200 rounded-lg"
                >
                  <div className="bg-slate-50 p-3 rounded-full mb-3">
                    <ChefHat className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">System Standby</h3>
                  <p className="text-[10px] max-w-xs">Awaiting customer interaction to trigger multi-agent orchestration sequence.</p>
                </motion.div>
              )}

              {/* Final Summary Highlight - Prominent at the top when complete */}
              {steps.length === 8 && (
                <motion.div
                  key="final-summary-highlight"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 text-white space-y-5 shadow-[0_20px_50px_rgba(79,70,229,0.4)] relative overflow-hidden group border border-white/20"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-violet-100/70 text-[9px] uppercase font-bold tracking-[0.2em] font-mono">Mission Sequence Optimal</p>
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase font-mono italic">Strategic Manifest</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 py-5 border-y border-white/10 relative z-10">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">ALLOCATED_BUDGET</span>
                      <p className="text-2xl font-bold font-mono text-emerald-300">{steps[0]?.data.budget}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">IDENTIFIED_GUESTS</span>
                      <p className="text-2xl font-bold font-mono">{steps[0]?.data.guests}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">RISK_PROTOCOL</span>
                      <p className={`text-2xl font-bold font-mono uppercase ${steps[2]?.data.risk_level === 'high' ? 'text-pink-300' : 'text-emerald-300'}`}>{steps[2]?.data.risk_level}</p>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <span className="text-[8px] uppercase font-bold text-violet-200/60 block">INTEGRATED_SUMMARY</span>
                    <p className="text-sm font-medium text-white font-mono leading-relaxed bg-black/20 p-3 border-l-2 border-emerald-400">
                      {steps[7]?.data.final_summary}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Individual Agent Reports */}
              <div key="agent-reports-container" className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={`report-${step.agent}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={steps.length === 8 && index < 6 ? "opacity-50 hover:opacity-100 transition-opacity" : ""}
                  >
                    <AgentReport step={step} />
                  </motion.div>
                ))}
              </div>

              {isProcessing && currentStepIndex >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-slate-900/5 rounded-lg border border-slate-200 flex items-center justify-center gap-3"
                >
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {steps[currentStepIndex]?.agent || 'Orchestrator'} Thinking...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Metrics Panel */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4">
          <div className="high-density-card flex flex-col">
            <div className="high-density-header">
              <h2 className="high-density-label">System Performance</h2>
            </div>
            <div className="p-4 space-y-4">
              {steps.find(s => s.agent === 'Monitoring Agent') ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="border border-violet-500/10 bg-black/40 rounded-none p-2 shadow-[inset_0_0_10px_rgba(139,92,246,0.05)]">
                       <div className="text-sm font-bold text-violet-100 font-mono tracking-tighter">{steps.find(s => s.agent === 'Monitoring Agent')?.data.execution_readiness}%</div>
                       <div className="text-[8px] text-violet-500 uppercase font-bold tracking-widest">Readiness</div>
                    </div>
                    <div className="border border-violet-500/10 bg-black/40 rounded-none p-2 shadow-[inset_0_0_10px_rgba(139,92,246,0.05)]">
                       <div className="text-sm font-bold text-violet-400 font-mono tracking-tighter">{steps.find(s => s.agent === 'Monitoring Agent')?.data.overall_status.toUpperCase()}</div>
                       <div className="text-[8px] text-violet-500 uppercase font-bold tracking-widest">Status</div>
                    </div>
                  </div>
                  <div className="p-3 bg-violet-950/20 rounded-none border border-violet-500/10">
                    <p className="text-[9px] leading-relaxed text-violet-300/80 font-medium font-mono lowercase italic">
                      {steps.find(s => s.agent === 'Monitoring Agent')?.data.final_summary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-violet-900/40 py-12">
                  <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] font-mono">Neural_Scan_Pending</span>
                </div>
              )}
            </div>
          </div>

          <div className="high-density-card flex flex-col">
            <div className="high-density-header">
              <h2 className="high-density-label">Economic Synthesis</h2>
            </div>
            <div className="p-4 flex-1">
              {steps.find(s => s.agent === 'Pricing & Optimization Agent') ? (
                <PricingInsight data={steps.find(s => s.agent === 'Pricing & Optimization Agent')?.data} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-violet-900/40 py-12">
                  <DollarSign className="w-12 h-12 mb-2 opacity-20" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] font-mono">Profit_Analysis_Hold</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-black border border-violet-500/20 p-3 flex-1 flex flex-col text-violet-400 font-mono text-[8px] overflow-hidden shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
            <div className="text-violet-500/40 mb-2 font-bold uppercase tracking-[0.3em] flex justify-between">
              <span>System_Term</span>
              <span className="text-violet-500 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">CYBER_LINK_SECURE</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 opacity-60">
              <div>[00:00:00] KERNEL_INIT: PROTOCOL_CATER_AI_v4.5</div>
              <div>[{new Date().toLocaleTimeString([], { hour12: false })}] UPLINK_ESTABLISHED: USER_{user.uid.slice(0, 8)}</div>
              {steps.map((s, i) => (
                <div key={i}>[{new Date().toLocaleTimeString([], { hour12: false })}] AGENT_{s.agent.toUpperCase().replace(' ', '_')}: SYNC_COMPLETE</div>
              ))}
              {isProcessing && (
                <div className="text-violet-300 animate-pulse">[{new Date().toLocaleTimeString([], { hour12: false })}] ORCHESTRATOR: EXECUTING_CHAIN_LOGIC...</div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="h-10 bg-black border-t border-violet-500/20 px-6 flex items-center justify-between text-[8px] text-violet-500/40 font-bold uppercase tracking-[0.4em] flex-shrink-0 z-20">
        <div>© 2024 CATER-AI NEURAL OPS v4.5</div>
        <div className="flex items-center space-x-6">
          <span className="hidden sm:inline">CORE: GEMINI_3_FLASH_PREVIEW</span>
          <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-violet-500 shadow-[0_0_5px_rgba(139,92,246,1)]"></div>
            <span>NODE_SYNC_STABLE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AgentReport({ step }: { step: AgentStep }) {
  const { agent, data } = step;

  const getStatusColor = (agent: string) => {
    switch (agent) {
      case 'Customer Interaction Agent': return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
      case 'Dietary & Allergens Agent': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'Weather Intelligence Agent': return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'Menu Planning Agent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Inventory & Procurement Agent': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Logistics Planning Agent': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Pricing & Optimization Agent': return 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20';
      case 'Monitoring Agent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (agent: string) => {
    switch (agent) {
      case 'Inventory & Procurement Agent': return 'SCANNED';
      case 'Logistics Planning Agent': return 'ACTIVE';
      case 'Monitoring Agent': return 'SECURE';
      default: return 'READY';
    }
  };

  const renderContent = () => {
    switch (agent) {
      case 'Customer Interaction Agent':
        return (
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="proto" value={data.event_type} />
            <InfoItem label="count" value={data.guests} />
            <InfoItem label="cred" value={data.budget} />
            <InfoItem label="zone" value={data.location} />
            <InfoItem label="pref" value={data.cuisine_preference} />
          </div>
        );
      case 'Dietary & Allergens Agent':
        return (
          <div className="space-y-3">
            <div className="text-[9px] font-bold text-violet-500/40 uppercase tracking-widest font-mono">Constraint Mapping</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-pink-500/5 p-3 border border-pink-500/20">
                <span className="text-[10px] font-bold text-pink-500 uppercase block mb-1 tracking-tight">Allergies Detected</span>
                <p className="text-xs text-pink-100 font-medium">{data.allergens_to_avoid?.length > 0 ? data.allergens_to_avoid.join(', ') : 'None'}</p>
              </div>
              <div className="bg-violet-500/5 p-3 border border-violet-500/20">
                <span className="text-[10px] font-bold text-violet-500 uppercase block mb-1 tracking-tight">Dietary Recommendations</span>
                <p className="text-xs text-violet-100 font-medium">{data.recommended_labels?.length > 0 ? data.recommended_labels.join(', ') : 'None'}</p>
              </div>
            </div>
          </div>
        );
      case 'Menu Planning Agent':
        return (
          <div className="space-y-4">
            <div className="text-[9px] font-bold text-violet-500/40 uppercase tracking-widest font-mono">Neural Synthesis: {data.dietary_compliance || "Balanced Selection"}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.menu || data.dishes)?.map((item: any, i: number) => (
                <div key={i} className="bg-violet-950/20 border border-violet-500/10 overflow-hidden flex flex-col group transition-all hover:border-violet-500/40 shadow-lg">
                  <div className="h-48 w-full bg-violet-950/40 relative">
                    <img 
                      src={item.image_url} 
                      alt={item.dish} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                       <span className="text-[10px] font-bold text-violet-100 uppercase tracking-tight line-clamp-1 group-hover:text-white">{item.dish}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-violet-100/70 leading-relaxed line-clamp-3 italic min-h-[3rem]">"{item.description}"</p>
                    <div className="flex justify-between items-center pt-2 border-t border-violet-500/10">
                      <span className="text-[9px] text-violet-500/60 font-black uppercase tracking-widest">Portion</span>
                      <span className="text-[10px] text-violet-400 font-mono italic font-bold">{item.portion_per_guest}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Inventory & Procurement Agent':
        return (
          <div className="flex-1 space-y-3">
            <div className="bg-amber-500/5 p-2 border border-amber-500/10 rounded-none">
              <span className="text-[7px] font-bold text-amber-500 uppercase block mb-1 tracking-widest font-mono">Shortage_Alerts</span>
              <p className="text-[9px] text-amber-200/60 font-mono italic">
                {data.potential_shortages?.length > 0 ? data.potential_shortages.join(', ') : 'No inventory conflicts detected.'}
              </p>
            </div>
            <table className="w-full text-[9px] font-mono">
              <thead className="text-violet-500/40 border-b border-violet-500/10">
                <tr className="text-left uppercase text-[8px] tracking-widest font-bold">
                  <th className="pb-1">Procurement_Item</th>
                  <th className="pb-1">Qty</th>
                  <th className="pb-1">State</th>
                </tr>
              </thead>
              <tbody className="text-violet-100 italic">
                {data.procurement_list?.slice(0, 5).map((ing: any, i: number) => (
                  <tr key={i} className="border-b border-violet-500/5 hover:bg-violet-500/5 transition-colors">
                    <td className="py-1 uppercase">{ing.item}</td>
                    <td className="py-1">{ing.qty}</td>
                    <td className="py-1 text-violet-500 font-bold">REQ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'Pricing & Optimization Agent':
        return (
          <div className="space-y-6">
             <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.2em] font-mono mb-4 px-2 bg-fuchsia-500/5 border-l-2 border-fuchsia-500 py-1">
               Economic Strategy: {data.pricing_strategy}
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                <div className="bg-fuchsia-950/20 p-8 border border-fuchsia-500/20 relative overflow-hidden group hover:border-fuchsia-500/40 transition-all shadow-[0_0_50px_rgba(217,70,239,0.1)]">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4" />
                   
                   <div className="relative z-10 flex flex-col items-center py-6">
                      <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-[0.5em] mb-4 bg-fuchsia-500/10 px-4 py-1 border border-fuchsia-500/20">Final Integrated Quote</span>
                      <p className="text-7xl font-black text-white font-mono tracking-[0.05em] italic drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]">
                         {data.optimized_quote}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-px w-8 bg-fuchsia-500/30"></div>
                        <span className="text-[9px] text-fuchsia-400/60 uppercase font-mono tracking-tighter italic">Precision Optimized Global Analysis</span>
                        <div className="h-px w-8 bg-fuchsia-500/30"></div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-fuchsia-950/10 p-5 border border-fuchsia-500/10 hover:bg-fuchsia-500/5 transition-colors">
                      <span className="text-[9px] font-bold text-fuchsia-400/60 uppercase block mb-1 font-mono">Cost Per Guest</span>
                      <p className="text-2xl font-black text-white font-mono">{data.unit_cost}</p>
                   </div>
                   <div className="bg-fuchsia-950/10 p-5 border border-fuchsia-500/10 hover:bg-fuchsia-500/5 transition-colors">
                      <span className="text-[9px] font-bold text-fuchsia-400/60 uppercase block mb-1 font-mono">Profit Yield</span>
                      <p className="text-2xl font-black text-emerald-400 font-mono italic">{data.profit_margin}</p>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'Monitoring Agent':
        return (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${data.overall_status === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : data.overall_status === 'yellow' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]' : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]'}`} />
                <span className="text-[10px] font-bold text-violet-100 uppercase tracking-widest">{data.overall_status} status protocol</span>
              </div>
              <span className="text-[10px] font-bold text-violet-400">{data.execution_readiness}% synced</span>
            </div>
            <p className="text-[9px] text-violet-300/80 leading-relaxed italic border-l border-violet-500/20 pl-2">
              "{data.final_summary}"
            </p>
          </div>
        );
      case 'Weather Intelligence Agent':
        return (
           <div className="space-y-3 font-mono">
             <div className="flex items-center gap-3">
               <div className={`p-2 shadow-[0_0_10px_rgba(139,92,246,0.3)] ${data.risk_level === 'high' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}>
                 {data.risk_level === 'high' ? <CloudRain className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-violet-100 uppercase tracking-tight truncate">{data.summary}</p>
                 <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${data.risk_level === 'high' ? 'text-pink-500' : 'text-violet-500'}`}>RISK::{data.risk_level}</p>
               </div>
             </div>
             <div className="bg-black/40 p-2 border border-violet-500/10">
                <span className="text-[7px] font-bold text-violet-500/40 uppercase block mb-1 tracking-widest">Procedural Recs</span>
                <ul className="text-[9px] text-violet-300/80 space-y-1 lowercase border-l border-violet-500/20 pl-2">
                  {data.recommendations?.slice(0, 2).map((r: string, i: number) => (
                    <li key={i} className="leading-tight text-violet-400/70">_ {r}</li>
                  ))}
                </ul>
             </div>
           </div>
        );
      case 'Logistics Planning Agent':
        return (
          <div className="space-y-6">
            <div className="text-[9px] font-bold text-violet-500/40 uppercase tracking-widest font-mono">Operational Timeline</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.timeline?.map((t: any, i: number) => (
                <div key={i} className="flex flex-col bg-violet-950/20 p-4 border border-violet-500/10 relative group hover:border-blue-500/40 transition-all hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-blue-400 font-mono tracking-tighter bg-blue-500/10 px-3 py-1 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">{t.time}</span>
                    <span className="text-[9px] font-bold text-violet-500/60 font-mono uppercase tracking-widest px-2">{t.duration}</span>
                  </div>
                  <p className="text-base font-black text-white leading-tight uppercase tracking-tight italic line-clamp-2 drop-shadow-md">{t.activity}</p>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/10 transition-colors" />
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-violet-500/10">
              <div className="bg-violet-950/40 p-6 border border-violet-500/30 relative overflow-hidden group min-h-[160px] shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-2 h-8 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]" />
                  <span className="text-xs font-black text-blue-400 uppercase tracking-[0.25em] font-mono">Personnel Protocol</span>
                </div>
                <p className="text-sm text-violet-100 leading-relaxed font-bold italic relative z-10 pr-4">
                  {data.staffing_needs}
                </p>
              </div>
              <div className="bg-violet-950/40 p-6 border border-violet-500/30 relative overflow-hidden group min-h-[160px] shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-2 h-8 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]" />
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em] font-mono">Transport Logistics</span>
                </div>
                <p className="text-sm text-violet-100 leading-relaxed font-bold italic relative z-10 pr-4">
                  {data.transport_plan}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-[8px] text-violet-500/60 font-mono uppercase italic break-all opacity-50">{JSON.stringify(data).substring(0, 100)}...</div>;
    }
  };

  return (
    <div className="high-density-card hover:border-violet-500/50 transition-colors group">
      <div className="high-density-header">
        <h2 className="high-density-label group-hover:neon-text-violet transition-all">{agent}</h2>
        <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-widest border ${getStatusColor(agent)}`}>
          {getStatusText(agent)}
        </span>
      </div>
      <div className="p-3">
        {renderContent()}
      </div>
    </div>
  );
}

function PricingInsight({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="space-y-3 font-mono">
        <div className="flex justify-between text-[10px]">
          <span className="text-violet-500/60 uppercase tracking-widest">Yield_Analysis</span>
          <span className="font-bold text-emerald-400 font-mono italic">{data.profit_margin}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-violet-500/60 uppercase tracking-widest">Per_Unit</span>
          <span className="font-bold text-violet-100 font-mono">{data.unit_cost}</span>
        </div>
        <div className="pt-2 border-t border-violet-500/20 flex justify-between font-bold text-violet-400 text-[10px]">
          <span className="uppercase tracking-[0.2em]">Strategy</span>
          <span className="text-[9px] text-fuchsia-400 italic font-mono truncate max-w-[120px]">{data.pricing_strategy}</span>
        </div>
      </div>

      <div className="bg-fuchsia-500/10 p-5 border border-fuchsia-500/30 text-center space-y-2 relative shadow-[0_0_20px_rgba(217,70,239,0.2)]" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
        <div className="text-[9px] uppercase text-fuchsia-400 font-black tracking-[0.4em]">Final Quote</div>
        <div className="text-3xl font-black font-mono tracking-tighter text-white neon-text-fuchsia">{data.optimized_quote}</div>
        <div className="text-[7px] text-fuchsia-500/60 uppercase tracking-[0.5em] font-mono leading-none">Market Optimized Integration</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white/5 p-1.5 border border-violet-500/10 rounded-none flex justify-between items-center font-mono text-[8px] uppercase tracking-tighter">
      <span className="text-violet-500/40 italic">{label}:</span>
      <span className="font-bold truncate max-w-[70px] text-violet-100">{value || 'NULL'}</span>
    </div>
  );
}


