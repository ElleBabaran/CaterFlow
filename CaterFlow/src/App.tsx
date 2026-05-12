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
  Save,
  Trash2,
  Pencil,
  X,
  PieChart as PieIcon,
  BarChart3,
  ClipboardList,
  Edit3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { auth, signInWithGoogle, logout, db, loginWithEmail, signupWithEmail, WorkspaceRole } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, getDoc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { generateConversationalPrompt, orchestrateCatering, validateUserResponse } from './services/orchestrator';
import { mongoService } from './services/mongodb';
import { hasCurrencyMarker } from './services/budget';
import { GeoOpsLeafletMap } from './components/GeoOpsLeafletMap';

interface AgentStep {
  agent: string;
  data: any;
}

interface Message {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  agent?: string;
  qKey?: string;
  timestamp: Date;
}

const QUESTIONS = [
  { key: "preferred_language", text: "Before we start, what language do you prefer? English, Tagalog, Spanish, or another language?" },
  { key: "event_type", text: "👋 Hi! I'm your AI Catering Assistant. What type of event are you planning? (e.g. Wedding, Birthday, Corporate)" },
  { key: "guest_count", text: "👥 How many guests are you expecting?" },
  { key: "event_location", text: "📍 Where will the event be held? (City or venue name)" },
  { key: "event_date", text: "📅 What is the event date?" },
  { key: "food_choice_mode", text: "🍽️ Do you have specific food items in mind that you'd like to add, or would you like our Head Chef to suggest a menu for you? (e.g., 'I have specific food' or 'Suggest for me')" },
  { key: "specific_food_items", text: "🍲 What specific food items or dishes do you have in mind? Please list them here." },
  { key: "budget", text: "💰 What is your total budget? (Please include the currency, e.g. $5000, ₱50000, 1000€)" },
  { key: "cuisine_preference", text: "🍱 Any cuisine preference? (e.g. Filipino, Italian, Japanese, BBQ)" },
  { key: "dietary_needs", text: "🥗 Any dietary needs or restrictions? (e.g. None, Vegetarian, Allergies)" },
  { key: "dessert_preference", text: "🍰 Would you like to include desserts in the menu? (Yes/No, or specific types)" },
  { key: "drink_preference", text: "🥤 What are your preferences for drinks? (e.g. Soft drinks, Juices, Cocktails, Coffee)" },
  { key: "nearby_suggestions", text: "🏢 Do you want me to look for suggested catering nearby or not? (Yes/No)" },
];

const QUESTION_TRANSLATIONS: Record<string, Record<string, string>> = {
  tagalog: {
    event_type: "Anong klase ng event ang pinaplano mo? (hal. wedding, birthday, corporate)",
    guest_count: "Ilang guests ang inaasahan mo?",
    event_location: "Saan gaganapin ang event? (city o venue name)",
    event_date: "Kailan ang event date? Che-check ko rin ang weather para sa iyo!",
    food_choice_mode: "Mayroon ka bang specific na pagkain na gustong idagdag, o gusto mo bang ang aming Head Chef ang mag-suggest ng menu? (hal. 'May specific food ako' o 'Mag-suggest kayo')",
    specific_food_items: "Anong mga pagkain o putahe ang nasa isip mo? Pakilista mo rito.",
    budget: "Magkano ang total budget mo? Pakilagay ang currency, hal. PHP 50000.",
    cuisine_preference: "May gusto ka bang cuisine? (hal. Filipino, Italian, Japanese, BBQ)",
    dietary_needs: "May dietary needs ba o restrictions? (hal. vegetarian, halal, allergies)",
    dessert_preference: "Gusto mo bang may desserts? (Yes/No o specific dessert)",
    drink_preference: "Anong drinks ang gusto mo? (soft drinks, juices, cocktails, coffee)",
    nearby_suggestions: "Gusto mo bang maghanap din ako ng suggested catering shops na malapit sa venue? (Oo/Hindi)",
  },
  spanish: {
    event_type: "Que tipo de evento estas planeando? (por ejemplo, boda, cumpleanos, corporativo)",
    guest_count: "Cuantos invitados esperas?",
    event_location: "Donde sera el evento? (ciudad o nombre del venue)",
    event_date: "Cual es la fecha del evento?",
    budget: "Cual es tu presupuesto total? Incluye la moneda, por ejemplo PHP 50000.",
    cuisine_preference: "Tienes alguna preferencia de cocina? (Filipina, Italiana, Japonesa, BBQ)",
    dietary_needs: "Hay necesidades dieteticas o restricciones? (vegetariano, halal, alergias)",
    dessert_preference: "Quieres incluir postres? (Si/No o tipos especificos)",
    drink_preference: "Que bebidas prefieres? (refrescos, jugos, cocteles, cafe)",
    nearby_suggestions: "Quieres que busque sugerencias de catering cercanas o no? (Si/No)",
  },
  japanese: {
    event_type: "どのようなイベントを計画されていますか？（例：結婚式、誕生日、企業イベント）",
    guest_count: "何名様のゲストを予定されていますか？",
    event_location: "開催場所はどちらですか？（市区町村または会場名）",
    event_date: "開催日はいつですか？",
    budget: "総予算はいくらですか？通貨も含めてください（例：PHP 50000、50000円）。",
    cuisine_preference: "料理のご希望はありますか？（例：フィリピン料理、イタリアン、和食、BBQ）",
    dietary_needs: "食事制限やアレルギーはありますか？（例：なし、ベジタリアン、ハラール、アレルギー）",
    dessert_preference: "メニューにデザートを含めますか？（はい/いいえ、または具体的な種類）",
    drink_preference: "飲み物のご希望は何ですか？（例：ソフトドリンク、ジュース、カクテル、コーヒー）",
    nearby_suggestions: "近くのケータリングショップを提案したほうがいいですか？ (はい/いいえ)",
  },
};

function normalizeLanguage(value = "") {
  const text = value.toLowerCase();
  if (/tagalog|filipino|tl|pilipino/.test(text)) return "tagalog";
  if (/spanish|espanol|español/.test(text)) return "spanish";
  if (/japanese|nihongo|jp|日本語/.test(text)) return "japanese";
  return "english";
}

function getQuestionText(index: number, language?: string) {
  const question = QUESTIONS[index];
  if (!question) return "";
  const normalized = normalizeLanguage(language);
  return QUESTION_TRANSLATIONS[normalized]?.[question.key] || question.text;
}

