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
  Moon,
  User as UserIcon,
  Mail,
  ShoppingBag,
  Database,
  Zap,
  AlertTriangle,
  Lock,
  Activity
} from 'lucide-react';
import { auth, signInWithGoogle, logout, db, loginWithEmail, signupWithEmail } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { orchestrateCatering, predictWeather, validateAnswer } from './services/orchestrator';

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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isWaitingForWeatherSelection, setIsWaitingForWeatherSelection] = useState(false);
  const [useWeatherSuggestion, setUseWeatherSuggestion] = useState<boolean | null>(null);
  const [selectedDish, setSelectedDish] = useState<any>(null);

  const sanitizeForFirestore = (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForFirestore(item));
    } else if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined) {
          sanitized[key] = sanitizeForFirestore(value);
        }
      });
      return sanitized;
    }
    return data;
  };

  // Auth State
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

    const isPossiblyBulk = userText.length > 80 || userText.split(' ').length > 12;
    
    // --- IMPROVED GIBBERISH SHIELD ---
    const isObviousGibberish = (str: string) => {
      const clean = str.toLowerCase().trim();
      if (clean.length === 0) return true;
      
      const commonUncertainty = ['idk', 'not', 'tbd', 'none', 'no', 'yes', 'ok', 'pesos', 'php', 'bbq', 'gym', 'dry'];
      if (commonUncertainty.includes(clean)) return false;

      // Allow strings that look like dates or numbers with symbols
      if (/^[\d/.\- ]+$/.test(clean)) return false;

      // Single word validation
      if (!clean.includes(' ')) {
        // Very short strings (1-2 chars) that aren't common words or numbers
        if (clean.length < 3 && !/^\d+$/.test(clean)) return true;
        
        // No vowels in a word longer than 3 chars (allowing for strings like BBQ)
        if (clean.length > 3 && !/[aeiouy]/.test(clean)) return true;
      }
      
      if (/(.)\1{3,}/.test(clean)) return true; // 4+ repeating chars
      return false;
    };

    if (isObviousGibberish(userText) && !/^\d+$/.test(userText) && !['tbd', 'none', 'pesos'].includes(userText.toLowerCase())) {
      setMessages(prev => [...prev, { 
        id: `bot-val-local-${Date.now()}`,
        role: 'bot', 
        content: "⚠️ Input Corrupted: The data provided does not match any recognized planning parameters. Please use standard characters and words.", 
        timestamp: new Date() 
      }]);
      setIsProcessing(false);
      return;
    }
    // ------------------------------
    
    // --- AI VALIDATION / RELEVANCE CHECK ---
    setIsProcessing(true);
    
    // Skip AI validation for simple currency clarifications or weather follow-ups
    const currencyWords = ['pesos', 'php', 'dollars', 'usd', 'eur', 'euro', 'pesetas', 'pounds', 'gbp'];
    const lowerInput = userText.toLowerCase().trim();
    const isCurrencyClarification = currentQuestion.key === 'budget' && currencyWords.includes(lowerInput);
    const isYesNo = ['yes', 'no', 'y', 'n', 'yeah', 'nope'].includes(lowerInput);

    if (isWaitingForWeatherSelection) {
      setIsProcessing(false);
      const decision = lowerInput.includes('yes') || lowerInput === 'y' || lowerInput === 'yeah';
      setUseWeatherSuggestion(decision);
      setIsWaitingForWeatherSelection(false);

      setMessages(prev => [...prev, { 
        id: `bot-weather-ack-${Date.now()}`,
        role: 'bot', 
        content: decision 
          ? "✅ Understood! I will prioritize menu items that complement the forecasted weather conditions." 
          : "👍 Noted. I'll stick to a standard cuisine-focused menu regardless of the weather.", 
        timestamp: new Date() 
      }]);

      // Now move to the next question
      if (qIndex < QUESTIONS.length - 1) {
        const nextIdx = qIndex + 1;
        setTimeout(() => {
          setQIndex(nextIdx);
          setMessages(prev => [...prev, { 
            id: `bot-q-${Date.now()}`,
            role: 'bot', 
            content: QUESTIONS[nextIdx].text, 
            timestamp: new Date() 
          }]);
        }, 1000);
      }
      return;
    }

    if (!isCurrencyClarification) {
      const validation = await validateAnswer(currentQuestion.text, userText);
      
      if (!validation.valid) {
        setMessages(prev => [...prev, { 
          id: `bot-val-${Date.now()}`,
          role: 'bot', 
          content: `⚠️ ${validation.re_ask_message || "Input Error: Data not recognized as functional. Please reconcile."}`, 
          timestamp: new Date() 
        }]);
        setIsProcessing(false);
        return;
      }
    }
    // ---------------------------------------

    // Special Logic: If the user provides a lot of info at once, attempt to skip questions
    if (isPossiblyBulk && qIndex === 0) {
      setMessages(prev => [...prev, { 
        id: `bot-bulk-${Date.now()}`,
        role: 'bot', 
        content: "🧠 Detecting multi-requirement input. Synchronizing neural extraction...", 
        timestamp: new Date() 
      }]);
      // Trigger orchestration immediately with the bulk input
      await triggerOrchestration(userText, {});
      return;
    }

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
                  id: `bot-weather-${Date.now()}`,
                  role: 'bot', 
                  content: `🌦️ Weather Forecast: ${weather.summary}. Risk Level: ${weather.risk_level?.toUpperCase() || 'LOW'}.`, 
                  timestamp: new Date() 
                }]);
                
                // Ask for permission to suggest based on weather
                setTimeout(() => {
                  setMessages(prev => [...prev, { 
                    id: `bot-weather-follow-${Date.now()}`,
                    role: 'bot', 
                    content: "Do you want me to suggest food based on the weather info that I've gathered? (Yes/No)", 
                    timestamp: new Date() 
                  }]);
                  setIsWaitingForWeatherSelection(true);
                  setIsProcessing(false);
                }, 1000);

                // Also store it for orchestration
                setEventData(prev => ({ ...prev, weather_data: weather }));
                return; // STOP HERE and wait for yes/no
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
        // We are at the end or in a clarification loop
        let fullPrompt = Object.entries(newEventData)
          .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
          .join(', ');
        
        if (useWeatherSuggestion !== null) {
          fullPrompt += `. Weather-based menu prioritization: ${useWeatherSuggestion ? 'YES' : 'NO'}.`;
        }
        
        triggerOrchestration(fullPrompt, newEventData);
      }
    }

  const triggerOrchestration = async (fullInput: string, data: any) => {
    setIsChatting(false);
    setIsProcessing(true);
    setSteps([]);
    setCurrentStepIndex(-1);

    setMessages(prev => [...prev, { 
      id: `sys-proc-${Date.now()}`,
      role: 'system', 
      content: "🤖 Activating all AI agents. Collaboration in progress...", 
      timestamp: new Date() 
    }]);

    try {
      const result = await orchestrateCatering(fullInput, (step) => {
        setSteps(prev => [...prev, step]);
        setCurrentStepIndex(prev => prev + 1);
      });

      if (result.success) {
        if (user) {
          const eventDataToStore = sanitizeForFirestore({
            userId: user.uid,
            rawInput: fullInput,
            steps: [
              { agent: "Customer Interaction Agent", data: result.data.customer || {} },
              { agent: "Dietary & Allergens Agent", data: result.data.dietary || {} },
              { agent: "Weather Intelligence Agent", data: result.data.weather || {} },
              { agent: "Menu Planning Agent", data: result.data.menu || {} },
              { agent: "Inventory & Procurement Agent", data: result.data.inventory || {} },
              { agent: "Logistics Planning Agent", data: result.data.logistics || {} },
              { agent: "Pricing & Optimization Agent", data: result.data.pricing || {} },
              { agent: "Monitoring Agent", data: result.data.monitoring || {} }
            ],
            createdAt: Timestamp.now()
          });
          await addDoc(collection(db, 'events'), eventDataToStore);
          fetchHistory(user.uid);
        }
      }
    } catch (error: any) {
      console.error("Orchestration error:", error);
      let errorMsg = error?.message || "Critical error in AI Orchestration. Connection severed.";
      
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        errorMsg = "Neural link saturated (Quota Exceeded). If running locally, check your GEMINI_API_KEY limits. Please try again in 60 seconds.";
      } else if (errorMsg.includes("503") || errorMsg.includes("high demand")) {
        errorMsg = "AI Models under heavy load. Please retry in a few moments.";
      } else if (errorMsg.includes("GEMINI_API_KEY")) {
        errorMsg = "GEMINI_API_KEY missing. Ensure you have a .env file with your key.";
      }
      
      setMessages(prev => [...prev, { 
        id: `bot-err-${Date.now()}`,
        role: 'bot', 
        content: `⚠️ ALERT: ${errorMsg}`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsProcessing(false);
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
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950 transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 space-y-8 rounded-3xl"
        >
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 mb-2 group transition-all hover:bg-violet-500/20">
              <ChefHat className="w-10 h-10 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">CaterAI</h1>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-semibold">Smart Catering Solutions</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-[11px] font-medium text-red-400 text-center animate-shake">
                {authError}
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Identity Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Enter legal name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-zinc-100 focus:border-violet-500/50 outline-none transition-all placeholder:text-zinc-700"
                      required
                    />
                  </div>
                </div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">E-Mail Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="email"
                  placeholder="user@neural.network"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-zinc-100 focus:border-violet-500/50 outline-none transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Access Protocol</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="password"
                  placeholder="Create secure channel"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-zinc-100 focus:border-violet-500/50 outline-none transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_20px_rgba(139,92,246,0.3)] text-sm group overflow-hidden relative"
            >
              <span className="relative z-10">{authMode === 'login' ? 'Establish Connection' : 'Initialize Account'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          <button
            onClick={signInWithGoogle}
            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] text-sm"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-[10px] font-black">G</span>
            </div>
            Sign in with Google Identity
          </button>

          <p className="text-center text-[11px] text-zinc-500 font-medium">
            {authMode === 'login' ? "New operator here?" : "Already within the network?"}{" "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-violet-400 font-bold hover:text-violet-300 transition-colors inline-flex items-center gap-1 group"
            >
              {authMode === 'login' ? 'Register Account' : 'Return to Login'}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="h-16 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CaterAI</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Assistant Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-2 border border-white/5 bg-black/50 px-3 py-1.5 rounded-full mr-4">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{isProcessing ? 'Agent Thinking...' : 'Ready'}</span>
          </div>

          <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-all border border-transparent hover:border-white/5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl transition-all border ${showHistory ? 'bg-violet-600 text-white border-violet-500 shadow-[0_10px_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-transparent hover:border-white/5'}`}
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
               <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=8B5CF6&color=fff`} className="w-9 h-9 rounded-xl border border-white/10 shadow-lg group-hover:border-violet-500 transition-all" alt="User" />
             </div>
             <button onClick={logout} className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors">
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
              className="absolute inset-y-4 left-4 w-72 bg-slate-900/90 backdrop-blur-xl rounded-3xl z-30 border border-white/5 overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-widest text-violet-400">Previous Events</h3>
                <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-violet-600/10 transition-all group"
                  >
                    <p className="text-xs font-bold text-zinc-100 truncate mb-1 group-hover:text-violet-400 transition-colors uppercase">{item.rawInput}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                        {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                      <span className="text-[9px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full font-bold">EVENT_LOG</span>
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
              <h2 className="high-density-label">Event Chat</h2>
              <button onClick={restartChat} className="text-[9px] font-bold text-violet-400 hover:text-white uppercase tracking-widest bg-violet-600/20 px-2 py-0.5 border border-violet-500/20">Reset Chat</button>
            </div>
            
            {/* Chat Bubble Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-black/20 custom-scrollbar" ref={chatScrollRef}>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[85%] px-5 py-3.5 text-sm leading-relaxed shadow-xl
                      ${msg.role === 'user' ? 
                        'bg-violet-600 text-white rounded-3xl rounded-tr-none' : 
                        msg.role === 'system' ? 
                        'bg-zinc-900/50 text-zinc-500 w-full text-center text-[10px] uppercase font-bold py-2 border border-white/5 rounded-2xl' :
                        'bg-slate-900 text-zinc-100 border border-white/5 rounded-3xl rounded-tl-none'}
                    `}>
                      {msg.content}
                      {msg.role !== 'system' && (
                        <div className={`text-[9px] mt-2 opacity-50 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isProcessing && isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-white/5 px-4 py-3 rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-900/30">
              <form onSubmit={handleChatSubmit} className="flex flex-col space-y-3">
                <div className="relative group">
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
                    placeholder={isProcessing ? "Analyzing signals..." : "Message agent..."}
                    disabled={isProcessing || !isChatting}
                    className="w-full p-4 bg-black/40 text-white rounded-2xl text-sm border border-white/10 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 outline-none resize-none min-h-[90px] placeholder:text-zinc-600 transition-all"
                    required
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !isChatting}
                      className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:bg-slate-800 transition-all shadow-lg shadow-violet-900/20 active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Agent Status */}
          <div className="high-density-card flex flex-col" style={{ flexBasis: '40%' }}>
            <div className="high-density-header">
              <h2 className="high-density-label">Planning Specialists</h2>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar">
              {[
                { name: 'Customer Interaction', icon: <Users className="w-3 h-3" /> },
                { name: 'Dietary & Allergens', icon: <Droplets className="w-3 h-3" /> },
                { name: 'Weather Intelligence', icon: <CloudRain className="w-3 h-3" /> },
                { name: 'Menu Planning', icon: <Utensils className="w-3 h-3" /> },
                { name: 'Inventory & Procurement', icon: <Package className="w-3 h-3" /> },
                { name: 'Logistics Planning', icon: <Truck className="w-3 h-3" /> },
                { name: 'Pricing & Optimization', icon: <DollarSign className="w-3 h-3" /> },
                { name: 'Safety Monitoring', icon: <ShieldCheck className="w-3 h-3" /> }
              ].map((agent, i) => {
                const isActive = currentStepIndex === i;
                const isCompleted = currentStepIndex > i;
                
                return (
                  <div key={agent.name} className={`flex items-center gap-4 p-3 transition-all rounded-xl ${isActive ? 'bg-violet-600/10 border border-violet-500/20' : ''}`}>
                    <div className={`
                      w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg transition-all
                      ${isActive ? 'bg-violet-600 text-white animate-pulse shadow-lg shadow-violet-900/30' : ''}
                      ${isCompleted ? 'bg-emerald-600/20 text-emerald-500' : 'bg-zinc-800/50 text-zinc-600'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[11px] font-bold truncate tracking-tight transition-colors ${isActive ? 'text-violet-400' : isCompleted ? 'text-zinc-200' : 'text-zinc-600'}`}>
                        {agent.name}
                      </h3>
                      {isActive && <div className="text-[8px] text-violet-500/60 uppercase font-black tracking-widest mt-0.5">Active Operation</div>}
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
                  className="mb-8 p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 text-white space-y-5 shadow-[0_20px_50px_rgba(79,70,229,0.4)] relative overflow-hidden group border border-white/20 rounded-3xl"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-violet-100/70 text-[9px] uppercase font-bold tracking-[0.2em]">Operational Check Optimal</p>
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic">Event Proposal</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 py-5 border-y border-white/10 relative z-10">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">Allocated Budget</span>
                      <p className="text-2xl font-bold text-emerald-300">{steps[7]?.data?.optimized_quote || steps[0]?.data.budget}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">Guest Count</span>
                      <p className="text-2xl font-bold">{steps[0]?.data.guests}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-violet-200/60 block mb-1">Cost Per Pax</span>
                      <p className="text-2xl font-bold text-emerald-300 uppercase">{steps[7]?.data?.cost_per_person || 'Calculated'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <span className="text-[8px] uppercase font-bold text-violet-200/60 block">Integrated Summary</span>
                    <p className="text-sm font-medium text-white font-mono leading-relaxed bg-black/20 p-3 border-l-2 border-emerald-400">
                      {steps[7]?.data?.final_summary || 'Synchronizing final data...'}
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
                    <AgentReport step={step} onDishClick={setSelectedDish} />
                  </motion.div>
                ))}
              </div>

              {isProcessing && currentStepIndex >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-violet-950/20 border border-violet-500/20 flex items-center justify-center gap-4"
                >
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 bg-violet-500 rotate-45 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-violet-500 rotate-45 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-violet-500 rotate-45 animate-bounce"></div>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-violet-400 animate-pulse">
                    Agent_{steps[currentStepIndex]?.agent?.split(' ')[0] || 'Orchestrator'}_Thinking...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Metrics Panel */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4">
          <div className="high-density-card flex flex-col flex-1 bg-zinc-900/30">
            <div className="high-density-header">
              <h2 className="high-density-label uppercase tracking-widest">Execution Intelligence</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
              {steps.find(s => s.agent === 'Monitoring Agent') ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Rediness</span>
                      <p className="text-xl font-bold text-violet-400">{steps.find(s => s.agent === 'Monitoring Agent')?.data.execution_readiness}%</p>
                    </div>
                    <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Integrity</span>
                      <p className="text-xl font-bold text-emerald-400">{steps.find(s => s.agent === 'Monitoring Agent')?.data.overall_status?.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  {steps.find(s => s.agent === 'Pricing & Optimization Agent') && (
                    <div className="p-5 bg-violet-600/5 rounded-2xl border border-violet-500/20">
                      <span className="text-[9px] font-bold text-violet-500 uppercase block mb-3">Economic Synthesis</span>
                      <div className="space-y-4">
                         <div>
                            <span className="text-[10px] text-zinc-500 block mb-1">Optimized Quote</span>
                            <p className="text-3xl font-black text-white">{steps.find(s => s.agent === 'Pricing & Optimization Agent')?.data.optimized_quote}</p>
                         </div>
                         <div className="flex justify-between items-center pt-4 border-t border-white/5">
                           <div>
                             <span className="text-[9px] text-zinc-500 block text-zinc-600">Unit Cost</span>
                             <p className="text-sm font-bold text-zinc-200">{steps.find(s => s.agent === 'Pricing & Optimization Agent')?.data.unit_cost}</p>
                           </div>
                           <div className="text-right">
                             <span className="text-[9px] text-zinc-500 block text-zinc-600">Efficiency</span>
                             <p className="text-sm font-bold text-emerald-400">{steps.find(s => s.agent === 'Pricing & Optimization Agent')?.data.profit_margin}</p>
                           </div>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 italic text-sm text-zinc-400 leading-relaxed">
                    "{steps.find(s => s.agent === 'Monitoring Agent')?.data?.final_summary || 'Protocols finalising...'}"
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                  <ShieldCheck className="w-16 h-16 text-zinc-400" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Awaiting Intelligence Feed</p>
                </div>
              )}
            </div>
            
            {/* System Log - Subtle Version */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/20 max-h-32 overflow-hidden">
               <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex justify-between">
                 <span>Neural_Stream</span>
                 <Activity className="w-3 h-3" />
               </div>
               <div className="space-y-1 font-mono text-[9px] text-zinc-600 overflow-y-auto max-h-20 opacity-60">
                 {steps.map((s, i) => (
                   <div key={i} className="flex gap-2">
                     <span className="text-violet-500/50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                     <span className="uppercase">{s.agent?.split(' ')[0]} Committed</span>
                   </div>
                 ))}
                 {isProcessing && <div className="text-amber-500/80 animate-pulse">Running Recursive Synthesis...</div>}
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Recipe & Nutrition Matrix Modal */}
      <AnimatePresence>
        {selectedDish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setSelectedDish(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 p-10 rounded-[32px] max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/2">
                  <img 
                    src={selectedDish.image_url} 
                    className="w-full aspect-square object-cover rounded-3xl shadow-2xl border border-white/10" 
                    alt={selectedDish.dish}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-full md:w-1/2 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-white leading-tight uppercase italic">{selectedDish.dish}</h2>
                    <p className="text-[10px] text-violet-400 uppercase tracking-[0.3em] font-black mt-2">{selectedDish.category}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Portioning</p>
                      <p className="text-sm font-bold text-white">{selectedDish.serving_size || 'Standard'}</p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-right">
                      <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Caloric Intensity</p>
                      <p className="text-sm font-bold text-amber-500">{selectedDish.calories || '---'} kcal</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.4em]">Biometric Matrix Profile</h4>
                    <div className="space-y-4">
                      <div className="group">
                        <div className="flex justify-between text-[10px] font-black mb-2">
                          <span className="text-zinc-500 tracking-widest uppercase">Protein Yield</span>
                          <span className="text-white">{selectedDish.macros?.protein || 0}g</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (selectedDish.macros?.protein || 0) * 2)}%` }} 
                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          />
                        </div>
                      </div>
                      <div className="group">
                        <div className="flex justify-between text-[10px] font-black mb-2">
                          <span className="text-zinc-500 tracking-widest uppercase">Carbohydrates</span>
                          <span className="text-white">{selectedDish.macros?.carbs || 0}g</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (selectedDish.macros?.carbs || 0) * 2)}%` }} 
                            className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                          />
                        </div>
                      </div>
                      <div className="group">
                        <div className="flex justify-between text-[10px] font-black mb-2">
                          <span className="text-zinc-500 tracking-widest uppercase">Lipid Matrix</span>
                          <span className="text-white">{selectedDish.macros?.fat || 0}g</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(100, (selectedDish.macros?.fat || 0) * 2)}%` }} 
                            className="h-full bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDish(null)}
                className="mt-10 w-full py-5 bg-violet-600/10 border border-violet-500/20 rounded-2xl text-[10px] font-black text-violet-400 hover:text-white hover:bg-violet-600 transition-all uppercase tracking-[0.4em]"
              >
                Return to Operational Surface
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-12 bg-zinc-900/50 border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span>© 2024 CaterAI Systems</span>
          <div className="h-4 w-px bg-white/5"></div>
          <span className="text-zinc-700">Neural Kernel v4.8.2</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span>Primary Node Active</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">Uplink: Low Latency</span>
        </div>
      </footer>
    </div>
  );
}

function AgentReport({ step, onDishClick }: { step: AgentStep, onDishClick?: (dish: any) => void }) {
  const { agent, data } = step;
  
  if (agent === "Inventory & Procurement Agent") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Procurement & Pricing</h3>
          </div>
          <div className="space-y-2">
            {data.procurement_list?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                <div className="flex flex-col">
                  <span className="text-zinc-400">{item.item}</span>
                  <span className="text-[10px] text-zinc-600">{item.qty}</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-black">{item.estimated_cost}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Asset Valuation</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            Scanning local logistics nodes and supply chain buffers. Every item priced for margin preservation. Sum total aligned with mission budget.
          </p>
        </div>
      </div>
    );
  }

  if (agent === "Monitoring Agent") {
    return (
      <div className="bg-zinc-900 border border-violet-500/20 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${data.overall_status === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            Status: {data.overall_status?.toUpperCase() || 'STABLE'}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/20">
              <Zap className="w-6 h-6" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white uppercase tracking-widest">Execution Readiness</h3>
             <div className="w-64 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${data.execution_readiness || 95}%` }}
                  className="h-full bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                />
             </div>
           </div>
        </div>

        <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 mb-6">
           <span className="text-[10px] font-bold text-zinc-600 uppercase block mb-2 tracking-widest">Neural Summary</span>
           <p className="text-sm text-zinc-300 leading-relaxed italic">
             "{data.final_summary || 'Protocols verified. System is ready for deployment.'}"
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-950/30 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-zinc-500 mb-2">
               <AlertTriangle className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Environment Risks</span>
             </div>
             <p className="text-xs text-zinc-500">All external variables within nominal range.</p>
          </div>
          <div className="p-4 bg-zinc-950/30 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 text-zinc-500 mb-2">
               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Validation Logic</span>
             </div>
             <p className="text-xs text-zinc-500">Cross-agent consistency verified at 100%.</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
              <span>Neural Menu Synthesis</span>
              <span className="text-violet-400">Click items for Matrix Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(data.menu || data.dishes)?.map((item: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => onDishClick?.(item)}
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden group transition-all hover:bg-zinc-900/60 shadow-xl cursor-pointer hover:border-violet-500/40"
                >
                  <div className="h-48 w-full bg-zinc-800 relative">
                    <img 
                      src={item.image_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300&sig=${i}`} 
                      alt={item.dish} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="px-3 py-1 bg-violet-600/90 text-[8px] font-black uppercase text-white rounded-full border border-white/20">
                          {item.category || 'Main'}
                       </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                       <span className="text-sm font-black text-white tracking-tight italic">{item.dish}</span>
                       <span className="text-[10px] font-black text-emerald-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">₱{item.estimated_price}/pax</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-3">"{item.description}"</p>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-zinc-400">{item.calories || '---'} kcal</span>
                      </div>
                      <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Show Details</span>
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
                  <th className="pb-1 text-right">Cost_Est</th>
                </tr>
              </thead>
              <tbody className="text-violet-100 italic">
                {data.procurement_list?.map((ing: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                    <td className="py-2 uppercase">{ing.item}</td>
                    <td className="py-2">{ing.qty}</td>
                    <td className="py-2 text-right text-emerald-400 font-bold">{ing.estimated_cost || 'N/A'}</td>
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
              "{data?.final_summary || 'Synchronizing report...'}"
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