const SUMMARY_FIELDS = [
  { key: "event_type", label: "Event type", compact: true },
  { key: "guest_count", label: "Servings / guests", compact: true, important: true },
  { key: "event_location", label: "Venue", compact: true },
  { key: "event_date", label: "Date", compact: true },
  { key: "food_choice_mode", label: "Food Selection" },
  { key: "specific_food_items", label: "Specific Dishes" },
  { key: "budget", label: "Budget", compact: true },
  { key: "cuisine_preference", label: "Cuisine" },
  { key: "dietary_needs", label: "Dietary needs" },
  { key: "dessert_preference", label: "Desserts" },
  { key: "drink_preference", label: "Drinks" },
  { key: "nearby_suggestions", label: "Nearby catering suggestions" },
  { key: "special_requests", label: "Added notes" },
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
  const [historySearch, setHistorySearch] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>('customer');
  const [signupRole, setSignupRole] = useState<WorkspaceRole>('customer');
  const [reportView, setReportView] = useState<'all' | 'menu' | 'logistics' | 'finance'>('menu');
  const [dashboardView, setDashboardView] = useState<'conversation' | 'summary' | 'operations' | 'finance'>('conversation');
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [useFoundry, setUseFoundry] = useState(true);
  const [stackStatus, setStackStatus] = useState<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [eventData, setEventData] = useState<any>({});
  const [isChatting, setIsChatting] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showLogin, setShowLogin] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const [localMenu, setLocalMenu] = useState<any[]>([]);
  const [localInventory, setLocalInventory] = useState<any[]>([]);
  const [localTimeline, setLocalTimeline] = useState<any[]>([]);
  const [staffTasks, setStaffTasks] = useState<any[]>([]);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const [shopProfile, setShopProfile] = useState<any>(null);
  const [availableShops, setAvailableShops] = useState<any[]>([]);
  const [matchedShop, setMatchedShop] = useState<any>(null);
  const [agreementStatus, setAgreementStatus] = useState<'none' | 'suggested' | 'accepted' | 'finalized'>('none');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const loadUserRole = async (activeUser: User) => {
    try {
      const profile = await mongoService.fetchUser(activeUser.uid);
      
      if (profile && profile.role) {
        setWorkspaceRole(profile.role);
        setSignupRole(profile.role);
        return;
      }

      const newProfile = await mongoService.saveUser({
        uid: activeUser.uid,
        email: activeUser.email,
        name: activeUser.displayName || name || activeUser.email || 'CaterFlow User',
        photoURL: activeUser.photoURL,
        role: signupRole
      });
      
      setWorkspaceRole(newProfile.role || 'customer');
    } catch (err) {
      console.error("Error loading user role from MongoDB:", err);
    }
  };

  const fetchHistory = async (uid: string) => {
    try {
      const hist = await mongoService.fetchEvents(uid);
      setHistory(hist);
    } catch (err) {
      console.error("Error fetching history from MongoDB:", err);
    }
  };

  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'bot') {
        const utterance = new SpeechSynthesisUtterance(lastMsg.content);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, ttsEnabled]);

  useEffect(() => {
    if (chatScrollRef.current) {
      requestAnimationFrame(() => {
        chatScrollRef.current?.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, [messages, isProcessing, showSummary, eventData]);
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadUserRole(u);
        fetchHistory(u.uid);
        if (messages.length === 0) {
          setMessages([{ id: 'bot-start', role: 'bot', content: getQuestionText(0), timestamp: new Date() }]);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [messages.length]);

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
    
    const newMessages: Message[] = [...messages, { 
      id: `user-${Date.now()}`,
      role: 'user', 
      content: userText, 
      qKey: currentQuestion.key,
      timestamp: new Date() 
    }];
    setMessages(newMessages);
    setInput("");

    // Special handling for weather if date is provided
    if (currentQuestion.key === 'event_date' && eventData.event_location) {
      setIsProcessing(true);
      import('./services/orchestrator').then(async (m) => {
        const weather = await m.predictWeather(eventData.event_location, userText);
        setMessages(prev => [...prev, {
          id: `bot-weather-${Date.now()}`,
          role: 'bot',
          content: `🌤️ **Weather Forecast for ${eventData.event_location} on ${userText}:** ${weather.summary}\n\n${weather.recommendations[0]}`,
          timestamp: new Date()
        }]);
        setIsProcessing(false);
      });
    }

    let refinedAmount = userText;
    const currencyRegex = /[\$\£\€\¥\₱\₹]|(USD|PHP|EUR|GBP|AED|CAD|AUD|JPY|CNY|PESO|PESOS)/i;
    
    if (currentQuestion.key === 'budget' && eventData.budget && !hasCurrencyMarker(eventData.budget)) {
      if (currencyRegex.test(userText) || /^\w{3}$/.test(userText)) {
        refinedAmount = `${eventData.budget} ${userText}`;
      }
    }

    const newEventData = { ...eventData, [currentQuestion.key]: refinedAmount };

    if (currentQuestion.key === 'budget') {
      const hasCurrency = hasCurrencyMarker(refinedAmount);
      if (!hasCurrency && /^\d+$/.test(refinedAmount.replace(/[,. ]/g, ''))) {
        setMessages([...newMessages, { 
          id: `bot-currency-${Date.now()}`,
          role: 'bot', 
          content: "I've noted the amount! Just to be precise, which currency are you using? (e.g., $, ₱, USD, PHP, Pesos)", 
          timestamp: new Date() 
        }]);
        return;
      }
    }

    setEventData(newEventData);

    if (qIndex < QUESTIONS.length - 1) {
      setIsProcessing(true);

      const validation = await validateUserResponse(currentQuestion.text, userText, newEventData.preferred_language);
      if (!validation.valid) {
        setMessages(prev => [...prev, { 
          id: `bot-err-${Date.now()}`,
          role: 'bot', 
          content: validation.message || "Please provide a more specific answer.", 
          timestamp: new Date() 
        }]);
        setIsProcessing(false);
        return; 
      }

      let nextIdx = qIndex + 1;
      
      // Branching logic for food choice
      if (currentQuestion.key === 'food_choice_mode') {
        const isSuggest = /suggest|chef|mag-suggest|kayo/i.test(userText);
        const isSpecific = /specific|ako|meron|mayroon/i.test(userText);
        
        if (isSuggest && !isSpecific) {
          // Skip the specific_food_items question if they want suggestions
          const specificIdx = QUESTIONS.findIndex(q => q.key === 'specific_food_items');
          if (specificIdx !== -1 && nextIdx === specificIdx) {
            nextIdx++;
          }
        }
      }

      const nextQuestion = getQuestionText(nextIdx, newEventData.preferred_language);
      const conversationalReply = await generateConversationalPrompt(
        currentQuestion.key,
        currentQuestion.text,
        userText,
        nextQuestion,
        newEventData.preferred_language,
      );
      const botMessage = conversationalReply.reply || nextQuestion;

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
      // If we're already at the end and they're adding more
      if (isConfirming || showSummary) {
        const updatedSpecial = `${newEventData.special_requests || ""}\nAdditional info: ${userText}`.trim();
        const finalEventData = { ...newEventData, special_requests: updatedSpecial };
        setEventData(finalEventData);
        setIsProcessing(true);
        setTimeout(() => {
          setIsConfirming(true);
          setShowSummary(true);
          setMessages(prev => [...prev, { 
            id: `sys-review-update-${Date.now()}`,
            role: 'bot', 
            content: "Got it! I've added that to your request. Here is the updated summary:", 
            timestamp: new Date() 
          }]);
          setIsProcessing(false);
        }, 800);
        return;
      }

      setIsConfirming(true);
      setShowSummary(true);
      setMessages(prev => [...prev, { 
        id: `sys-review-${Date.now()}`,
        role: 'bot', 
        content: "I've gathered all the details! Please review the summary below. Is everything correct, or would you like to add anything else?", 
        timestamp: new Date() 
      }]);
    }
  };

  const handleConfirmOrder = async () => {
    setIsConfirming(false);
    setShowSummary(false);
    setIsChatting(false);
    setIsProcessing(true);
    setSteps([]);
    setCurrentStepIndex(-1);
    
    const fullPrompt = Object.entries(eventData)
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
        
        if (step.agent.includes('Head Chef') && step.data.menu) {
          setLocalMenu(step.data.menu);
        }
        if (step.agent.includes('Inventory') && step.data.procurement_list) {
          setLocalInventory(step.data.procurement_list);
        }
        if (step.agent.includes('Logistics') && step.data.timeline) {
          setLocalTimeline(step.data.timeline);
          setStaffTasks(step.data.timeline.map((t: any) => ({ ...t, completed: false })));
        }
      }, useFoundry);

      if (result.success) {
        if (user) {
          const eventRecord = sanitizeForFirestore({
            userId: user.uid,
            type: 'plan',
            rawInput: fullPrompt,
            messages: serializeMessages(),
            qIndex,
            eventData: eventData,
            steps: [
              { agent: "Phase 1: Concierge (User Intent)", data: result.data.customer || {} },
              { agent: "Knowledge Base & RAG Agent", data: result.data.knowledge || {} },
              { agent: "Dietary & Allergens Specialist", data: result.data.dietary || {} },
              { agent: "Weather Intelligence", data: result.data.weather || {} },
              { agent: "Phase 2: Head Chef (Menu Design)", data: result.data.menu || {} },
              { agent: "Inventory & Procurement Specialist", data: result.data.inventory || {} },
              { agent: "Supplier Intelligence Specialist", data: result.data.suppliers || {} },
              { agent: "Phase 4: Logistics Lead (Execution)", data: result.data.logistics || {} },
              { agent: "Phase 3: Accountant (Cost Optimization)", data: result.data.pricing || {} },
              { agent: "Shared Memory Ledger", data: result.data.sharedMemoryLedger || {} },
              { agent: "System Monitoring & QA", data: result.data.monitoring || {} }
            ],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
          try {
            if (activeConversationId) {
              await mongoService.updateEvent(activeConversationId, eventRecord);
            } else {
              const saved = await mongoService.saveEvent(eventRecord);
              setActiveConversationId(saved._id || saved.id);
            }
            fetchHistory(user.uid);
          } catch (err) {
            console.error("Error auto-saving to MongoDB:", err);
          }
        }
      }
    } catch (error: any) {
        console.error("Orchestration error:", error);
        let errorMsg = error?.message || "Critical error in AI Orchestration. Connection severed.";
        
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
          errorMsg = "AI planning service is busy. Please try again in 60 seconds.";
        } else if (errorMsg.includes("503") || errorMsg.includes("high demand")) {
          errorMsg = "AI Models under heavy load. Please retry in a few moments.";
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

  const updateEventDataField = (key: string, value: string) => {
    setEventData((prev: any) => ({ ...prev, [key]: value }));
  };

  const loadFromHistory = (item: any) => {
    setActiveConversationId(item.id);
    if (item.messages?.length > 0) {
      setMessages(item.messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now())
      })));
    }
    setSteps(item.steps || []);
    setEventData(item.eventData || {});
    setQIndex(item.qIndex || 0);
    setIsChatting(!item.steps?.length);
    setShowHistory(false);
    setCurrentStepIndex(item.steps?.length || -1);
  };
  
  const restartChat = () => {
    setActiveConversationId(null);
    setEditingMessageId(null);
    setEditingText("");
    setMessages([{ id: 'bot-start', role: 'bot', content: getQuestionText(0), timestamp: new Date() }]);
    setQIndex(0);
    setEventData({});
    setIsChatting(true);
    setSteps([]);
    setCurrentStepIndex(-1);
  };

  const serializeMessages = () => messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date().toISOString()
  }));

  const saveConversation = async () => {
    if (!user) return;
    const firstUserMessage = messages.find(msg => msg.role === 'user')?.content || 'Untitled catering conversation';
    const payload = sanitizeForFirestore({
      userId: user.uid,
      type: steps.length > 0 ? 'plan' : 'conversation',
      rawInput: firstUserMessage,
      messages: serializeMessages(),
      qIndex,
      eventData,
      steps,
    });

    try {
      if (activeConversationId) {
        await mongoService.updateEvent(activeConversationId, payload);
      } else {
        const saved = await mongoService.saveEvent(payload);
        
        setActiveConversationId(saved._id || saved.id);
      }
      fetchHistory(user.uid);
    } catch (err) {
      console.error("Error saving to MongoDB:", err);
    }
  };

  const deleteConversation = async (id?: string) => {
    const targetId = id || activeConversationId;
    if (!targetId || !user) return;
    try {
      await mongoService.deleteEvent(targetId);
      if (targetId === activeConversationId) restartChat();
      fetchHistory(user.uid);
    } catch (err) {
      console.error("Error deleting from MongoDB:", err);
    }
  };

  const startEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const commitEditMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    
    const editedMsg = messages.find(m => m.id === editingMessageId);
    const newText = editingText.trim();

    if (editedMsg && editedMsg.qKey) {
      const q = QUESTIONS.find(q => q.key === editedMsg.qKey);
      if (q) {
        setIsProcessing(true);
        const tempEventData = { ...eventData, [editedMsg.qKey!]: newText };
        const validation = await validateUserResponse(q.text, newText, tempEventData.preferred_language);

        if (!validation.valid) {
          setMessages(prev => [...prev, { 
            id: `bot-edit-err-${Date.now()}`,
            role: 'bot', 
            content: `⚠️ I noticed your update to "${q.key.replace('_', ' ')}": ${validation.message}`, 
            timestamp: new Date() 
          }]);
        } else {
          
          const newEventData = { ...eventData, [editedMsg.qKey!]: newText };
          const lang = newEventData.preferred_language;
          
          let ack = `Got it! I've updated the ${q.key.replace('_', ' ')} to: "${newText}". This change is now synchronized with the AI agents.`;
          
          if (editedMsg.qKey === 'preferred_language') {
            const normalized = normalizeLanguage(newText);
            if (normalized === 'tagalog') ack = `Sige po! In-update ko na ang iyong preferred language sa Tagalog. Gagamitin ko na ito sa mga susunod nating pag-uusap.`;
            else if (normalized === 'spanish') ack = `¡Entendido! He actualizado tu idioma preferido a español. Usaré este idioma a partir de ahora.`;
            else if (normalized === 'japanese') ack = `了解いたしました。優先言語を日本語に更新しました。これからは日本語で対応させていただきます。`;
          }

          setMessages(prev => [...prev, { 
            id: `bot-edit-ok-${Date.now()}`,
            role: 'bot', 
            content: ack, 
            timestamp: new Date() 
          }]);
          
          setEventData(newEventData);
        }
        setIsProcessing(false);
      } else {
        setEventData(prev => ({ ...prev, [editedMsg.qKey!]: newText }));
      }
    }

    setMessages(prev => prev.map(msg => msg.id === editingMessageId ? { ...msg, content: newText } : msg));
    setEditingMessageId(null);
    setEditingText("");
  };

  const filteredHistory = (Array.isArray(history) ? history : []).filter((item) => {
    const needle = historySearch.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
      item.rawInput,
      item.type,
      ...(item.messages || []).map((msg: any) => msg.content),
      ...(item.steps || []).map((step: any) => `${step.agent} ${JSON.stringify(step.data || {})}`)
    ].join(' ').toLowerCase();
    return haystack.includes(needle);
  });

  const exportBlueprint = () => {
    const blueprint = {
      exportedAt: new Date().toISOString(),
      customer: steps.find(s => s.agent.includes('Concierge'))?.data,
      menu: steps.find(s => s.agent.includes('Head Chef'))?.data,
      inventory: steps.find(s => s.agent.includes('Inventory'))?.data,
      suppliers: steps.find(s => s.agent.includes('Supplier'))?.data,
      logistics: steps.find(s => s.agent.includes('Logistics'))?.data,
      pricing: steps.find(s => s.agent.includes('Accountant'))?.data,
      monitoring: steps.find(s => s.agent.includes('Monitoring'))?.data,
      agentTrace: steps.map(step => ({ agent: step.agent, keys: Object.keys(step.data || {}) }))
    };
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caterflow-blueprint-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildSummaryRows = () => {
    const customer = steps.find(s => s.agent.includes('Concierge'))?.data || {};
    const menu = steps.find(s => s.agent.includes('Head Chef'))?.data || {};
    const inventory = steps.find(s => s.agent.includes('Inventory'))?.data || {};
    const suppliers = steps.find(s => s.agent.includes('Supplier'))?.data || {};
    const logistics = steps.find(s => s.agent.includes('Logistics'))?.data || {};
    const pricing = steps.find(s => s.agent.includes('Accountant'))?.data || {};
    const monitoring = steps.find(s => s.agent.includes('Monitoring'))?.data || {};
    return [
      ['Event Type', customer.event_type || '--'],
      ['Guests', customer.guests || '--'],
      ['Budget', customer.budget || '--'],
      ['Location', customer.location || '--'],
      ['Menu Items', (menu.menu || []).map((item: any) => item.dish).join('; ') || '--'],
      ['Procurement Weight', inventory.procurement_weight_kg ? `${inventory.procurement_weight_kg} kg` : '--'],
      ['Recommended Catering Shops', (suppliers.catering_shop_recommendations || []).slice(0, 3).map((shop: any) => `${shop.name} (${shop.match_score})`).join('; ') || '--'],
      ['Staffing', logistics.staffing_needs || '--'],
      ['Quote', pricing.optimized_quote || '--'],
      ['Margin', pricing.profit_margin || '--'],
      ['Readiness', monitoring.execution_readiness ? `${monitoring.execution_readiness}%` : '--'],
      ['Status', monitoring.overall_status || '--'],
    ];
  };

  const exportSummaryTable = () => {
    const rows = buildSummaryRows();
    const csv = ['Metric,Value', ...rows.map(([label, value]) => `"${String(label).replace(/"/g, '""')}","${String(value).replace(/"/g, '""')}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caterflow-summary-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const findStepData = (needles: string | string[]) => {
    const matchers = Array.isArray(needles) ? needles : [needles];
    return steps.find((step) => matchers.some((needle) => step.agent.includes(needle)))?.data || {};
  };

  const customerStep = findStepData('Concierge');
  const menuStep = findStepData('Head Chef');
  const inventoryStep = findStepData('Inventory');
  const supplierStep = findStepData('Supplier');
  const weatherStep = findStepData('Weather');
  const logisticsStep = findStepData('Logistics');
  const pricingStep = findStepData('Accountant');
  const monitoringStep = findStepData(['System Monitoring', 'Monitoring']);
  const nextBestActions = [
    ...(weatherStep.recommendations || []),
    ...(monitoringStep.qa_checks || []),
    ...(logisticsStep.timeline || []).slice(0, 2).map((item: any) => item.activity || item.event || item.note).filter(Boolean),
  ].filter(Boolean);

  const visibleSteps = steps.filter((step) => {
    if (reportView === 'all') return true;
    if (reportView === 'menu') return ['Concierge', 'RAG', 'Dietary', 'Head Chef', 'Weather', 'Contingency'].some(name => step.agent.includes(name));
    if (reportView === 'logistics') return ['Inventory', 'Supplier', 'Weather', 'Logistics', 'Sustainability', 'Monitoring'].some(name => step.agent.includes(name));
    return ['Accountant', 'Supplier', 'Monitoring', 'Shared Memory'].some(name => step.agent.includes(name));
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        await signupWithEmail(email, password, name, signupRole);
        setWorkspaceRole(signupRole);
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
      </div>
    );
  }

  if (!user && !showLogin) {
    return <LandingPage onStart={() => setShowLogin(true)} />;
  }

  if (!user) {
    return (
      <div className="login-shell min-h-screen w-full p-5 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,184,75,0.22),transparent_32%),linear-gradient(120deg,rgba(251,247,238,0.96),rgba(251,247,238,0.78))] pointer-events-none" />
        <div className="relative z-20 mx-auto mb-5 flex max-w-6xl items-center justify-between">
          <BrandLogo />
          <button
            type="button"
            onClick={() => setShowLogin(false)}
            className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-800"
          >
            Back
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 shadow-2xl shadow-slate-950/15 backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]"
        >
          <section className="relative hidden min-h-[660px] overflow-hidden p-8 lg:block">
            <img
              src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=85&w=1200"
              alt="Catering prep table"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/24 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-tomato"></span>
                Event ops workspace
              </div>
              <div className="max-w-xl space-y-5 text-white">
                <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.03em]">From client brief to service-ready plan.</h2>
                <p className="max-w-md text-sm leading-7 text-white/78">
                  Sign in to coordinate menu planning, procurement, logistics, pricing, and risk monitoring with your AI catering team.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-3">
                  {[
                    ["Menu", "portion plan"],
                    ["Stock", "procurement"],
                    ["Ops", "timeline"],
                  ].map(([title, subtitle]) => (
                    <div key={title} className="rounded-2xl border border-white/20 bg-white/14 p-4 backdrop-blur">
                      <p className="text-sm font-black">{title}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/60">{subtitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10 lg:p-12 text-slate-900 flex flex-col justify-center">
            <div className="mb-8 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
                Secure access
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-[-0.03em] text-slate-950">
                  {authMode === 'login' ? 'Welcome back.' : 'Create your workspace.'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {authMode === 'login'
                    ? 'Continue building catering plans with your saved event history.'
                    : 'Set up your CaterFlow account and start planning your first event.'}
                </p>
              </div>
            </div>

          <div className="space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="EX: JOHN DOE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Workspace Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['customer', 'Customer', 'Submit event brief, review menu, track plan'],
                      ['admin', 'Admin', 'Owner dashboard, pricing, supplier decisions'],
                      ['staff', 'Staff', 'Prep board, dispatch, execution tasks'],
                    ].map(([role, title, copy]) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupRole(role as WorkspaceRole)}
                        className={`rounded-2xl border p-4 text-left transition ${signupRole === role ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
                      >
                        <p className={`text-xs font-black uppercase tracking-[0.18em] ${signupRole === role ? 'text-emerald-800' : 'text-slate-700'}`}>{title}</p>
                        <p className="mt-2 text-[10px] leading-4 text-slate-500">{copy}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="USER@DOMAIN.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                required
              />
            </div>
            
            {authError && (
              <div className="bg-pink-500/10 p-4 border border-pink-500/30 mb-4 animate-shake">
                <p className="text-[11px] text-pink-400 font-mono font-bold uppercase">{authError}</p>
                {authError.includes('operation-not-allowed') && (
                  <p className="text-[10px] text-pink-400/80 mt-2 lowercase font-mono leading-relaxed">
                    CRITICAL: Email/Password login is locked. Enable it in Firebase Console (Auth &gt; Sign-in Method) or use Google Access.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-14 bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-all active:scale-[0.98] shadow-xl shadow-emerald-800/20 uppercase text-xs tracking-[0.18em] rounded-2xl"
            >
              {authMode === 'login' ? 'Secure Login' : 'Create Account'}
            </button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em]"><span className="bg-white px-3 text-slate-400 font-bold">or continue with</span></div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full min-h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.18em] shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
            Continue with Google
          </button>

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold pt-1">
            {authMode === 'login' ? "New operator?" : "Already registered?"}{" "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-emerald-700 font-bold hover:text-emerald-900 transition-colors underline decoration-emerald-500/30"
            >
              {authMode === 'login' ? 'Sign Up' : 'Return to Login'}
            </button>
          </p>
          </div>
          </section>
        </motion.div>
      </div>
    );
  }

  const showConversation = dashboardView === 'conversation' || dashboardView === 'summary';
  const showOperations = dashboardView === 'operations' || dashboardView === 'summary';
  const showFinance = dashboardView === 'finance' || dashboardView === 'summary';

  return (
    <div className={`app-shell flex flex-col h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${highContrast ? 'high-contrast' : ''}`}>
      {}
      <header className="h-14 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg text-white">C</div>
          <h1 className="text-sm font-bold tracking-[0.08em] text-slate-950">CaterFlow <span className="text-slate-400 font-normal text-[10px] ml-2 uppercase tracking-[0.18em] hidden sm:inline">Smart Catering Operations</span></h1>
        </div>
          <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Role</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{workspaceRole}</span>
          </div>
          <button 
            onClick={() => setShowAccessibilityPanel(true)}
            className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 transition-all"
            title="Accessibility Settings"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:bg-emerald-50 text-slate-500'}`}
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-[9px] font-mono uppercase tracking-tighter text-slate-500">Agents {isProcessing ? 'Planning' : 'Ready'}</span>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <img src={user.photoURL || null} className="w-6 h-6 rounded-full border border-slate-200" alt="User" />
            <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden relative">
        <div className="col-span-12 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dashboard Views</p>
          <div className="flex gap-2">
            {[
              ...(workspaceRole === 'customer' ? [['conversation', 'Brief'], ['summary', 'Plan'], ['menu-editor', 'Edit Menu'], ['checkout', 'Checkout']] : []),
              ...(workspaceRole === 'admin' ? [['summary', 'Plan'], ['admin-dashboard', 'Owner Dashboard'], ['shop-setup', 'My Shop'], ['finance', 'Finance']] : []),
              ...(workspaceRole === 'staff' ? [['operations', 'Ops'], ['staff-tasks', 'Tasks'], ['delivery', 'Delivery']] : []),
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDashboardView(key as any)}
                className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                  dashboardView === key ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-y-4 left-4 w-80 bg-white/95 backdrop-blur-xl rounded-3xl z-30 border border-slate-200 overflow-hidden flex flex-col shadow-2xl shadow-slate-950/15"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#fffaf0]">
                <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-emerald-800">Saved Conversations</h3>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-emerald-700 transition-all">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <div className="border-b border-slate-100 bg-white p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search conversations"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="group rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50">
                    <button onClick={() => loadFromHistory(item)} className="w-full text-left">
                      <p className="text-[10px] font-bold text-slate-700 truncate mb-1 group-hover:text-emerald-800 transition-colors uppercase">{item.rawInput}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] text-emerald-500/60 uppercase font-bold tracking-tighter">
                          {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Saved draft'}
                        </p>
                        <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-600 font-mono italic">{item.type || 'plan'} #{item.steps?.length || 0}A</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(item.id)}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">No saved conversation found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        {showConversation && <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4 overflow-hidden">
          <div className="high-density-card flex flex-col min-h-[520px]">
            <div className="high-density-header flex justify-between items-center">
              <div>
                <h2 className="high-density-label">Event Brief</h2>
                <p className="text-[11px] text-slate-500 mt-1">Answer a few questions. The agents handle the rest.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={saveConversation} className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-800 hover:text-sky-900 uppercase tracking-widest bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100">
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button onClick={restartChat} className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">New</button>
                {activeConversationId && (
                  <button onClick={() => deleteConversation()} className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 hover:text-rose-900 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            {}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fffaf0]" ref={chatScrollRef}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[88%] px-4 py-3 text-[13px] leading-relaxed relative rounded-3xl shadow-sm
                      ${msg.role === 'user' ? 'bg-emerald-700 text-white rounded-br-md' : 
                        msg.role === 'system' ? 'bg-amber-50 text-amber-800 w-full text-center border border-amber-100 rounded-2xl text-[11px] font-semibold' :
                        'bg-white text-slate-800 border border-slate-100 rounded-bl-md'}
                    `}>
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-20 w-full rounded-2xl border border-emerald-200 bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setEditingMessageId(null); setEditingText(""); }} className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
                              Cancel
                            </button>
                            <button type="button" onClick={commitEditMessage} className="rounded-full bg-emerald-700 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                              Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.content}
                          {msg.role === 'user' && (
                            <button
                              type="button"
                              onClick={() => startEditMessage(msg)}
                              className="ml-2 inline-flex align-middle text-white/70 transition hover:text-white"
                              title="Edit message"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                      <div className={`text-[9px] mt-2 opacity-45 ${msg.role === 'user' ? 'text-right text-white' : 'text-left text-slate-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {showSummary && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-950 uppercase tracking-[0.12em]">Review Event Details</h3>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Please check the details below. You can edit servings, food preferences, budget, or notes before the agents create the full plan.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {SUMMARY_FIELDS.filter((field) => field.key !== "special_requests" || eventData[field.key]).map((field) => (
                          <div
                            key={field.key}
                            className={`rounded-2xl border p-3 ${field.important ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
                          >
                            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                              {field.label}
                            </label>
                            {field.compact ? (
                              <input
                                value={String(eventData[field.key] || "")}
                                onChange={(e) => updateEventDataField(field.key, e.target.value)}
                                placeholder="Not provided"
                                className="w-full rounded-xl border border-white bg-white px-3 py-2 text-[12px] font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                              />
                            ) : (
                              <textarea
                                value={String(eventData[field.key] || "")}
                                onChange={(e) => updateEventDataField(field.key, e.target.value)}
                                placeholder="Not provided"
                                rows={2}
                                className="w-full resize-none rounded-xl border border-white bg-white px-3 py-2 text-[12px] font-semibold leading-5 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-[10px] font-bold leading-5 text-amber-800">
                          Is this correct? If the serving count or any food detail changed, edit it above before confirming.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                        <button
                          onClick={handleConfirmOrder}
                          className="flex-1 py-3 bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-800/15"
                        >
                          Confirm & Plan
                        </button>
                        <button
                          onClick={() => {
                            setIsConfirming(false);
                            setShowSummary(false);
                            setMessages(prev => [...prev, {
                              id: `bot-retry-${Date.now()}`,
                              role: 'bot',
                              content: "No problem! What else would you like to add or change?",
                              timestamp: new Date()
                            }]);
                          }}
                          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Add More
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {isProcessing && isChatting && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
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
                    placeholder={isProcessing ? "Planning..." : "Type your answer here"}
                    disabled={isProcessing || !isChatting}
                    className="w-full p-4 pr-24 bg-slate-50 text-slate-800 rounded-3xl text-sm leading-relaxed border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none min-h-[96px] placeholder:text-slate-400 transition-all outline-none"
                    required
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    >
                      {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !isChatting}
                      className="p-2.5 bg-emerald-700 text-white rounded-full hover:bg-emerald-800 disabled:bg-slate-300 transition-all shadow-lg shadow-emerald-800/15"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {}
          {steps.length > 0 && <div className="high-density-card flex flex-col max-h-72">
            <div className="high-density-header">
              <h2 className="high-density-label">Agent Progress</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
              {[
                { name: 'Knowledge Base & RAG', desc: 'Playbook Retrieval' },
                { name: 'CustomerAgent', desc: 'Requirement Extraction' },
                { name: 'DietaryAgent', desc: 'Allergen Safety' },
                { name: 'MenuAgent', desc: 'Menu + Nutrition' },
                { name: 'InventoryAgent', desc: 'Procurement Weights' },
                { name: 'SupplierAgent', desc: 'Market + Distance' },
                { name: 'WeatherAgent', desc: 'Live Risk' },
                { name: 'LogisticsAgent', desc: 'Traffic Timeline' },
                { name: 'PricingAgent', desc: 'Margin Audit' },
                { name: 'MonitoringAgent', desc: 'Readiness QA' },
                { name: 'Shared Memory', desc: 'Agent Handoffs' }
              ].map((agent, i) => {
                const isActive = currentStepIndex === i;
                const isCompleted = currentStepIndex > i;
                
                return (
                  <div key={agent.name} className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                    <div className={`
                      w-5 h-5 text-[8px] flex items-center justify-center flex-shrink-0 font-mono rounded-full
                      ${isActive ? 'bg-emerald-700 text-white animate-pulse' : ''}
                      ${isCompleted ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-400'}
                    `}>
                      <span>{isCompleted ? <CheckCircle2 className="w-3 h-3" /> : i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[9px] font-bold truncate ${isActive ? 'text-emerald-800' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {agent.name}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}
        </section>}

        {}
        <section className={`col-span-12 ${showConversation ? (steps.length > 0 ? 'lg:col-span-5' : 'lg:col-span-8') : 'lg:col-span-8'} flex flex-col space-y-4 h-[calc(100vh-140px)] min-h-0`}>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth custom-scrollbar pb-20" ref={scrollRef}>
            <AnimatePresence mode="popLayout">
              {steps.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full overflow-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm"
                >
                  <div className="grid h-full grid-cols-1 xl:grid-cols-[0.92fr_1.08fr]">
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 mb-6">
                        <ChefHat className="w-4 h-4" />
                        Ready to plan
                      </div>
                      <h3 className="text-4xl font-black tracking-[-0.03em] text-slate-950 max-w-md">
                        Build a catering plan from one conversation.
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-500 max-w-md">
                        Start with the event brief on the left. CaterFlow will assemble the menu, supplies, schedule, quote, and risk notes here.
                      </p>
                      <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
                        {[
                          ['Menu', 'Dishes and portions'],
                          ['Supplies', 'Procurement list'],
                          ['Schedule', 'Prep and delivery'],
                          ['Quote', 'Pricing and margin'],
                        ].map(([title, copy]) => (
                          <div key={title} className="rounded-2xl bg-[#fff7e8] border border-amber-100 p-4">
                            <p className="text-sm font-black text-slate-900">{title}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{copy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[360px]">
                      <img
                        src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=85&w=1000"
                        alt="Prepared catering table"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {steps.length > 0 && (
                <motion.div
                  key="plan-flow-overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Dashboard Flow</p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Brief to executable catering plan</h2>
                      <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                        Review the customer brief first, then inspect menu decisions, operations, and pricing from the selector below.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Current View</p>
                      <p className="text-sm font-black text-emerald-950">{reportView === 'menu' ? 'Menu Strategy' : reportView === 'logistics' ? 'Ops & Logistics' : reportView === 'finance' ? 'Finance' : 'Full Workflow'}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <InfoTile icon={<Users className="w-4 h-4" />} label="Servings" value={customerStep.guests || eventData.guest_count || '--'} />
                    <InfoTile icon={<Calendar className="w-4 h-4" />} label="Date" value={customerStep.date || eventData.event_date || '--'} />
                    <InfoTile icon={<MapPin className="w-4 h-4" />} label="Location" value={customerStep.location || eventData.event_location || '--'} />
                    <InfoTile icon={<DollarSign className="w-4 h-4" />} label="Quote" value={pricingStep.optimized_quote || '--'} />
                    <InfoTile icon={<ShieldCheck className="w-4 h-4" />} label="Readiness" value={monitoringStep.execution_readiness ? `${monitoringStep.execution_readiness}%` : isProcessing ? 'Planning' : '--'} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-5">
                    {['Brief', 'Menu', 'Procurement', 'Logistics', 'Quote'].map((item, index) => (
                      <div key={item} className={`rounded-xl border px-3 py-2 ${index <= (monitoringStep.execution_readiness ? 4 : steps.length > 5 ? 2 : 1) ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-slate-50'}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {}
              {Object.keys(monitoringStep).length > 0 && (
                <motion.div
                  key="final-summary-highlight"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 bg-gradient-to-br from-indigo-600 via-emerald-600 to-fuchsia-700 text-white space-y-5 shadow-[0_20px_50px_rgba(79,70,229,0.4)] relative overflow-hidden group border border-white/20"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-white/10 py-6">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase font-mono italic">Smart Catering Plan</h2>
                      <p className="text-emerald-100/60 text-[10px] font-bold mt-1">Multi-agent orchestration complete. Ready for export.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={saveConversation}
                        className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white border border-white/20 hover:bg-white/25 transition"
                      >
                        Save Plan
                      </button>
                      <button
                        onClick={exportSummaryTable}
                        className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white border border-white/20 hover:bg-white/25 transition"
                      >
                        Save CSV
                      </button>
                      <button
                        onClick={exportBlueprint}
                        className="rounded-full bg-white/10 bg-emerald-500/20 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white border border-white/30 hover:bg-emerald-500/30 transition shadow-xl"
                      >
                        Export Full Blueprint
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <span className="text-[8px] uppercase font-bold text-emerald-200/60 block">INTEGRATED_SUMMARY</span>
                    <p className="text-sm font-medium text-white font-mono leading-relaxed bg-black/20 p-3 border-l-2 border-emerald-400">
                      {monitoringStep.final_summary || 'Synchronizing final data...'}
                    </p>
                  </div>
                  <div className="relative z-10 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                    <div className="grid grid-cols-2 border-b border-white/10 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-emerald-100/70">
                      <span>Metric</span>
                      <span>Value</span>
                    </div>
                    {buildSummaryRows().slice(0, 8).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-2 gap-3 border-b border-white/10 px-3 py-2 text-[10px] last:border-0">
                        <span className="font-black uppercase tracking-widest text-white/55">{label}</span>
                        <span className="font-semibold text-white/90">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {steps.find(s => s.agent === 'Executive Brief Agent')?.data?.judge_pitch && (
                    <div className="relative z-10 rounded-2xl bg-white/12 border border-white/15 p-4">
                      <span className="text-[8px] uppercase font-bold text-emerald-100/70 block mb-2 tracking-widest">JUDGE PITCH</span>
                      <p className="text-sm leading-6 text-white/90">
                        {steps.find(s => s.agent === 'Executive Brief Agent')?.data?.judge_pitch}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {}
              <div key="agent-reports-container" className="space-y-12">
                {steps.length > 0 && (
                  <div className="sticky top-0 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-6 py-3 shadow-md backdrop-blur-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Orchestration View</div>
                    </div>
                    <select
                      value={reportView}
                      onChange={(e) => setReportView(e.target.value as any)}
                      className="bg-transparent text-[11px] font-black uppercase tracking-widest text-emerald-700 outline-none cursor-pointer hover:text-emerald-900 transition-colors"
                    >
                      <option value="menu">Start Here: Brief + Menu</option>
                      <option value="logistics">Ops: Supplies + Delivery</option>
                      <option value="finance">Finance: Quote + Readiness</option>
                      <option value="all">Full Agent Trace</option>
                    </select>
                  </div>
                )}

                {[
                  {
                    id: 'phase-1',
                    title: 'Phase 1: Concierge',
                    subtitle: 'Intake & Requirement Engineering',
                    desc: 'Extracting user intent, cultural adaptation, and dietary constraints.',
                    agents: ['Phase 1: Concierge (User Intent)', 'Knowledge Base & RAG Agent', 'Dietary & Allergens Specialist']
                  },
                  {
                    id: 'phase-2',
                    title: 'Phase 2: Head Chef',
                    subtitle: 'Creative Design & Risk Analysis',
                    desc: 'Menu engineering balanced with weather risks and location intelligence.',
                    agents: ['Phase 2: Head Chef (Menu Design)', 'Weather Intelligence', 'Contingency & Plan B Specialist']
                  },
                  {
                    id: 'phase-3',
                    title: 'Phase 3: Accountant',
                    subtitle: 'Financial & Resource Optimization',
                    desc: 'Cost audit, procurement mapping, and profit margin protection.',
                    agents: ['Phase 3: Accountant (Cost Optimization)', 'Inventory & Procurement Specialist', 'Supplier Intelligence Specialist', 'Sustainability & Impact Specialist']
                  },
                  {
                    id: 'phase-4',
                    title: 'Phase 4: Logistics Lead',
                    subtitle: 'Operational Execution',
                    desc: 'T-minus timelines, staffing allocation, and delivery routing.',
                    agents: ['Phase 4: Logistics Lead (Execution)']
                  },
                  {
                    id: 'core-systems',
                    title: 'Core AI Systems',
                    subtitle: 'Integrity & Memory',
                    desc: 'Cross-agent coordination, decision logging, and system health.',
                    agents: ['Shared Memory Ledger', 'System Monitoring & QA']
                  }
                ].map((phase) => {
                  const phaseSteps = visibleSteps.filter(s => phase.agents.some(name => s.agent.includes(name)));
                  if (phaseSteps.length === 0) return null;

                  return (
                    <div key={phase.id} className="space-y-6 relative">
                      <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-4 py-2 bg-gradient-to-r from-emerald-50 to-transparent">
                        <div className="flex items-center gap-2">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{phase.title}</h3>
                           <span className="text-[10px] text-emerald-600 font-bold tracking-widest">{phase.subtitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{phase.desc}</p>
                      </div>
                      <div className="space-y-4">
                        {phaseSteps.map((step, idx) => {
                          const realIndex = steps.indexOf(step);
                          return (
                            <motion.div
                              key={`phase-step-${step.agent}-${realIndex}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={steps.find(s => s.agent.includes('Monitoring')) && !step.agent.includes('Monitoring') && !step.agent.includes('Shared Memory') ? "opacity-60 hover:opacity-100 transition-opacity" : ""}
                            >
                              <AgentReport 
                                step={step} 
                                isExpanded={expandedStepIndex === realIndex}
                                onToggle={() => setExpandedStepIndex(expandedStepIndex === realIndex ? null : realIndex)}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {dashboardView === 'menu-editor' && (
                <MenuEditor 
                  menu={localMenu} 
                  onChange={(newMenu) => setLocalMenu(newMenu)} 
                />
              )}
              {dashboardView === 'admin-dashboard' && (
                <AdminDashboard 
                  inventory={localInventory}
                  pricing={pricingStep}
                />
              )}
              {dashboardView === 'staff-tasks' && (
                <StaffTaskBoard 
                  tasks={staffTasks}
                  onToggle={(index) => {
                    const newTasks = [...staffTasks];
                    newTasks[index].completed = !newTasks[index].completed;
                    setStaffTasks(newTasks);
                  }}
                />
              )}
              {dashboardView === 'shop-setup' && (
                <AdminShopSetup 
                  profile={shopProfile} 
                  onSave={async (data) => {
                    const saved = await mongoService.saveShop(data);
                    setShopProfile(saved);
                  }} 
                />
              )}
              {dashboardView === 'checkout' && (
                <CheckoutPortal 
                  shop={matchedShop}
                  event={eventData}
                  blueprint={steps}
                  status={agreementStatus}
                  onAccept={() => setAgreementStatus('accepted')}
                  onFinalize={() => setAgreementStatus('finalized')}
                />
              )}
              {dashboardView === 'delivery' && (
                <DriverView 
                  event={eventData}
                  logistics={logisticsStep}
                />
              )}
            </AnimatePresence>
          </div>
        </section>

        {steps.length > 0 && (showOperations || showFinance) && (
          <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4">
            <div className="high-density-card flex flex-col">
              <div className="high-density-header">
                <h2 className="high-density-label">Plan Snapshot</h2>
                <Utensils className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="p-4 space-y-4">
                {steps.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoTile icon={<Users className="w-4 h-4" />} label="Guests" value={customerStep.guests || eventData.guest_count || '--'} />
                      <InfoTile icon={<MapPin className="w-4 h-4" />} label="Location" value={customerStep.location || eventData.event_location || '--'} />
                      <InfoTile icon={<Calendar className="w-4 h-4" />} label="Date" value={customerStep.date || eventData.event_date || '--'} />
                      <InfoTile icon={<ChefHat className="w-4 h-4" />} label="Menu Items" value={(menuStep.menu || []).length || '--'} />
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Next Best Actions</p>
                      {nextBestActions.slice(0, 3).map((item: string, i: number) => (
                        <p key={i} className="text-[10px] text-slate-600 leading-relaxed">- {item}</p>
                      ))}
                      {nextBestActions.length === 0 && (
                        <p className="text-[10px] text-slate-500 leading-relaxed">Run the planner to generate next actions.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Catering plan appears here after intake</p>
                  </div>
                )}
              </div>
            </div>

            {showOperations && (
              <>
                <GeoOpsLeafletMap
                  role={workspaceRole}
                  customer={customerStep}
                  inventory={inventoryStep}
                  logistics={logisticsStep}
                />
                <RoleWorkspace role={workspaceRole} monitoring={monitoringStep} pricing={pricingStep} />
                <ProblemStatementFit stackStatus={stackStatus} />
                <div className="high-density-card flex flex-col">
                  <div className="high-density-header">
                    <h2 className="high-density-label">Readiness</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    {Object.keys(monitoringStep).length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="border border-emerald-100 bg-emerald-50 rounded-2xl p-3">
                             <div className="text-lg font-black text-emerald-800 tracking-tighter">{monitoringStep.execution_readiness}%</div>
                             <div className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">Readiness</div>
                          </div>
                          <div className="border border-emerald-100 bg-white rounded-2xl p-3">
                             <div className="text-lg font-black text-slate-800 tracking-tighter">{monitoringStep.overall_status?.toUpperCase() || 'UNKNOWN'}</div>
                             <div className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">Status</div>
                          </div>
                        </div>
                        <div className="p-3 bg-[#fff7e8] rounded-2xl border border-amber-100">
                          <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                            {monitoringStep.final_summary || 'Protocols finalising...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-emerald-900/40 py-12">
                        <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Plan review pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {showFinance && (
              <div className="high-density-card flex flex-col">
                <div className="high-density-header">
                  <h2 className="high-density-label">Pricing</h2>
                </div>
                <div className="p-4 flex-1">
                  {Object.keys(pricingStep).length > 0 ? (
                    <PricingInsight data={pricingStep} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-900/40 py-12">
                      <DollarSign className="w-12 h-12 mb-2 opacity-20" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] font-mono">Profit_Analysis_Hold</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="h-10 bg-white/90 border-t border-slate-200 px-6 flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase tracking-[0.24em] flex-shrink-0 z-20">
        <div>CaterFlow Smart Catering Planner</div>
        <div className="flex items-center space-x-6">
          <span className="hidden sm:inline">Customer to menu to inventory to logistics to pricing</span>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>Planner ready</span>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {showAccessibilityPanel && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-slate-950">CaterFlow Accessibility</h3>
                <button onClick={() => setShowAccessibilityPanel(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">High Contrast Mode</p>
                    <p className="text-xs text-slate-500">Pure black and high visibility colors</p>
                  </div>
                  <button 
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-12 h-6 rounded-full transition-all relative ${highContrast ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${highContrast ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Text-to-Speech (TTS)</p>
                    <p className="text-xs text-slate-500">Read bot responses aloud</p>
                  </div>
                  <button 
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${ttsEnabled ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ttsEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">Screen Reader Tip</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Use <kbd className="bg-white border border-slate-200 px-1 rounded text-[10px]">Tab</kbd> to navigate between roles and menu items. Press <kbd className="bg-white border border-slate-200 px-1 rounded text-[10px]">Space</kbd> to toggle tasks.
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-50">
                <button 
                  onClick={() => setShowAccessibilityPanel(false)}
                  className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-slate-950/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to CaterFlow!",
      desc: "CaterFlow is your digital partner for managing your catering business. We help you organize everything from menus to delivery using Smart AI Agents.",
      icon: <ChefHat className="w-8 h-8 text-emerald-600" />
    },
    {
      title: "Talk to our AI",
      desc: "No complex forms needed. Just tell our Customer Agent your event details (date, guest count, budget) and let us handle the heavy lifting.",
      icon: <Users className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Smart Orchestration",
      desc: "Our team of 11 AI Agents work simultaneously to generate your menu, inventory list, logistics plan, and pricing analysis in seconds.",
      icon: <Package className="w-8 h-8 text-amber-600" />
    },
    {
      title: "Manage with Ease",
      desc: "Once planned, everything is available in your Dashboard. Chat with delivery drivers, check receipts, and finalize every detail of your event.",
      icon: <Truck className="w-8 h-8 text-rose-600" />
    },
    {
      title: "Multi-Role Workspace",
      desc: "CaterFlow adapts to you. Switch between Owner view to manage your shop, Staff view for delivery tasks, or Customer view to track your own event.",
      icon: <ShieldCheck className="w-8 h-8 text-emerald-700" />
    }
  ];
  return (
    <div className="landing-shell min-h-screen w-full overflow-hidden text-slate-950">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLogo />
        <button
          onClick={onStart}
          className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          Sign in
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-10 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-tomato"></span>
            Multi-agent catering planner
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.03em] text-slate-950 sm:text-7xl">
              Plan beautiful events without the operations mess.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              CaterFlow turns one customer brief into a menu, procurement list, logistics timeline, quote, and risk monitor through a coordinated AI catering team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-emerald-700 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-2xl shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Start planning
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="rounded-full border border-slate-300 bg-white/80 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            >
              Show tutorial
            </button>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-3 pt-4">
            {[
              ["11", "specialist agents"],
              ["1", "complete event plan"],
              ["0", "spreadsheet chaos"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-3xl font-black text-emerald-800">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preview" className="relative">
          <div className="landing-plate-card overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
            <div className="relative h-[520px] overflow-hidden rounded-[1.5rem] bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1529539795054-3c162aab037a?auto=format&fit=crop&q=85&w=1000"
                alt="Catered table"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
                <BrandLogo compact />
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Live plan</span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 grid gap-3">
                {[
                  ["Menu Agent", "6 dishes balanced for allergies and budget", "bg-emerald-500"],
                  ["Inventory Agent", "Procurement list and supplier match ready", "bg-amber-500"],
                  ["Logistics Agent", "Prep, delivery, staffing timeline generated", "bg-rose-500"],
                ].map(([agent, copy, dot]) => (
                  <div key={agent} className="rounded-2xl bg-white/92 p-4 shadow-lg backdrop-blur">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`}></span>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-900">{agent}</p>
                    </div>
                    <p className="text-sm text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
              
              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                    Step {tutorialStep + 1} of {tutorialSteps.length}
                  </div>
                  <div className="flex gap-1">
                    {tutorialSteps.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i === tutorialStep ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="min-h-[200px]"
                  >
                    <div className="mb-6 p-4 bg-slate-50 w-fit rounded-3xl">
                      {tutorialSteps[tutorialStep].icon}
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-950 mb-6">{tutorialSteps[tutorialStep].title}</h2>
                    <p className="text-lg text-slate-500 leading-relaxed max-w-lg">{tutorialSteps[tutorialStep].desc}</p>
                  </motion.div>
                </AnimatePresence>
                
                <div className="mt-12 flex gap-4">
                  {tutorialStep > 0 && (
                    <button 
                      onClick={() => setTutorialStep(prev => prev - 1)}
                      className="px-8 py-5 border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Back
                    </button>
                  )}
                  
                  {tutorialStep < tutorialSteps.length - 1 ? (
                    <button 
                      onClick={() => setTutorialStep(prev => prev + 1)}
                      className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowTutorial(false);
                        setTutorialStep(0);
                      }}
                      className="flex-1 py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20"
                    >
                      Done, I'm ready
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} brand-mark grid place-items-center rounded-2xl text-white shadow-lg shadow-emerald-900/20`}>
        <ChefHat className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <div>
        <p className={`${compact ? 'text-sm' : 'text-lg'} brand-word font-black leading-none tracking-[-0.02em] text-slate-950`}>CaterFlow</p>
        {!compact && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Smart event operations</p>}
      </div>
    </div>
  );
}

function GeoOpsMap({ role, customer, inventory, logistics }: { role: WorkspaceRole, customer: any, inventory: any, logistics: any }) {
  const suppliers = inventory?.supplier_matches?.length > 0
    ? inventory.supplier_matches.slice(0, 4)
    : [
      { name: 'FreshLine Produce', score: '94%', category: 'Produce' },
      { name: 'Harbor Cold Chain', score: '91%', category: 'Cold chain' },
      { name: 'PantryLink Wholesale', score: '88%', category: 'Dry goods' },
    ];
  const cateringShops = inventory?.catering_shop_recommendations?.length > 0
    ? inventory.catering_shop_recommendations.slice(0, 4)
    : [
      { name: 'Casa Mesa Catering Studio', area: 'BGC Taguig', match_score: '94%', estimated_quote_php: 135000, estimated_distance_km: 1.2, within_budget: true, specialties: 'Filipino-Spanish buffet' },
      { name: 'Halal Harvest Events', area: 'Pasig', match_score: '89%', estimated_quote_php: 125000, estimated_distance_km: 7.8, within_budget: true, specialties: 'Halal and vegetarian trays' },
      { name: 'Green Spoon Plant-Based Catering', area: 'Mandaluyong', match_score: '84%', estimated_quote_php: 115000, estimated_distance_km: 6.1, within_budget: true, specialties: 'Vegan and low-waste packages' },
    ];
  const mapCandidates = role === 'customer' ? cateringShops : suppliers;

  const markers = [
    { label: 'Venue', type: 'venue', top: '56%', left: '58%', detail: customer.location || 'Event venue' },
    ...mapCandidates.map((supplier: any, i: number) => ({
      label: supplier.name || supplier.supplier || `Option ${i + 1}`,
      type: role === 'customer' ? 'shop' : 'supplier',
      top: `${24 + (i * 17) % 55}%`,
      left: `${18 + (i * 23) % 62}%`,
      detail: supplier.specialties || supplier.category || supplier.reason || supplier.score || 'Supplier option'
    }))
  ];

  const staffTasks = logistics?.timeline?.slice(0, 3) || [
    { time: 'T-4h', activity: 'Kitchen prep and packaging check' },
    { time: 'T-2h', activity: 'Dispatch vehicle and equipment load' },
    { time: 'T-45m', activity: 'Venue setup and service briefing' },
  ];

  return (
    <div className="high-density-card flex flex-col">
      <div className="high-density-header">
        <div>
          <h2 className="high-density-label">{role === 'admin' ? 'Supplier Map' : role === 'staff' ? 'Staff Route' : 'Event Location'}</h2>
          <p className="text-[10px] text-slate-500 mt-1">
            {role === 'admin'
              ? 'Compare supplier proximity and backup options.'
              : role === 'staff'
                ? 'Delivery and setup tasks for operations staff.'
                : 'Customer-facing venue, delivery, and event readiness view.'}
          </p>
        </div>
        <MapPin className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="p-4 space-y-4">
        <div className="relative h-56 overflow-hidden rounded-3xl border border-slate-100 bg-[#edf7ef]">
          <div className="absolute inset-0 opacity-70" style={{
            backgroundImage: 'linear-gradient(rgba(22,101,52,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(22,101,52,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
          <div className="absolute left-[20%] top-[20%] h-[70%] w-[55%] rotate-[-18deg] rounded-full border-2 border-dashed border-emerald-300/70" />
          <div className="absolute left-[30%] top-[36%] h-[1px] w-[48%] rotate-[22deg] bg-emerald-500/50" />
          {markers.map((marker, i) => (
            <div
              key={`${marker.label}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ top: marker.top, left: marker.left }}
            >
              <div className={`grid h-9 w-9 place-items-center rounded-full border-2 shadow-lg ${marker.type === 'venue' ? 'bg-emerald-700 text-white border-white' : marker.type === 'shop' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-amber-700 border-amber-200'}`}>
                {marker.type === 'venue' ? <MapPin className="w-4 h-4" /> : marker.type === 'shop' ? <ChefHat className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-10 z-10 hidden w-40 -translate-x-1/2 rounded-2xl bg-white p-3 text-xs shadow-xl group-hover:block">
                <p className="font-black text-slate-900">{marker.label}</p>
                <p className="mt-1 text-[10px] text-slate-500">{marker.detail}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-3 left-3 rounded-2xl bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
            {customer.location || 'Venue location pending'}
          </div>
        </div>

        {role === 'admin' ? (
          <div className="space-y-2">
            {suppliers.slice(0, 3).map((supplier: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
                <div>
                  <p className="text-xs font-black text-slate-800">{supplier.name || supplier.supplier}</p>
                  <p className="text-[10px] text-slate-500">{supplier.reason || supplier.category || 'Supplier candidate'}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">{supplier.score || supplier.reliability || 'OK'}</span>
              </div>
            ))}
          </div>
        ) : role === 'staff' ? (
          <div className="space-y-2">
            {staffTasks.map((task: any, i: number) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 h-fit">{task.time || `Stop ${i + 1}`}</span>
                <p className="text-xs font-semibold text-slate-700">{task.activity || task.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Optional Nearby Catering Shops</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                {inventory?.customer_recommendation_note || 'Suggested shops appear after the customer budget and venue are known.'}
              </p>
            </div>
            {cateringShops.slice(0, 3).map((shop: any, i: number) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-800">{shop.name}</p>
                    <p className="text-[10px] text-slate-500">{shop.area} • {shop.estimated_distance_km} km</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black ${shop.within_budget ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                    {shop.within_budget ? 'Within Budget' : 'Over Budget'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                  <span className="text-[10px] font-bold text-slate-500">{shop.specialties}</span>
                  <span className="text-[10px] font-black text-emerald-700">PHP {Number(shop.estimated_quote_php || 0).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-500">{shop.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleWorkspace({ role, monitoring, pricing }: { role: WorkspaceRole, monitoring: any, pricing: any }) {
  const rows = role === 'customer'
    ? [
      ['Plan status', monitoring ? `${monitoring.execution_readiness}% ready` : 'Waiting for event brief'],
      ['Customer quote', pricing?.optimized_quote || 'Quote appears after planning'],
      ['Next update', monitoring?.overall_status === 'green' ? 'Ready for approval' : 'Planner still checking risks'],
    ]
    : role === 'admin'
      ? [
      ['Quote', pricing?.optimized_quote || 'Pending'],
      ['Margin', pricing?.profit_margin || 'Pending'],
      ['Readiness', monitoring?.execution_readiness ? `${monitoring.execution_readiness}%` : 'Pending'],
    ]
    : [
      ['Prep board', monitoring ? 'Ready for assignment' : 'Pending'],
      ['Risk flags', monitoring?.overall_status || 'Pending'],
      ['Dispatch', monitoring ? 'Awaiting route confirm' : 'Pending'],
    ];

  return (
    <div className="high-density-card">
      <div className="high-density-header">
        <div>
          <h2 className="high-density-label">{role === 'customer' ? 'Customer Portal' : role === 'admin' ? 'Owner View' : 'Staff View'}</h2>
          <p className="text-[10px] text-slate-500 mt-1">
            {role === 'customer'
              ? 'Event request, quote, and readiness updates for the client.'
              : role === 'admin'
                ? 'Business summary for the catering owner.'
                : 'Execution board for logistics staff.'}
          </p>
        </div>
        {role === 'customer' ? <Users className="w-4 h-4 text-emerald-600" /> : role === 'admin' ? <DollarSign className="w-4 h-4 text-emerald-600" /> : <Truck className="w-4 h-4 text-emerald-600" />}
      </div>
      <div className="p-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className="text-xs font-black text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemStatementFit({ stackStatus }: { stackStatus: any }) {
  const requirements = [
    ['Multi-agent orchestration', '9 collaborating agents'],
    ['Customer to pricing flow', 'End-to-end blueprint'],
    ['Shared memory', 'Ledger + handoffs'],
    ['RAG / knowledge base', 'Azure Search + fallback'],
    ['Execution insights', 'Weather, traffic, readiness'],
  ];
  const requiredStack = stackStatus?.requiredStack || {};
  const stackRows = [
    ['Microsoft Agent Framework', requiredStack.microsoftAgentFramework?.status || 'implemented'],
    ['Microsoft Foundry', requiredStack.microsoftFoundry?.status || 'checking'],
    ['Azure AI Search', requiredStack.azureAiSearch?.status || 'checking'],
    ['LLM runtime', stackStatus?.activeDemoRuntime || 'checking'],
  ];

  return (
    <div className="high-density-card">
      <div className="high-density-header">
        <div>
          <h2 className="high-density-label">Problem Fit</h2>
          <p className="text-[10px] text-slate-500 mt-1">iNextLabs catering requirements mapped in-app.</p>
        </div>
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="p-4 space-y-2">
        {requirements.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            <span className="text-[10px] font-black text-emerald-700 text-right">{value}</span>
          </div>
        ))}
        <div className="rounded-2xl border border-amber-100 bg-[#fff7e8] p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Required Stack</p>
          <div className="mt-2 space-y-1">
            {stackRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className="font-black text-emerald-700 text-right">{String(value).replaceAll('_', ' ')}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-600">
            Agent Framework and Foundry path live in the Python backend; Azure AI Search powers RAG when credentials are set, otherwise local menus and suppliers keep the demo running.
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentReport({ step, isExpanded, onToggle }: { step: AgentStep, isExpanded: boolean, onToggle: () => void }) {
  const { agent, data } = step;

  const getStatusColor = (agent: string) => {
    if (agent.includes('Concierge')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (agent.includes('Head Chef')) return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    if (agent.includes('Accountant')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (agent.includes('Logistics Lead')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (agent.includes('RAG')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (agent.includes('Dietary')) return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    if (agent.includes('Weather')) return 'bg-sky-50 text-sky-700 border-sky-100';
    if (agent.includes('Monitoring')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (agent.includes('Shared Memory')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getStatusText = (agent: string) => {
    if (agent.includes('Concierge')) return 'INTENT';
    if (agent.includes('Head Chef')) return 'DESIGN';
    if (agent.includes('Accountant')) return 'OPTIMIZE';
    if (agent.includes('Logistics Lead')) return 'EXECUTE';
    if (agent.includes('RAG')) return 'KNOWLEDGE';
    if (agent.includes('Monitoring')) return 'SECURE';
    if (agent.includes('Shared Memory')) return 'TRACE';
    return 'READY';
  };

  const renderContent = () => {
    switch (agent) {
      case 'Knowledge Base & RAG Agent':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.retrieved_playbooks || data.knowledge || []).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="bg-[#fff7e8] p-4 border border-amber-100 rounded-2xl">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block mb-1 tracking-widest">{item.id || `playbook-${i + 1}`}</span>
                  <p className="text-sm font-black text-slate-900 tracking-tight mb-2">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.guidance}</p>
                </div>
              ))}
            </div>
            <div className="border border-slate-100 bg-white p-4 rounded-2xl">
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block mb-3">Supplier Context</span>
              <div className="grid grid-cols-2 gap-2">
                {(data.supplier_sources || []).slice(0, 4).map((supplier: any, i: number) => (
                  <div key={i} className="flex justify-between gap-2 text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-700 truncate font-semibold">{supplier.name}</span>
                    <span className="text-emerald-400 font-bold">{supplier.reliability}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Phase 1: Concierge (User Intent)':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="proto" value={data.event_type} />
              <InfoItem label="zone" value={data.location} />
              <InfoItem label="pref" value={data.cuisine_preference} />
              <InfoItem label="style" value={data.service_style} />
            </div>
            {data.cultural_profile && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-700">Language + Culture (Winning Feature)</p>
                <p className="mt-2 text-xs leading-5 text-slate-700">
                  {data.cultural_profile.language} input detected. {data.cultural_profile.adaptation}
                </p>
              </div>
            )}
          </div>
        );
      case 'Dietary & Allergens Specialist':
        return (
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Dietary Safety Specialist</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose-50 p-4 border border-rose-100 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1 tracking-tight">Allergies Detected</span>
                <p className="text-xs text-slate-700 font-medium">{data.allergens_to_avoid?.length > 0 ? data.allergens_to_avoid.join(', ') : 'None'}</p>
              </div>
              <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1 tracking-tight">Dietary Recommendations</span>
                <p className="text-xs text-slate-700 font-medium">{data.recommended_labels?.length > 0 ? data.recommended_labels.join(', ') : 'None'}</p>
              </div>
            </div>
          </div>
        );
      case 'Phase 2: Head Chef (Menu Design)':
        return (
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2 inline-flex">Phase 2 Collaboration: {data.dietary_compliance || "Balanced Selection"}</div>
            {data.cultural_adaptation && (
              <p className="rounded-2xl border border-amber-100 bg-[#fff7e8] p-3 text-xs font-semibold leading-5 text-slate-700">
                {data.cultural_adaptation}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.menu || data.dishes)?.map((item: any, i: number) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col group transition-all hover:border-emerald-200 shadow-sm">
                  <div className="h-44 w-full bg-slate-100 relative">
                    <img 
                      src={item.image_url || null} 
                      alt={item.dish} 
                      className="w-full h-full object-cover transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                       <span className="text-sm font-black text-white tracking-tight line-clamp-1">{item.dish}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 min-h-[3rem]">{item.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Portion</span>
                      <span className="text-[10px] text-emerald-700 font-bold">{item.portion_per_guest}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data.nutrition_summary?.per_guest_estimate && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-3">Head Chef Nutrition Summary</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Calories', data.nutrition_summary.per_guest_estimate.calories],
                    ['Protein', `${data.nutrition_summary.per_guest_estimate.protein_g}g`],
                    ['Carbs', `${data.nutrition_summary.per_guest_estimate.carbs_g}g`],
                    ['Fat', `${data.nutrition_summary.per_guest_estimate.fat_g}g`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-2">
                      <p className="text-sm font-black text-slate-900">{value}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'Inventory & Procurement Specialist':
        return (
          <div className="flex-1 space-y-3">
            <div className="bg-amber-50 p-3 border border-amber-100 rounded-2xl">
              <span className="text-[9px] font-bold text-amber-700 uppercase block mb-1 tracking-widest">Procurement Specialist Insight</span>
              <p className="text-xs text-slate-600">
                {data.potential_shortages?.length > 0 ? data.potential_shortages.join(', ') : 'No inventory conflicts detected in Microsoft Agent Framework scan.'}
              </p>
            </div>
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr className="text-left uppercase text-[9px] tracking-widest font-bold">
                  <th className="pb-1">Specialist_Procurement</th>
                  <th className="pb-1">Qty</th>
                  <th className="pb-1">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {data.procurement_list?.slice(0, 5).map((ing: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-emerald-50 transition-colors">
                    <td className="py-1 uppercase">{ing.item}</td>
                    <td className="py-1">{ing.qty}</td>
                    <td className="py-1 text-emerald-700 font-bold">Validated</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'Supplier Intelligence Specialist':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-[#fff7e8] p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Strategic Implementation Advice</p>
              <p className="mt-2 text-xs leading-5 text-slate-700">{data.optimization_strategy}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.supplier_matches || []).slice(0, 4).map((supplier: any, i: number) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{supplier.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{supplier.market}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">{supplier.score}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <InfoItem label="distance" value={`${supplier.estimated_distance_km} km`} />
                    <InfoItem label="traffic" value={`${supplier.traffic_buffer_minutes} min`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Phase 3: Accountant (Cost Optimization)':
        return (
          <div className="space-y-5">
             <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.28em]">Phase 3 Optimized Quote</span>
                <p className="mt-3 text-5xl font-black text-slate-950 tracking-tight">{data.optimized_quote}</p>
                <p className="mt-3 text-xs text-slate-600">{data.pricing_strategy}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 border border-slate-100 rounded-2xl">
                   <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cost Per Guest</span>
                   <p className="text-2xl font-black text-slate-900">{data.unit_cost}</p>
                </div>
                <div className="bg-white p-5 border border-slate-100 rounded-2xl">
                   <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Profit Yield</span>
                   <p className="text-2xl font-black text-emerald-700">{data.profit_margin}</p>
                </div>
             </div>
          </div>
        );
      case 'Real-Time Simulation Agent':
        return (
          <div className="space-y-4 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data.timeline_ticks || data.ticks || []).slice(0, 6).map((tick: any, i: number) => (
                <div key={i} className="border border-orange-500/20 bg-orange-500/5 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-orange-400 font-black uppercase">{tick.time || tick.stage || `T+${i}`}</span>
                    <span className="text-[8px] text-emerald-400/70 uppercase">{tick.status || 'simulated'}</span>
                  </div>
                  <p className="text-[9px] text-orange-100/70 leading-relaxed">{tick.event || tick.activity || tick.note}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-pink-500/5 border border-pink-500/20 p-3">
                <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest block mb-2">Live Risks</span>
                {(data.live_risks || []).slice(0, 4).map((risk: string, i: number) => (
                  <p key={i} className="text-[9px] text-pink-100/70 leading-relaxed">- {risk}</p>
                ))}
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3">
                <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest block mb-2">Mitigation Queue</span>
                {(data.mitigation_queue || []).slice(0, 4).map((item: string, i: number) => (
                  <p key={i} className="text-[9px] text-emerald-100/70 leading-relaxed">- {item}</p>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Contingency & Plan B Specialist':
      case 'Contingency Agent':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['Weather Plan B', data.weather_plan_b],
              ['Supplier Backup', data.supplier_backup_plan],
              ['Staffing Backup', data.staffing_backup_plan],
              ['Trigger Points', Array.isArray(data.trigger_points) ? data.trigger_points.join(', ') : data.trigger_points],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-2">{label}</p>
                <p className="text-[11px] leading-5 text-slate-700">{String(value || 'No issue detected.')}</p>
              </div>
            ))}
          </div>
        );
      case 'Sustainability & Impact Specialist':
      case 'Sustainability & Waste Agent':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-lime-700">Impact Score</p>
                <p className="text-3xl font-black text-lime-800 mt-2">{data.impact_score || '--'}</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-white p-4 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-lime-700 mb-2">Waste Forecast</p>
                <p className="text-[11px] leading-5 text-slate-700">{data.waste_forecast || 'Waste forecast pending.'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Donation Plan</p>
                <p className="text-[11px] leading-5 text-slate-700">{data.donation_plan || 'No donation plan generated.'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Low-Waste Actions</p>
                {(data.low_waste_actions || []).slice(0, 4).map((item: string, i: number) => (
                  <p key={i} className="text-[11px] leading-5 text-slate-700">- {item}</p>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Executive Brief Agent':
        return (
          <div className="space-y-4">
            <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">{data.headline || 'Executive Brief'}</p>
              <p className="text-sm leading-6 text-slate-800">{data.judge_pitch || 'A concise pitch will appear here after orchestration.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.differentiators || []).slice(0, 4).map((item: string, i: number) => (
                <div key={i} className="rounded-2xl border border-amber-100 bg-white p-3 text-[11px] font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            {data.recommended_next_step && (
              <p className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-100 rounded-2xl p-3">
                Next: {data.recommended_next_step}
              </p>
            )}
          </div>
        );
      case 'System Monitoring & QA':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${data.overall_status === 'green' ? 'bg-emerald-500' : data.overall_status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{data.overall_status} status</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">{data.execution_readiness}% orchestration integrity</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed border-l border-emerald-200 pl-3">
              {data?.final_summary || 'Final report is being prepared.'}
            </p>
            {data.qa_checks?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {data.qa_checks.slice(0, 4).map((check: string, i: number) => (
                  <div key={i} className="text-[10px] text-slate-700 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
                    ✅ {check}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'Shared Memory Ledger':
        return (
          <div className="space-y-4 font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl backdrop-blur-md">
                <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block mb-2">Winning Feature: Shared Memory</span>
                <p className="text-[10px] text-sky-100/80 leading-relaxed">{data.readiness_basis}</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl backdrop-blur-md">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Stack: Deployment Architecture</span>
                <div className="space-y-1">
                  {Object.entries(data.deployment || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[8px]">
                      <span className="text-indigo-200/60 uppercase">{k}:</span>
                      <span className="text-white font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-3">Audit Trail (Decision Tracking)</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {(data.audit_trail || []).map((entry: any, i: number) => (
                  <div key={i} className="text-[8px] border-l border-emerald-500/30 pl-3 py-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-emerald-400 font-bold uppercase">{entry.actor}</span>
                      <span className="text-white/30">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-white/70 italic">{entry.action}</p>
                    <p className="text-white/40">{entry.decision_context}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Weather Intelligence':
      case 'Weather Intelligence Agent':
        return (
           <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className={`p-3 rounded-2xl ${data.risk_level === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
                 {data.risk_level === 'high' ? <CloudRain className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-bold text-slate-800 tracking-tight">{data.summary}</p>
                 <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${data.risk_level === 'high' ? 'text-rose-600' : 'text-sky-600'}`}>Risk: {data.risk_level}</p>
               </div>
             </div>
             <div className="bg-white p-4 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2 tracking-widest">Recommendations</span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {data.recommendations?.slice(0, 2).map((r: string, i: number) => (
                    <li key={i} className="leading-relaxed">- {r}</li>
                  ))}
                </ul>
             </div>
           </div>
        );
      case 'Phase 4: Logistics Lead (Execution)':
        return (
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full border border-rose-100 inline-flex">Phase 4: Operational Timeline</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.timeline?.map((t: any, i: number) => (
                <div key={i} className="flex flex-col bg-white p-4 border border-slate-100 rounded-2xl relative group hover:border-rose-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">{t.time}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">{t.activity}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-[#fff7e8] p-5 border border-amber-100 rounded-2xl relative overflow-hidden group min-h-[140px]">
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-2 h-8 bg-amber-500 rounded-full" />
                  <span className="text-xs font-black text-amber-700 uppercase tracking-[0.18em]">Staffing Needs</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-semibold relative z-10 pr-4">
                  {data.staffing_needs}
                </p>
              </div>
              <div className="bg-rose-50 p-5 border border-rose-100 rounded-2xl relative overflow-hidden group min-h-[140px]">
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-2 h-8 bg-rose-600 rounded-full" />
                  <span className="text-xs font-black text-rose-700 uppercase tracking-[0.18em]">Logistics Lead Advice</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-semibold relative z-10 pr-4">
                  {data.transport_plan || "Two-vehicle dispatch optimized for Metro Manila traffic windows."}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-[8px] text-emerald-500/60 font-mono uppercase italic break-all opacity-50">{JSON.stringify(data).substring(0, 100)}...</div>;
    }
  };

  return (
    <div className={`high-density-card transition-all duration-300 group ${isExpanded ? 'ring-2 ring-emerald-500/20' : 'hover:border-emerald-200'}`}>
      <div 
        onClick={onToggle}
        className="high-density-header cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
          <h2 className="high-density-label group-hover:text-emerald-900 transition-all">{agent.replace(' Agent', '')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${getStatusColor(agent)}`}>
            {getStatusText(agent)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
          >
             <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
             </svg>
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-slate-100 bg-white/50">
              {renderContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PricingInsight({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="space-y-3 font-mono">
        <div className="flex justify-between text-[10px]">
          <span className="text-emerald-500/60 uppercase tracking-widest">Yield_Analysis</span>
          <span className="font-bold text-emerald-400 font-mono italic">{data.profit_margin}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-emerald-500/60 uppercase tracking-widest">Per_Unit</span>
          <span className="font-bold text-emerald-100 font-mono">{data.unit_cost}</span>
        </div>
        <div className="pt-2 border-t border-emerald-500/20 flex justify-between font-bold text-emerald-400 text-[10px]">
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
    <div className="bg-white p-3 border border-slate-100 rounded-2xl flex flex-col gap-1 min-h-[64px]">
      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{label}</span>
      <span className="font-bold truncate text-sm text-slate-800">{value || 'None'}</span>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 min-h-[82px]">
      <div className="text-emerald-600 mb-2">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-[11px] font-bold text-slate-800 truncate">{value || '--'}</p>
    </div>
  );
}

function MenuEditor({ menu, onChange }: { menu: any[], onChange: (menu: any[]) => void }) {
  if (!menu || menu.length === 0) return (
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      No menu generated yet.
    </div>
  );

  const updatePortion = (index: number, val: string) => {
    const newMenu = [...menu];
    newMenu[index].portion_per_guest = val;
    onChange(newMenu);
    // Note: In a full prod app, we'd trigger a server-side PricingAgent re-run here.
    // For now, we update local state to reflect the change visually.
  };

  const removeDish = (index: number) => {
    const newMenu = [...menu];
    newMenu.splice(index, 1);
    onChange(newMenu);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-emerald-600" />
          Menu Customization
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Mode</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menu.map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-slate-800 text-sm">{item.dish}</h3>
              <button onClick={() => removeDish(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Portion/Guest</label>
                <input 
                  type="text" 
                  value={item.portion_per_guest} 
                  onChange={(e) => updatePortion(i, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Category</label>
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 truncate">
                  {item.tags?.[0] || 'Main'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest">
        <ChefHat className="w-4 h-4" />
        Swap/Add Menu Suggestion
      </button>
    </motion.div>
  );
}

function AdminDashboard({ inventory, pricing }: { inventory: any[], pricing: any }) {
  if (!inventory || inventory.length === 0) return (
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      Waiting for procurement data...
    </div>
  );

  const chartData = inventory.slice(0, 8).map(ing => ({
    name: ing.item,
    cost: ing.estimated_cost_php || 0
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Owner Cost Controls
        </h2>
        <div className="flex gap-2">
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">ON BUDGET</span>
          <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">ADMIN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Procurement Cost</p>
          <p className="text-2xl font-black text-slate-900">PHP {inventory.reduce((acc, curr) => acc + (curr.estimated_cost_php || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Projected Margin</p>
          <p className="text-2xl font-black text-emerald-600">{pricing?.profit_margin || '32%'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Unit Cost/Guest</p>
          <p className="text-2xl font-black text-slate-900">{pricing?.unit_cost || '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            Budget-per-Ingredient Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="cost"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Ingredient Price Estimation
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={8} tick={{ fontSize: 8 }} />
                <YAxis fontSize={8} />
                <Tooltip />
                <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StaffTaskBoard({ tasks, onToggle }: { tasks: any[], onToggle: (index: number) => void }) {
  if (!tasks || tasks.length === 0) return (
    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
      Waiting for logistics timeline...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          Operational Task Board
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          {tasks.filter(t => t.completed).length} / {tasks.length} DONE
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div 
            key={i} 
            onClick={() => onToggle(i)}
            className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200'}`}>
              {task.completed && <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-emerald-700 font-mono">{task.time}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Duration: {task.duration}</span>
              </div>
              <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.activity}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AdminShopSetup({ profile, onSave }: { profile: any, onSave: (data: any) => void }) {
  const [name, setName] = useState(profile?.name || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [specialties, setSpecialties] = useState(profile?.specialties || '');
  const [baseQuote, setBaseQuote] = useState(profile?.baseQuote || '');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Setup Your Catering Shop</h2>
        <p className="text-slate-500 text-sm">Appear on the CaterFlow map and get recommended to customers.</p>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shop Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
              placeholder="e.g. Gourmet Manila Events"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location / Address</label>
            <div className="relative">
              <input 
                value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
                placeholder="City, District"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialties</label>
            <textarea 
              value={specialties} onChange={e => setSpecialties(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500 h-24" 
              placeholder="Filipino Fusion, Corporate Buffet, etc."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Quote Estimate (PHP)</label>
            <input 
              type="number" value={baseQuote} onChange={e => setBaseQuote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500" 
              placeholder="50000"
            />
          </div>
        </div>
        <button 
          onClick={() => onSave({ name, location, specialties, baseQuote: Number(baseQuote) })}
          className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          Update Shop Profile
        </button>
      </div>
    </motion.div>
  );
}

function CheckoutPortal({ shop, event, blueprint, status, onAccept, onFinalize }: { shop: any, event: any, blueprint: any[], status: string, onAccept: () => void, onFinalize: () => void }) {
  const [msg, setMsg] = useState('');
  const [localMsgs, setLocalMsgs] = useState<any[]>([
    { role: 'admin', text: "Hello! We've received your catering blueprint. The menu looks great. Would you like to proceed with this quote?", time: 'Just now' }
  ]);

  const send = () => {
    if (!msg.trim()) return;
    setLocalMsgs([...localMsgs, { role: 'customer', text: msg, time: 'Just now' }]);
    setMsg('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-140px)] gap-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl grid place-items-center text-emerald-700">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900">Casa Mesa Catering</h2>
                   <p className="text-xs text-slate-500">Official Partner Recommendation</p>
                </div>
             </div>
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {status.toUpperCase()}
             </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-y border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Total</span>
              <span className="text-2xl font-black text-slate-950">PHP 125,000</span>
            </div>
            {status === 'suggested' && (
              <div className="flex gap-3">
                <button onClick={onAccept} className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
                  Accept Recommendation
                </button>
                <button className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Reject
                </button>
              </div>
            )}
            {status === 'accepted' && (
              <button onClick={onFinalize} className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
                Proceed to Final Agreement
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex flex-col flex-1 overflow-hidden">
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {localMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${m.role === 'customer' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                    <span className={`text-[8px] mt-1 block uppercase font-bold ${m.role === 'customer' ? 'text-emerald-200' : 'text-slate-400'}`}>{m.time}</span>
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-4 flex gap-2">
             <input 
              value={msg} onChange={e => setMsg(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Chat with catering owner..."
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:border-emerald-500 shadow-sm"
             />
             <button onClick={send} className="w-12 h-12 bg-emerald-700 text-white rounded-2xl grid place-items-center hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
               <Send className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm overflow-y-auto custom-scrollbar">
         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
           <ClipboardList className="w-4 h-4" />
           Catering Receipt (Blueprint)
         </h3>
         <div className="space-y-8">
            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Event Brief</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Guests</p>
                    <p className="font-bold text-slate-800">{event.guest_count || '150'}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Cuisine</p>
                    <p className="font-bold text-slate-800">{event.cuisine_preference || 'Filipino'}</p>
                 </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Menu Selection</p>
              <div className="space-y-2">
                 {blueprint.find(s => s.agent.includes('Head Chef'))?.data.menu?.map((m: any, i: number) => (
                   <div key={i} className="flex justify-between items-center text-xs p-3 border-b border-slate-50">
                      <span className="font-bold text-slate-800">{m.dish}</span>
                      <span className="text-[10px] text-slate-400">{m.portion_per_guest}</span>
                   </div>
                 ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Operational Timeline</p>
              <div className="space-y-2 border-l-2 border-emerald-100 pl-4 ml-2">
                 {blueprint.find(s => s.agent.includes('Logistics'))?.data.timeline?.slice(0, 5).map((t: any, i: number) => (
                   <div key={i} className="relative py-1">
                      <div className="absolute -left-[21px] top-2.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <p className="text-[10px] font-black text-emerald-800 font-mono">{t.time}</p>
                      <p className="text-[11px] font-medium text-slate-600">{t.activity}</p>
                   </div>
                 ))}
              </div>
            </section>
         </div>
      </div>
    </motion.div>
  );
}

function DriverView({ event, logistics }: { event: any, logistics: any }) {
  const [driverMsg, setDriverMsg] = useState('');
  const [chat, setChat] = useState<any[]>([
    { sender: 'driver', text: "Just arrived at the kitchen. Loading the packages now.", time: '10:05 AM' }
  ]);

  const send = () => {
    if (!driverMsg.trim()) return;
    setChat([...chat, { sender: 'staff', text: driverMsg, time: '10:12 AM' }]);
    setDriverMsg('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
         <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#f0f9f1] cyber-grid opacity-30" />
            <div className="relative h-full flex flex-col">
               <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      Live Logistics Route
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Plate to Venue Delivery</p>
                  </div>
                  <div className="bg-emerald-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20">
                    IN TRANSIT
                  </div>
               </div>
               <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden border border-slate-300">
                  <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-40" alt="Map mockup" />
                  <div className="absolute inset-0 bg-emerald-900/10" />
                  <div className="absolute top-[30%] left-[20%] w-32 h-32 border-4 border-dashed border-emerald-500/50 rounded-full animate-pulse" />
                  <motion.div 
                    animate={{ x: [0, 100, 200, 300], y: [0, -20, 10, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-[10%] w-10 h-10 bg-white rounded-2xl shadow-2xl grid place-items-center border-2 border-emerald-600 z-10"
                  >
                    <Truck className="w-6 h-6 text-emerald-700" />
                  </motion.div>
                  <div className="absolute top-[40%] right-[10%] w-12 h-12 bg-emerald-700 rounded-2xl shadow-2xl grid place-items-center text-white z-10 border-2 border-white">
                    <MapPin className="w-6 h-6" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col flex-1 overflow-hidden">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
             <Users className="w-4 h-4" />
             Chat with Driver
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-bold ${m.sender === 'staff' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                    <span className="text-[7px] mt-1 block opacity-60 uppercase">{m.time}</span>
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-4 flex gap-2">
             <input 
              value={driverMsg} onChange={e => setDriverMsg(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Send message to driver..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 font-bold"
             />
             <button onClick={send} className="w-11 h-11 bg-emerald-700 text-white rounded-xl grid place-items-center hover:bg-emerald-800 transition-all shadow-lg">
               <Send className="w-4 h-4" />
             </button>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-sm text-white overflow-y-auto custom-scrollbar h-64">
           <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-6">Delivery Checklist</h3>
           <div className="space-y-4">
              {logistics?.timeline?.map((t: any, i: number) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="w-5 h-5 rounded-lg border-2 border-emerald-500/30 group-hover:bg-emerald-500/20 transition-all flex-shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black text-emerald-400 font-mono mb-1">{t.time}</p>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed">{t.activity}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
