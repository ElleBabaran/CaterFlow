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
  ArrowLeft,
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
  Edit3,
  Store,
  Inbox,
  ShoppingBag,
  QrCode
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
import { auth, signInWithGoogle, logout, loginWithEmail, signupWithEmail, WorkspaceRole } from './lib/firebase';
import { MessageBubble } from './components/chat/MessageBubble';
import { onAuthStateChanged, User } from 'firebase/auth';
import { processIntake, orchestrateCatering, validateUserResponse } from './services/orchestrator';
import { mongoService } from './services/mongodb';
import { hasCurrencyMarker } from './services/budget';
import { GeoOpsLeafletMap } from './components/GeoOpsLeafletMap';
import { CustomerPlanner } from './components/plan/CustomerPlanner';
import { AdminInbox } from './components/admin/AdminInbox';
import { AdminShopSetup } from './components/admin/AdminShopSetup';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { StaffTaskBoard } from './components/operations/StaffTaskBoard';
import { DriverView } from './components/operations/DriverView';
import { BlueprintSummary } from './components/plan/BlueprintSummary';
import { ShopDiscovery } from './components/discovery/ShopDiscovery';
import { ShopDetailsModal } from './components/discovery/ShopDetailsModal';
import { MarketplaceChat } from './components/chat/MarketplaceChat';
import { OrderQR } from './components/plan/OrderQR';
import { PublicOrderView } from './components/plan/PublicOrderView';



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
  isWeatherChoice?: boolean;
  isWeatherForecast?: boolean;
  weatherData?: any;
  isMenuCompositionChoice?: boolean;
  isFoodChoiceMode?: boolean;
  isPortionControlMode?: boolean;
}

const QUESTIONS = [
  { key: "preferred_language", text: "Before we start, what language do you prefer? English, Tagalog, Spanish, or another language?" },
  { key: "event_type", text: "👋 Hi! I'm your AI Catering Assistant. What type of event are you planning? (e.g. Wedding, Birthday, Corporate)" },
  { key: "guest_count", text: "👥 How many guests are you expecting?" },
  { key: "event_location", text: "📍 Where will the event be held? (City or venue name)" },
  { key: "event_date", text: "📅 What is the event date?" },
  { key: "budget", text: "💰 What is your total budget? (Please include the currency, e.g. $5000, ₱50000, 1000€)" },
  { key: "food_choice_mode", text: "🍽️ Do you have specific food items in mind that you'd like to add, or would you like our Head Chef to suggest a menu for you? (e.g., 'I have specific food' or 'Suggest for me')" },
  { key: "specific_food_items", text: "🍲 What specific food items or dishes do you have in mind? Please list them here." },
  { key: "portion_control_mode", text: "⚖️ Regarding the serving sizes, would you like to specify the portion per guest for each dish (e.g., '200g per person'), or would you like our system to automatically calculate the optimal portions based on your budget and guest count?" },
  { key: "cuisine_preference", text: "🍱 Any cuisine preference? (e.g. Filipino, Italian, Japanese, Chinese, Mediterranean)" },
  { key: "food_style_preference", text: "🔥 What cooking styles do you prefer? (e.g. Grilled, Fried, Steamed, Soups, Veggies, Roasted, Raw/Salads)" },
  { key: "dietary_needs", text: "🥗 Any dietary needs or restrictions? (e.g. None, Vegetarian, Allergies)" },
  { key: "menu_composition", text: "🍽️ How would you like to set up your menu? You can specify counts like: '4 main dishes, 2 desserts, 2 drinks' — or just say 'system decide' and we'll auto-plan everything within your budget. You can also mix: e.g. '3 main dishes, system decide drinks and desserts'." },
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
    portion_control_mode: "⚖️ Tungkol sa serving sizes, gusto mo bang ikaw ang mag-specify ng portion per guest (hal. '200g kada tao'), o gusto mo bang ang aming system na ang mag-calculate ng tamang sukat base sa iyong budget at bilang ng guests?",
    budget: "Magkano ang total budget mo? Pakilagay ang currency, hal. PHP 50000.",
    cuisine_preference: "May gusto ka bang cuisine? (hal. Filipino, Italian, Japanese, Chinese, Mediterranean)",
    food_style_preference: "🔥 Anong cooking style ang gusto mo? (hal. Inihaw/Grilled, Prito/Fried, Nilaga/Soup, Gulay/Veggies, Steamed, Roasted)",
    dietary_needs: "May dietary needs ba o restrictions? (hal. vegetarian, halal, allergies)",
    menu_composition: "🍽️ Ilang klase ng pagkain ang gusto mo sa menu? Pwede kang mag-specify tulad ng: '4 na ulam, 2 desserts, 2 drinks' — o sabihing 'system na bahala' at aayusin namin lahat base sa budget mo. Pwede rin i-mix: hal. '3 ulam, system na bahala sa drinks at desserts'.",
    nearby_suggestions: "Gusto mo bang maghanap din ako ng suggested catering shops na malapit sa venue? (Oo/Hindi)",
  },
  spanish: {
    event_type: "Que tipo de evento estas planeando? (por ejemplo, boda, cumpleanos, corporativo)",
    guest_count: "Cuantos invitados esperas?",
    event_location: "Donde sera el evento? (ciudad o nombre del venue)",
    event_date: "Cual es la fecha del evento?",
    budget: "Cual es tu presupuesto total? Incluye la moneda, por ejemplo PHP 50000.",
    cuisine_preference: "Tienes alguna preferencia de cocina? (Filipina, Italiana, Japonesa, China, Mediterranea)",
    food_style_preference: "🔥 Que estilos de cocina prefieres? (Asado/Grilled, Frito/Fried, Sopas, Verduras, Al vapor, Horneado)",
    dietary_needs: "Hay necesidades dieteticas o restricciones? (vegetariano, halal, alergias)",
    menu_composition: "🍽️ Cuantos platos quieres en el menu? Puedes especificar: '4 platos, 2 postres, 2 bebidas' — o di 'el sistema decide' y planificaremos todo segun tu presupuesto.",
    nearby_suggestions: "Quieres que busque sugerencias de catering cercanas o no? (Si/No)",
  },
  japanese: {
    event_type: "どのようなイベントを計画されていますか？（例：結婚式、誕生日、企業イベント）",
    guest_count: "何名様のゲストを予定されていますか？",
    event_location: "開催場所はどちらですか？（市区町村または会場名）",
    event_date: "開催日はいつですか？",
    budget: "総予算はいくらですか？通貨も含めてください（例：PHP 50000、50000円）。",
    cuisine_preference: "料理のご希望はありますか？（例：フィリピン料理、イタリアン、和食、中華、地中海料理）",
    food_style_preference: "🔥 調理スタイルの好みは？（例：グリル、揚げ物、スープ、野菜料理、蒸し料理、ロースト）",
    dietary_needs: "食事制限やアレルギーはありますか？（例：なし、ベジタリアン、ハラール、アレルギー）",
    menu_composition: "🍽️ メニューの構成はどうしますか？例：'メイン4品、デザート2品、飲み物2品' と指定するか、'システムにお任せ' で予算内で自動設定します。",
    nearby_suggestions: "近くのケータリングショップを提案したほうがいいですか？ (はい/いいえ)",
  },
  chinese: {
    event_type: "您正在计划什么类型的活动？（例如：婚礼、生日、公司活动）",
    guest_count: "您预计有多少位客人？",
    event_location: "活动将在哪里举行？（城市或场馆名称）",
    event_date: "活动日期是什么时候？",
    budget: "您的总预算是多少？请包括币种（例如：PHP 50000，5000元）。",
    cuisine_preference: "您有偏好的菜系吗？（例如：菲律宾菜、意大利菜、日本料理、中餐、地中海料理）",
    food_style_preference: "🔥 您偏好哪种烹饪方式？（例如：烧烤/Grilled、油炸/Fried、汤品/Soup、蔬菜/Veggies、蒸食/Steamed）",
    dietary_needs: "是否有饮食需求或限制？（例如：无、素食、清真、过敏）",
    menu_composition: "🍽️ 您想要菜单中有多少道菜？可以指定：'4道主菜，2道甜点，2种饮料' — 或者说'系统决定'，我们将在预算内自动规划。",
    nearby_suggestions: "您想让我寻找附近的餐饮建议吗？ (是/否)",
  },
};


function normalizeLanguage(value = "") {
  const text = value.toLowerCase();
  if (/tagalog|filipino|tl|pilipino/.test(text)) return "tagalog";
  if (/spanish|espanol|español/.test(text)) return "spanish";
  if (/japanese|nihongo|jp|日本語/.test(text)) return "japanese";
  if (/chinese|mandarin|cantonese|zh|中文|华语/.test(text)) return "chinese";
  return value.trim() || "english";
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
  { key: "portion_control_mode", label: "Portion Mode" },
  { key: "budget", label: "Budget", compact: true },
  { key: "cuisine_preference", label: "Cuisine" },
  { key: "food_style_preference", label: "Cooking Style" },
  { key: "dietary_needs", label: "Dietary needs" },
  { key: "menu_composition", label: "Menu Composition" },
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>('customer');
  const [signupRole, setSignupRole] = useState<WorkspaceRole>('customer');
  const [reportView, setReportView] = useState<'all' | 'menu' | 'logistics' | 'finance'>('menu');
  const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'discovery' | 'marketplace-chat' | 'qr' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [showDetailedAgentView, setShowDetailedAgentView] = useState<boolean>(false);
  const [useFoundry, setUseFoundry] = useState(false);
  const [stackStatus, setStackStatus] = useState<any>(null);
  const [skipRoleLoad, setSkipRoleLoad] = useState(false);

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
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [publicOrderId, setPublicOrderId] = useState<string | null>(new URLSearchParams(window.location.search).get('orderId'));

  const [showShopDetails, setShowShopDetails] = useState<string | null>(null);
  const [isConversationSaved, setIsConversationSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [isWaitingForWeather, setIsWaitingForWeather] = useState(false);

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
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

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

  const handleWeatherChoice = (choice: boolean) => {
    setIsWaitingForWeather(false);
    setEventData(prev => ({ ...prev, base_on_weather: choice }));

    setMessages(prev => {
      const filtered = prev.map(m => m.isWeatherChoice ? { ...m, isWeatherChoice: false } : m);
      return [...filtered, {
        id: `user-weather-${Date.now()}`,
        role: 'user',
        content: choice
          ? (eventData.preferred_language === 'tagalog' ? "Oo, sige." : "Yes, please.")
          : (eventData.preferred_language === 'tagalog' ? "Hindi na, okay na." : "No, thank you."),
        timestamp: new Date()
      }];
    });

    const nextIdx = qIndex + 1;
    if (nextIdx < QUESTIONS.length) {
      setTimeout(() => {
        setQIndex(nextIdx);
        setMessages(prev => [...prev, {
          id: `bot-q-${Date.now()}`,
          role: 'bot',
          content: getQuestionText(nextIdx, eventData.preferred_language),
          isMenuCompositionChoice: QUESTIONS[nextIdx].key === 'menu_composition',
          isFoodChoiceMode: QUESTIONS[nextIdx].key === 'food_choice_mode',
          isPortionControlMode: QUESTIONS[nextIdx].key === 'portion_control_mode',
          timestamp: new Date()
        }]);
        saveConversation();
      }, 500);
    }
  };

  const loadUserRole = async (activeUser: User) => {
    try {
      const profile = await mongoService.fetchUser(activeUser.uid);

      if (profile && profile.role) {
        setWorkspaceRole(profile.role);
        setSignupRole(profile.role);
        if (profile.role === 'admin') setDashboardView('admin-inbox');
        else if (profile.role === 'staff') setDashboardView('staff-tasks');
        else setDashboardView('conversation');
        return;
      }

      setPendingGoogleUser(activeUser);
      setShowRolePicker(true);
    } catch (err) {
      console.error("Error loading user role from MongoDB:", err);
      setWorkspaceRole('customer');
      setDashboardView('conversation');
    }
  };

  const handleGoogleRoleConfirm = async () => {
    if (!pendingGoogleUser) return;
    try {
      const newProfile = await mongoService.saveUser({
        uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        name: pendingGoogleUser.displayName || pendingGoogleUser.email || 'CaterFlow User',
        photoURL: pendingGoogleUser.photoURL,
        role: signupRole,
      });
      const finalRole = newProfile.role || signupRole;
      setWorkspaceRole(finalRole);
      if (finalRole === 'admin') setDashboardView('admin-inbox');
      else if (finalRole === 'staff') setDashboardView('staff-tasks');
      else setDashboardView('conversation');
    } finally {
      setShowRolePicker(false);
      setPendingGoogleUser(null);
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
    if (messages.length > 1 || Object.keys(eventData).length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [messages, eventData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
        if (!showRolePicker && !loading && !skipRoleLoad) {
          loadUserRole(u);
          fetchHistory(u.uid);
        }
        if (messages.length === 0) {
          setMessages([{ id: 'bot-start', role: 'bot', content: getQuestionText(0), timestamp: new Date() }]);
        }
      }
      setLoading(false);
    });

    if (publicOrderId) {
      return <PublicOrderView orderId={publicOrderId} />;
    }

    return () => unsubscribe();
  }, [messages.length]);

  // DEBOUNCED AUTO-SAVE
  useEffect(() => {
    if (!user || messages.length < 2) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveConversation().then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch(() => setSaveStatus('error'));
    }, 1500); // Wait 1.5s after last change

    return () => clearTimeout(timer);
  }, [messages, eventData, user?.uid]);

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

  const handleChatSubmit = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = directInput !== undefined ? directInput : input;
    if (!textToSubmit.trim() || isProcessing) return;

    const userText = textToSubmit.trim();
    const currentQuestion = QUESTIONS[qIndex];

    const newMessages: Message[] = [...messages.map(m => (m.isMenuCompositionChoice || m.isFoodChoiceMode || m.isPortionControlMode) ? { ...m, isMenuCompositionChoice: false, isFoodChoiceMode: false, isPortionControlMode: false } : m), {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      qKey: currentQuestion.key,
      timestamp: new Date()
    }];
    setMessages(newMessages);
    if (directInput === undefined) setInput("");


    let refinedAmount = userText;
    const currencyRegex = /[\$\£\€\¥\₱\₹]|(USD|PHP|EUR|GBP|AED|CAD|AUD|JPY|CNY|PESO|PESOS)/i;

    if (currentQuestion.key === 'budget' && eventData.budget && !hasCurrencyMarker(eventData.budget)) {
      if (currencyRegex.test(userText) || /^\w{3}$/.test(userText)) {
        refinedAmount = `${eventData.budget} ${userText}`;
      }
    }

    const isLanguageStep = currentQuestion.key === 'preferred_language';
    const newEventData = { ...eventData, [currentQuestion.key]: refinedAmount };

    if (currentQuestion.key === 'budget') {
      const hasCurrency = hasCurrencyMarker(refinedAmount);
      if (!hasCurrency && /^\d+$/.test(refinedAmount.replace(/[,. ]/g, ''))) {
        setEventData(newEventData);
        setMessages([...newMessages, {
          id: `bot-currency-${Date.now()}`,
          role: 'bot',
          content: "I've noted the amount! Just to be precise, which currency are you using? (e.g., $, ₱, USD, PHP, Pesos)",
          timestamp: new Date()
        }]);
        saveConversation();
        return;
      }
    }

    setEventData(newEventData);

    if (qIndex < QUESTIONS.length - 1) {
      setIsProcessing(true);

      if (currentQuestion.key === 'event_location' && userText.length > 2) {
        import('./services/orchestrator').then(m => {
          m.prefetchWeather(userText, newEventData.event_date || 'TBD', newEventData.preferred_language || 'english');
        });
      }

      let nextIdx = qIndex + 1;

      const processingLanguage = isLanguageStep ? (eventData.preferred_language || 'english') : newEventData.preferred_language;
      const intakeResult = await processIntake(userText, currentQuestion.key, currentQuestion.text, processingLanguage);

      const intent = intakeResult.intent;
      const validation = intakeResult.validation;
      const reaction = intakeResult.reaction?.text;

      if (isWaitingForWeather) {
        const isYes = /yes|oo|sige|yup|sure|game|okay|ok/i.test(userText);
        const isNo = /no|hindi|ayoko|huwag|don't|stop/i.test(userText);
        if (isYes || isNo) {
          handleWeatherChoice(isYes);
          return;
        }
      }

      if (currentQuestion.key === 'specific_food_items' && intent.type === 'ANSWER') {
        const existing = eventData.specific_food_items || "";
        const updatedFood = existing ? `${existing}, ${userText}` : userText;
        setEventData(prev => ({ ...prev, specific_food_items: updatedFood }));

        setIsProcessing(false);
        setMessages(prev => [...prev, {
          id: `bot-more-food-${Date.now()}`,
          role: 'bot',
          content: reaction ? `${reaction}\n\nAnything else?` : "Got it. Anything else?",
          timestamp: new Date()
        }]);
        saveConversation();
        return;
      }

      if (currentQuestion.key === 'food_style_preference' && intent.type === 'ANSWER') {
        const existing = eventData.food_style_preference || "";
        const updated = existing ? `${existing}, ${userText}` : userText;
        setEventData(prev => ({ ...prev, food_style_preference: updated }));

        const lang = newEventData.preferred_language;
        const followUp = lang === 'tagalog'
          ? "Noted! May iba pa bang cooking style na gusto mo? (o sabihing 'tapos na')"
          : lang === 'spanish'
            ? "Anotado! Algún otro estilo de cocina? (o di 'listo')"
            : "Got it! Any other cooking styles you'd like? (or say 'done')";

        setIsProcessing(false);
        setMessages(prev => [...prev, {
          id: `bot-style-more-${Date.now()}`,
          role: 'bot',
          content: reaction ? `${reaction}\n\n${followUp}` : followUp,
          timestamp: new Date()
        }]);
        saveConversation();
        return;
      }

      if (currentQuestion.key === 'specific_food_items' && intent.type === 'DONE') {
        nextIdx = qIndex + 1;
      } else if (intent.type === 'DONE') {
        nextIdx = qIndex + 1;
      }

      if (currentQuestion.key === 'food_choice_mode') {
        const isSuggest = /suggest|chef|mag-suggest|kayo/i.test(userText);
        const isSpecific = /specific|ako|meron|mayroon/i.test(userText);
        if (isSuggest && !isSpecific) {
          const specificIdx = QUESTIONS.findIndex(q => q.key === 'specific_food_items');
          if (specificIdx !== -1 && nextIdx === specificIdx) nextIdx++;
        }
      }

      const isDateStep = currentQuestion.key === 'event_date' && eventData.event_location && !isWaitingForWeather;
      if (isDateStep && validation.valid) {
        setIsProcessing(true);
        setIsWaitingForWeather(true);
        import('./services/orchestrator').then(async m => {
          const weather = await m.predictWeather(eventData.event_location, userText, newEventData.preferred_language);
          if (weather) {
            if (reaction) {
              setMessages(prev => [...prev, {
                id: `bot-react-${Date.now()}`,
                role: 'bot',
                content: reaction,
                timestamp: new Date()
              }]);
            }

            setMessages(prev => [...prev, {
              id: `bot-weather-${Date.now()}`,
              role: 'bot',
              content: weather.summary,
              weatherData: weather.raw_data,
              weatherLocation: eventData.event_location,
              isWeatherForecast: true,
              timestamp: new Date()
            }]);

            const weatherChoiceText = eventData.preferred_language === 'tagalog'
              ? "Iba-base ba natin yung mga food suggestion sa forecast na ito?"
              : "Should we base the food suggestions on this weather forecast?";
            
            const mm = await import('./services/orchestrator');
            const translatedChoice = await mm.translateText(weatherChoiceText, newEventData.preferred_language);
            setMessages(prev => [...prev, {
              id: `bot-weather-choice-${Date.now()}`,
              role: 'bot',
              content: translatedChoice,
              isWeatherChoice: true,
              timestamp: new Date()
            }]);
            saveConversation();
          }
          setIsProcessing(false);
        });
        return;
      }

      if (intent.type === 'LANGUAGE_CHANGE') {
        const newLang = normalizeLanguage(intent.value || 'english');
        
        const updatedEventData = { ...newEventData, preferred_language: newLang };
        setEventData(updatedEventData);

        const m = await import('./services/orchestrator');
        
        let prefix = `Sure, I'll speak in ${newLang.charAt(0).toUpperCase() + newLang.slice(1)}! `;
        if (newLang === 'tagalog') prefix = "Sige po, magta-Tagalog na ako. ";
        else if (newLang === 'spanish') prefix = "¡Claro! Hablaré en español. ";
        else if (newLang === 'japanese') prefix = "承知いたしました。日本語でお話しします。 ";
        else if (newLang === 'chinese') prefix = "好的，我会用中文跟您交流！ ";
        else if (newLang === 'indonesian') prefix = "Baik, saya akan berbicara dalam Bahasa Indonesia. ";
        else if (newLang === 'korean') prefix = "네, 한국어로 말씀드리겠습니다. ";

        const translatedPrefix = await m.translateText(prefix, newLang);

        if (currentQuestion.key === 'preferred_language') {
          setTimeout(async () => {
            const nextIdxVal = qIndex + 1;
            setQIndex(nextIdxVal);
            const questionText = getQuestionText(nextIdxVal, newLang);
            const localizedQuestion = await m.translateText(questionText, newLang);

            setMessages(prev => [...prev, {
              id: `bot-lang-${Date.now()}`,
              role: 'bot',
              content: `${translatedPrefix}\n\n${localizedQuestion}`,
              isMenuCompositionChoice: QUESTIONS[nextIdxVal].key === 'menu_composition',
              isFoodChoiceMode: QUESTIONS[nextIdxVal].key === 'food_choice_mode',
              isPortionControlMode: QUESTIONS[nextIdxVal].key === 'portion_control_mode',
              timestamp: new Date()
            }]);
            saveConversation();
            setIsProcessing(false);
          }, 300);
          return;
        }

        const repeatedQuestion = getQuestionText(qIndex, newLang);
        const localizedRepeated = await m.translateText(repeatedQuestion, newLang);

        setMessages(prev => [...prev, {
          id: `bot-lang-${Date.now()}`,
          role: 'bot',
          content: `${translatedPrefix}${localizedRepeated}`,
          isMenuCompositionChoice: currentQuestion.key === 'menu_composition',
          isFoodChoiceMode: currentQuestion.key === 'food_choice_mode',
          isPortionControlMode: currentQuestion.key === 'portion_control_mode',
          timestamp: new Date()
        }]);
        saveConversation();
        setIsProcessing(false);
        return;
      }

      if (intent.type === 'GENERAL_REQUEST') {
        const cmd = (intent.value || "").toLowerCase();
        if (cmd.includes('restart') || cmd.includes('reset') || cmd.includes('ulitin')) {
          deleteConversation();
          setIsProcessing(false);
          return;
        }

        const m = await import('./services/orchestrator');
        const fallbackMsg = eventData.preferred_language === 'tagalog'
          ? "Pasensya na, kaya ko lang tumulong sa catering planning sa ngayon."
          : "I'm sorry, I can only help with catering planning right now.";
        
        const localizedFallback = await m.translateText(fallbackMsg, newEventData.preferred_language);
        const localizedQuestion = await m.translateText(currentQuestion.text, newEventData.preferred_language);

        setMessages(prev => [...prev, {
          id: `bot-gen-${Date.now()}`,
          role: 'bot',
          content: reaction ? `${reaction}\n\n${localizedQuestion}` : `${localizedFallback}\n\n${localizedQuestion}`,
          timestamp: new Date()
        }]);
        saveConversation();
        setIsProcessing(false);
        return;
      }

      if (!validation.valid) {
        const m = await import('./services/orchestrator');
        const langToUse = eventData.preferred_language || 'english';
        const localizedQuestion = await m.translateText(currentQuestion.text, langToUse);
        
        setMessages(prev => [...prev, {
          id: `bot-err-${Date.now()}`,
          role: 'bot',
          content: `${validation.message || "Please provide a more specific answer."}\n\n${localizedQuestion}`,
          timestamp: new Date()
        }]);
        saveConversation();
        setIsProcessing(false);
        return;
      }

      import('./services/orchestrator').then(async m => {
        const actualNextQuestionText = getQuestionText(nextIdx, newEventData.preferred_language);
        const localizedNextQuestion = await m.translateText(actualNextQuestionText, newEventData.preferred_language);
        const botMessage = reaction ? `${reaction}\n\n${localizedNextQuestion}` : localizedNextQuestion;

        setTimeout(() => {
          setQIndex(nextIdx);
          setMessages(prev => [...prev, {
            id: `bot-q-${Date.now()}`,
            role: 'bot',
            content: botMessage,
            isMenuCompositionChoice: QUESTIONS[nextIdx].key === 'menu_composition',
            isFoodChoiceMode: QUESTIONS[nextIdx].key === 'food_choice_mode',
            isPortionControlMode: QUESTIONS[nextIdx].key === 'portion_control_mode',
            timestamp: new Date()
          }]);
          saveConversation();
          setIsProcessing(false);
        }, 200);
      });
    } else {
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
          saveConversation();
          setIsProcessing(false);
        }, 200);
        return;
      }

      if (!isChatting || steps.length > 0) {
        const isNewPlanRequest = /new|restart|ulit|bago|start|another|fresh/i.test(userText);
        if (isNewPlanRequest || (!isConfirming && !showSummary)) {
          restartChat();
          return;
        }
      }

      setIsConfirming(true);
      setShowSummary(true);
      setMessages(prev => [...prev, {
        id: `sys-review-${Date.now()}`,
        role: 'bot',
        content: "I've gathered all the details! Please review the summary below. Is everything correct, or would you like to add anything else?",
        timestamp: new Date()
      }]);
      saveConversation();
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
    setHasUnsavedChanges(false);
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
    setIsProcessing(true);

    const currentNextQ = getQuestionText(qIndex, eventData.preferred_language);
    const intake = await processIntake(newText, q?.key || "", q?.text || "", eventData.preferred_language);

    const intent = intake.intent;
    const validation = intake.validation;
    const reaction = intake.reaction?.text || "";

    if (intent.type === 'LANGUAGE_CHANGE') {
      const newLang = normalizeLanguage(intent.value || 'english');
      setEventData(prev => ({ ...prev, preferred_language: newLang }));
      const repeatedQuestion = getQuestionText(qIndex, newLang);

      let prefix = "Sure, I'll speak in English from now on! ";
      if (newLang === 'tagalog') prefix = "Sige po, magta-Tagalog na ako simula ngayon. ";
      else if (newLang === 'spanish') prefix = "¡Claro! Hablaré en español desde ahora. ";
      else if (newLang === 'japanese') prefix = "承知いたしました。これからは日本語でお話しします。 ";
      else if (newLang === 'chinese') prefix = "好的，从现在开始我会用中文跟您交流！ ";

      setMessages(prev => [...prev.map(m => m.id === editingMessageId ? { ...m, content: newText } : m), {
        id: `bot-edit-lang-${Date.now()}`,
        role: 'bot',
        content: `${prefix}${repeatedQuestion}`,
        timestamp: new Date()
      }]);

      setIsProcessing(false);
      setEditingMessageId(null);
      setEditingText("");
      saveConversation();
      return;
    }

    if (!validation.valid) {
      setMessages(prev => [...prev, {
        id: `bot-edit-err-${Date.now()}`,
        role: 'bot',
        content: `⚠️ ${validation.message}`,
        timestamp: new Date()
      }]);
    } else {
      const newEventData = { ...eventData, [editedMsg.qKey!]: newText };
      setMessages(prev => [...prev.map(m => m.id === editingMessageId ? { ...m, content: newText } : m), {
        id: `bot-edit-ok-${Date.now()}`,
        role: 'bot',
        content: reaction || (eventData.preferred_language === 'tagalog' ? "Sige po, na-update ko na." : "Got it! I've updated that for you."),
        timestamp: new Date()
      }]);
      setEventData(newEventData);
    }
    setIsProcessing(false);
  }

  setMessages(prev => prev.map(msg => msg.id === editingMessageId ? { ...msg, content: newText } : msg));
  setEditingMessageId(null);
  setEditingText("");

  saveConversation();
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
  const monitoring = steps.find(s => s.agent.includes('Monitoring'))?.data || {};
  return [
    ['Event Type', customer.event_type || '--'],
    ['Guests', customer.guests || '--'],
    ['Budget', customer.budget || eventData.budget || '--'],
    ['Location', customer.location || eventData.event_location || '--'],
    ['Menu Items', (menu.menu || []).map((item: any) => item.dish).join('; ') || '--'],
    ['Procurement Weight', inventory.procurement_weight_kg ? `${inventory.procurement_weight_kg} kg` : '--'],
    ['Recommended Catering Shops', (suppliers.catering_shop_recommendations || []).slice(0, 3).map((shop: any) => `${shop.name} (${shop.match_score})`).join('; ') || '--'],
    ['Staffing', logistics.staffing_needs || '--'],
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
      setSkipRoleLoad(true);
      const userCredential = await signupWithEmail(email, password, name, signupRole);

      await mongoService.saveUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        role: signupRole
      });

      setWorkspaceRole(signupRole);
      if (signupRole === 'admin') setDashboardView('admin-inbox');
      else if (signupRole === 'staff') setDashboardView('operations');
      setSkipRoleLoad(false);
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

if (showRolePicker) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Choose Your Role</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Welcome, <span className="font-bold text-slate-700">{pendingGoogleUser?.displayName || pendingGoogleUser?.email}</span>!<br />
            Select how you'll use CaterFlow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {([
            ['customer', 'Customer', 'Submit event briefs, review menus, track your plan'],
            ['admin', 'Admin / Owner', 'Owner dashboard, pricing controls, supplier decisions'],
            ['staff', 'Staff', 'Prep board, dispatch coordination, execution tasks'],
          ] as const).map(([role, title, copy]) => (
            <button
              key={role}
              type="button"
              onClick={() => setSignupRole(role as WorkspaceRole)}
              className={`rounded-2xl border p-4 text-left transition ${signupRole === role
                ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
            >
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${signupRole === role ? 'text-emerald-800' : 'text-slate-700'
                }`}>{title}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">{copy}</p>
            </button>
          ))}
        </div>
        <button
          onClick={handleGoogleRoleConfirm}
          className="w-full min-h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-all active:scale-[0.98] shadow-xl shadow-emerald-800/20 uppercase text-xs tracking-[0.18em] rounded-2xl"
        >
          Continue as {signupRole.charAt(0).toUpperCase() + signupRole.slice(1)}
        </button>
      </div>
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
  <div className={`app-shell flex flex-col h-screen w-full font-sans overflow-hidden transition-all duration-500 ${highContrast ? 'high-contrast' : ''
    } ${workspaceRole === 'admin' ? 'admin-theme bg-[var(--bg-color)]' : workspaceRole === 'staff' ? 'staff-theme bg-[#fffbeb]' : 'customer-theme bg-[#fbf7ee]'}`}>

    {workspaceRole === 'admin' ? (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-color)]">
        <header className="h-14 bg-[var(--header-bg)] flex items-center justify-between px-6 flex-shrink-0 z-30 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-xl flex items-center justify-center font-bold text-lg text-white">C</div>
            <h1 className="text-sm font-bold tracking-[0.08em] text-[var(--text-color)]">CaterFlow <span className="text-slate-500 font-normal text-[10px] ml-2 uppercase tracking-[0.18em]">Admin Portal</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-color)]">
              <img src={user.photoURL || undefined} className="w-6 h-6 rounded-full border border-[var(--border-color)]" alt="User" />
              <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 bg-[var(--header-bg)] border-r border-[var(--border-color)] flex flex-col p-4 space-y-2">
            {[
              ['admin-inbox', 'Inbox / Chats', Inbox],
              ['shop-setup', 'My Catering Shop', Store],
              ['summary', 'Planning Hub', ClipboardList],
              ['admin-dashboard', 'Business Analytics', BarChart3],
              ['finance', 'Financials', DollarSign],
            ].map(([key, label, Icon]: any) => (
              <button
                key={key}
                onClick={() => setDashboardView(key as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${dashboardView === key ? 'bg-[var(--accent-color)] text-slate-950 shadow-lg shadow-[var(--accent-color)]/20' : 'text-slate-400 hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}

            <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
              <div className="p-4 bg-[var(--accent-color)]/5 border border-[var(--accent-color)]/10 rounded-2xl">
                <p className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest mb-1">Owner Mode</p>
                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">You are managing your catering business operations.</p>
              </div>
            </div>
          </aside>

          <main className="flex-1 bg-[var(--bg-color)] overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {dashboardView === 'admin-inbox' && (
                <AdminInbox
                  plans={[]}
                  adminUid={user.uid}
                  adminName={user.displayName || 'Admin'}
                  onSendMessage={async (planId, text) => {
                    console.log(`Sending to ${planId}: ${text}`);
                  }}
                  onUpdateStatus={(id, status) => {
                    console.log(`Status of ${id} changed to ${status}`);
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
              {dashboardView === 'admin-dashboard' && (
                <AdminDashboard
                  inventory={localInventory}
                  pricing={pricingStep}
                />
              )}

              {dashboardView === 'discovery' && (
                <ShopDiscovery
                  eventData={eventData}
                  onSelectShop={(id) => setShowShopDetails(id)}
                />
              )}
              {dashboardView === 'marketplace-chat' && selectedShop && (
                <div className="space-y-6">
                  <MarketplaceChat
                    eventId={activeConversationId || ''}
                    shop={selectedShop}
                    currentUser={user}
                    eventData={eventData}
                    menuItems={localMenu}
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={() => setDashboardView('qr')}
                      className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Generate Order QR Code
                    </button>
                  </div>
                </div>
              )}
              {dashboardView === 'qr' && activeConversationId && (
                <div className="py-10">
                  <OrderQR orderId={activeConversationId} orderData={{ menu: localMenu, event: eventData }} />
                  <div className="mt-8 text-center">
                    <button onClick={() => setDashboardView('marketplace-chat')} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                      Back to Chat
                    </button>
                  </div>
                </div>
              )}

              {dashboardView === 'summary' && (
                <div className="relative min-h-[calc(100vh-80px)] w-full pb-16">
                  <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
                  <div className="absolute top-40 right-20 w-96 h-96 bg-sky-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
                  <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-amber-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>

                  <div className="relative max-w-5xl mx-auto space-y-8 z-10">
                    <div className="flex items-center justify-between p-8 backdrop-blur-xl bg-white/40 border border-white/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-[0.1em] drop-shadow-sm">Active Event Planning</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Reviewing AI-generated blueprints and logistics</p>
                      </div>
                      <button onClick={exportSummaryTable} className="px-6 py-3 bg-white/60 border border-white/80 hover:bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 rounded-2xl shadow-sm transition-all hover:shadow-md">Export CSV</button>
                    </div>
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 lg:col-span-8">
                        {visibleSteps
                          .filter(s => !s.agent.includes('Knowledge Base') && !s.agent.includes('Monitoring') && !s.agent.includes('Shared Memory'))
                          .map((step, idx) => (
                            <AgentReport key={idx} step={step} isExpanded={expandedStepIndex === idx} onToggle={() => setExpandedStepIndex(idx)} />
                          ))}
                      </div>
                      <div className="col-span-12 lg:col-span-4">
                        <ProblemStatementFit stackStatus={stackStatus} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    ) : (
      <>
        <header className="h-14 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-xl flex items-center justify-center font-bold text-lg text-white">C</div>
            <h1 className="text-sm font-bold tracking-[0.08em] text-slate-950">
              CaterFlow
              <span className="text-slate-400 font-normal text-[10px] ml-2 uppercase tracking-[0.18em]">
                {workspaceRole === 'staff' ? 'Staff Portal' : 'Customer Planner'}
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <AnimatePresence>
                {saveStatus !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  >
                    {saveStatus === 'saving' && (
                      <>
                        <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">Syncing...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">Saved to Atlas</span>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-rose-600">Cloud Sync Error</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                title="Recent Conversations"
              >
                <History className="w-5 h-5" />
              </button>
              <img src={user.photoURL || null} className="w-6 h-6 rounded-full border border-slate-200" alt="User" />
              <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden relative bg-[var(--bg-color)]">
          <div className="col-span-12 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 h-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {workspaceRole === 'staff' ? 'Operational Tasks' : 'My Planning Journey'}
            </p>
            <div className="flex gap-2">
              {(workspaceRole === 'staff'
                ? [['staff-tasks', 'Duty Roster'], ['delivery', 'Logistics']]
                : [['conversation', 'Brief'], ['summary', 'Plan'], ['inventory-planner', 'Inventory Plan'], ['menu-editor', 'Edit Menu'], ['checkout', 'Checkout']]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDashboardView(key as any)}
                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${dashboardView === key
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-y-4 left-4 w-80 bg-white/98 backdrop-blur-2xl rounded-[2.5rem] z-30 border border-slate-200 overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent">
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-900">Recent Conversations</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Saved to MongoDB Atlas</p>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-emerald-50 rounded-full text-slate-400 hover:text-emerald-700 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="border-b border-slate-100 bg-white/50 p-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search history..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {filteredHistory.map((item) => (
                    <div key={item.id || item._id} className="group relative rounded-[1.5rem] border border-slate-100 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 hover:-translate-y-0.5">
                      <button onClick={() => loadFromHistory(item)} className="w-full text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${item.type === 'plan' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {item.type === 'plan' ? 'Event Blueprint' : 'Conversation'}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-800 line-clamp-2 mb-3 group-hover:text-emerald-700 transition-colors">{item.rawInput}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-300" />
                            <p className="text-[10px] text-slate-500 font-bold">
                              {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 
                               item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                          <span className="text-[9px] px-2 py-1 bg-slate-50 text-slate-400 rounded-lg font-mono font-bold">
                            #{String(item.id || item._id).slice(-4).toUpperCase()}
                          </span>
                        </div>
                      </button>
                      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => deleteConversation(item.id || item._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-800"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                        <Inbox className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No conversations found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          { }
          {showConversation && <section className={`col-span-12 ${Object.keys(monitoringStep).length > 0 ? 'hidden' : 'lg:col-span-4'} flex flex-col space-y-4 overflow-hidden h-[calc(100vh-190px)]`}>
            <div className="high-density-card flex flex-col min-h-[520px]">
              <div className="high-density-header flex justify-between items-center">
                <div>
                  <h2 className="high-density-label">Event Brief</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Answer a few questions. The agents handle the rest.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={restartChat} className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-800 hover:text-rose-900 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                  {activeConversationId && (
                    <button onClick={() => deleteConversation()} className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 hover:text-rose-900 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>

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
                            msg.isWeatherForecast ? 'bg-blue-50/50 text-blue-900 border border-blue-100 rounded-bl-md' :
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
                                {eventData.preferred_language === 'tagalog' ? 'I-cancel' : 'Cancel'}
                              </button>
                              <button type="button" onClick={commitEditMessage} className="rounded-full bg-emerald-700 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                                {eventData.preferred_language === 'tagalog' ? 'I-update' : 'Update'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.isWeatherForecast ? (
                              <span className="font-semibold text-blue-900">
                                {msg.content}
                              </span>
                            ) : msg.content}
                            
                            {msg.isWeatherChoice && (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => handleWeatherChoice(true)}
                                  className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                  Yes
                                </button>
                                <button
                                  onClick={() => handleWeatherChoice(false)}
                                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                  No
                                </button>
                              </div>
                            )}
                            {msg.isMenuCompositionChoice && (
                              <div className="mt-4 flex flex-col gap-2">
                                <button
                                  onClick={() => handleChatSubmit(undefined, "System decide best mix to maximize my budget")}
                                  className="px-4 py-3 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md text-left flex justify-between items-center"
                                >
                                  <span>🤖 Auto-plan (Maximize my budget)</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                                <button
                                  onClick={() => handleChatSubmit(undefined, "1-2 main dishes only, keep it simple for my budget")}
                                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-left flex justify-between items-center"
                                >
                                  <span>🍱 Keep it simple (1-2 dishes only)</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                                <button
                                  onClick={() => handleChatSubmit(undefined, "System decide mains only, no desserts and no drinks")}
                                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-left flex justify-between items-center"
                                >
                                  <span>🥩 Mains Only (No Desserts / Drinks)</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                                <button
                                  onClick={() => {
                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isMenuCompositionChoice: false } : m));
                                    setInput("");
                                    setTimeout(() => document.querySelector('textarea')?.focus(), 0);
                                  }}
                                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-left flex justify-between items-center"
                                >
                                  <span>✍️ I'll type my custom counts</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                              </div>
                            )}
                            {msg.isFoodChoiceMode && (
                              <div className="mt-4 flex flex-col gap-2">
                                <button
                                  onClick={() => handleChatSubmit(undefined, "Suggest for me")}
                                  className="px-4 py-3 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md text-left flex justify-between items-center"
                                >
                                  <span>🤖 Suggest for me</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                                <button
                                  onClick={() => handleChatSubmit(undefined, "I have specific food")}
                                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-left flex justify-between items-center"
                                >
                                  <span>📝 I have specific food</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                              </div>
                            )}
                            {msg.isPortionControlMode && (
                              <div className="mt-4 flex flex-col gap-2">
                                <button
                                  onClick={() => handleChatSubmit(undefined, "System automatically calculate")}
                                  className="px-4 py-3 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md text-left flex justify-between items-center"
                                >
                                  <span>🤖 Auto-calculate optimal portions</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                                <button
                                  onClick={() => handleChatSubmit(undefined, "I will specify portions")}
                                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-left flex justify-between items-center"
                                >
                                  <span>⚖️ I will specify portions</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </button>
                              </div>
                            )}
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
                          {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-4">
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.1s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                      </div>
                      {!isChatting && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agents collaborating...</span>
                      )}
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

            { }
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

          { }
          <section className={`col-span-12 ${Object.keys(monitoringStep).length > 0 ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col space-y-4 h-[calc(100vh-190px)] min-h-0`}>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth custom-scrollbar pb-20" ref={scrollRef}>
              {/* Start New Plan banner — always visible when results exist */}
              {steps.length > 0 && (
                <div className="flex items-center justify-between bg-slate-900 rounded-2xl px-5 py-3 mb-2">
                  <p className="text-xs font-bold text-slate-300">Viewing a previous plan result</p>
                  <button
                    onClick={restartChat}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Start New Plan
                  </button>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {steps.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-full bg-white border border-slate-100 rounded-[2rem] shadow-sm"
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr]">
                      <div className="p-8 lg:p-10 flex flex-col justify-center min-h-[500px]">
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
                      <InfoTile icon={<DollarSign className="w-4 h-4" />} label="Budget" value={customerStep.budget || eventData.budget || '--'} />
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

                {Object.keys(monitoringStep).length > 0 && !showDetailedAgentView && (
                  <motion.div
                    key="final-summary-highlight"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-900/8"
                  >
                    {/* Hero gradient header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 md:p-10">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />
                      <div className="relative z-10">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Multi-Agent Orchestration Complete</p>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Smart Catering Blueprint</h2>
                            <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">{monitoringStep.final_summary || 'Blueprint synchronized across all agents.'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              onClick={() => setDashboardView('inventory-planner')}
                              className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition shadow-lg flex items-center gap-2"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Inventory Plan
                            </button>
                            <button onClick={exportBlueprint} className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition">
                              Export
                            </button>
                          </div>
                        </div>

                        {/* KPI Stat Cards */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { label: 'Your Budget', value: customerStep.budget || eventData.budget || '--', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
                            { label: 'Guests', value: customerStep.guests || eventData.guest_count || '--', color: 'from-sky-500/20 to-sky-600/10', border: 'border-sky-500/30', text: 'text-sky-300' },
                            { label: 'Readiness', value: monitoringStep.execution_readiness ? `${monitoringStep.execution_readiness}%` : '--', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', text: 'text-violet-300' },
                          ].map(({ label, value, color, border, text }) => (
                            <div key={label} className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4`}>
                              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 mb-1">{label}</p>
                              <p className={`text-xl font-black ${text} tracking-tight truncate`}>{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results Grid */}
                    <div className="p-8 space-y-6">
                      {/* Menu Items */}
                      {(menuStep.menu || []).length > 0 && (
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">AI Recommendations ({(menuStep.menu || []).length})</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {(menuStep.menu || []).map((item: any, i: number) => (
                              <div key={`${item.dish}-${i}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10">
                                <FoodImageFrame item={item} compact />
                                <div className="p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-950 leading-tight">{item.dish}</p>
                                      <p className="mt-1 text-xs font-semibold text-slate-500 line-clamp-2">{item.description}</p>
                                    </div>
                                    {(item.price || item.portion_per_guest) && (
                                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 border border-emerald-100">
                                        {item.price || item.portion_per_guest}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {[(item.category || ''), ...(item.tags || [])].filter(Boolean).slice(0, 3).map((tag: string) => (
                                      <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{tag}</span>
                                    ))}
                                  </div>
                                  {item.reasoning && <p className="text-xs leading-relaxed text-slate-600">{item.reasoning}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics Table */}
                      <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-400">Metric</th>
                              <th className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-400">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {buildSummaryRows().slice(0, 8).map(([label, value]) => (
                              <tr key={label} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">{label}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{String(value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Catering Shop Recommendations */}
                      {(supplierStep.catering_shop_recommendations || []).length > 0 && (
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Recommended Catering Shops</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(supplierStep.catering_shop_recommendations || []).slice(0, 3).map((shop: any, i: number) => (
                              <div key={i} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="text-sm font-black text-slate-900">{shop.name}</p>
                                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{shop.match_score}</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{shop.area}</p>
                                {shop.reason && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{shop.reason}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staffing & Logistics */}
                      {logisticsStep.staffing_needs && (
                        <div className="flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Staffing & Operations</p>
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed">{logisticsStep.staffing_needs}</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setShowDetailedAgentView(true)}
                          className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-800 text-white px-7 py-3.5 rounded-full text-sm font-black uppercase tracking-wider transition shadow-lg"
                        >
                          View Detailed Agent Breakdown
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                { }
                {(steps.length > 0 && (!Object.keys(monitoringStep).length || showDetailedAgentView)) && (
                  <div key="agent-reports-container" className="space-y-12">
                    {Object.keys(monitoringStep).length > 0 && (
                      <div className="flex items-center mt-2 mb-[-20px]">
                        <button
                          onClick={() => setShowDetailedAgentView(false)}
                          className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] transition"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Blueprint Summary
                        </button>
                      </div>
                    )}
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

                    {(() => {
                      const ORCHESTRATION_PHASES = [
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
                      ];

                      const activePhases = ORCHESTRATION_PHASES.filter(phase =>
                        visibleSteps.some(s => phase.agents.some(name => s.agent.includes(name)))
                      );

                      if (activePhases.length === 0) return null;

                      // Ensure activePhaseIndex is within bounds
                      const safeIndex = Math.min(activePhaseIndex, activePhases.length - 1);
                      const currentPhase = activePhases[safeIndex];
                      const phaseSteps = visibleSteps.filter(s => currentPhase.agents.some(name => s.agent.includes(name)));

                      // Auto-advance during processing is handled via standard navigation now

                      return (
                        <div className="space-y-6 relative border border-slate-200 bg-white rounded-3xl p-6 shadow-sm">
                          {/* Stepper Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                                Step {safeIndex + 1} of {activePhases.length}
                              </span>
                              <h2 className="text-xl font-bold text-slate-800">{currentPhase.title}</h2>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActivePhaseIndex(Math.max(0, safeIndex - 1))}
                                disabled={safeIndex === 0}
                                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => setActivePhaseIndex(Math.min(activePhases.length - 1, safeIndex + 1))}
                                disabled={safeIndex === activePhases.length - 1}
                                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-full bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700 transition"
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-4 py-2 bg-gradient-to-r from-emerald-50 to-transparent rounded-r-lg">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{currentPhase.title}</h3>
                              <span className="text-[10px] text-emerald-600 font-bold tracking-widest">{currentPhase.subtitle}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{currentPhase.desc}</p>
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

                          {/* Footer Stepper Controls */}
                          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
                            <div className="flex gap-1">
                              {activePhases.map((_, i) => (
                                <div
                                  key={i}
                                  onClick={() => setActivePhaseIndex(i)}
                                  className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${i === safeIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-200 hover:bg-emerald-200'}`}
                                />
                              ))}
                            </div>
                            {safeIndex < activePhases.length - 1 && (
                              <button
                                onClick={() => setActivePhaseIndex(safeIndex + 1)}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider"
                              >
                                Continue to next step →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {dashboardView === 'menu-editor' && (
                  <MenuEditor
                    menu={localMenu}
                    onChange={(newMenu) => setLocalMenu(newMenu)}
                  />
                )}
                {dashboardView === 'inventory-planner' && (
                  <CustomerPlanner
                    menu={localMenu}
                    inventory={localInventory}
                  />
                )}
                {dashboardView === 'admin-inbox' && (
                  <AdminInbox
                    plans={[]}
                    adminUid={user.uid}
                    adminName={user.displayName || 'Admin'}
                    onSendMessage={async (planId, text) => {
                      console.log(`Sending to ${planId}: ${text}`);
                    }}
                    onUpdateStatus={(id, status) => {
                      console.log(`Status of ${id} changed to ${status}`);
                    }}
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
      </>
    )}
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
              Tutorial
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
    <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-fit sticky top-8">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-white/30">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 drop-shadow-sm">Problem Fit</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">iNextLabs requirements mapped</p>
        </div>
        <div className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/60 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 drop-shadow-sm" />
        </div>
      </div>
      <div className="p-6 pt-4 space-y-3">
        {requirements.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-white/50 bg-white/30 backdrop-blur-md p-4 shadow-sm transition-all hover:bg-white/40">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            <span className="text-xs font-black text-slate-800">{value}</span>
          </div>
        ))}
        <div className="rounded-2xl border border-amber-100/50 bg-amber-50/50 backdrop-blur-md p-4 mt-6 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-3">Required Stack</p>
          <div className="space-y-2">
            {stackRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className={`font-black text-right ${String(value).includes('implemented') ? 'text-emerald-700' : 'text-amber-700'}`}>{String(value).replaceAll('_', ' ')}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9px] leading-4 text-slate-600 font-medium border-t border-amber-200/50 pt-3">
            Recommendations are generated by the configured Azure AI runtime. Missing credentials now surface as an error instead of demo content.
          </p>
        </div>
      </div>
    </div>
  );
}

function FoodImageFrame({ item, compact = false }: { item: any, compact?: boolean }) {
  const height = compact ? "h-36" : "h-52";
  if (item?.image_url) {
    return (
      <div className={`relative ${height} overflow-hidden bg-slate-100`}>
        <img src={item.image_url} alt={item.dish} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className={`relative ${height} overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ecfdf5,transparent_36%),linear-gradient(135deg,#f8fafc,#dff7ea_55%,#fef3c7)]`}>
      <div className="absolute inset-x-6 bottom-5 h-14 rounded-full bg-white/35 blur-xl" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/55 text-emerald-700 shadow-lg backdrop-blur">
          <Utensils className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function FoodDetailModal({ item, onClose }: { item: any, onClose: () => void }) {
  if (!item) return null;
  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="relative overflow-hidden">
          <FoodImageFrame item={item} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"><X className="w-4 h-4" /></button>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">{item.category || item.tags?.[0] || 'AI Recommendation'}</p>
            <h3 className="text-xl font-black text-white leading-tight">{item.dish}</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">About this dish</p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <Utensils className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Portion</p>
                <p className="text-sm font-bold text-slate-800">{item.portion_per_guest || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
              <DollarSign className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">Price</p>
                <p className="text-sm font-bold text-slate-800">{item.price || '--'}</p>
              </div>
            </div>
          </div>
          {ingredients.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ingredients</p>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-800">{ing}</span>
                ))}
              </div>
            </div>
          )}
          <div className={`rounded-2xl px-4 py-3 border text-xs font-semibold ${item.dietary_compliance === 'Needs substitution' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            {item.dietary_compliance === 'Needs substitution' ? '⚠️ Needs substitution — allergen detected' : '✓ Dietary compliant'}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AgentReport({ step, isExpanded, onToggle }: { step: AgentStep, isExpanded: boolean, onToggle: () => void, key?: any }) {
  const { agent, data } = step;
  const [selectedFood, setSelectedFood] = useState<any>(null);

  const getStatusColor = (agent: string) => {
    if (agent.includes('Concierge')) return 'bg-white/40 text-emerald-800 border-white/50 shadow-sm';
    if (agent.includes('Head Chef')) return 'bg-white/40 text-sky-800 border-white/50 shadow-sm';
    if (agent.includes('Accountant')) return 'bg-white/40 text-amber-800 border-white/50 shadow-sm';
    if (agent.includes('Logistics Lead')) return 'bg-white/40 text-rose-800 border-white/50 shadow-sm';
    if (agent.includes('Dietary')) return 'bg-white/40 text-pink-800 border-white/50 shadow-sm';
    if (agent.includes('Weather')) return 'bg-white/40 text-sky-800 border-white/50 shadow-sm';
    if (agent.includes('Supplier')) return 'bg-white/40 text-amber-800 border-white/50 shadow-sm';
    if (agent.includes('Inventory')) return 'bg-white/40 text-emerald-800 border-white/50 shadow-sm';
    return 'bg-white/40 text-slate-800 border-white/50 shadow-sm';
  };

  const getStatusText = (agent: string) => {
    if (agent.includes('Concierge')) return 'INTENT';
    if (agent.includes('Head Chef')) return 'DESIGN';
    if (agent.includes('Accountant')) return 'OPTIMIZE';
    if (agent.includes('Logistics Lead')) return 'EXECUTE';
    if (agent.includes('Weather')) return 'FORECAST';
    if (agent.includes('Dietary')) return 'SAFETY';
    if (agent.includes('Supplier')) return 'SOURCE';
    if (agent.includes('Inventory')) return 'PROCURE';
    return 'READY';
  };

  const renderContent = () => {
    switch (agent) {
      case 'Phase 1: Concierge (User Intent)':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Event Type" value={data.event_type} />
              <InfoItem label="Location" value={data.location} />
              <InfoItem label="Cuisine" value={data.cuisine_preference} />
              <InfoItem label="Service Style" value={data.service_style} />
            </div>
            {data.cultural_profile && (
              <div className="rounded-2xl border border-white/50 bg-white/30 backdrop-blur-md p-4 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Language Detected</p>
                <p className="mt-1 text-xs leading-5 text-slate-800">
                  {data.cultural_profile.language} input detected.
                </p>
              </div>
            )}
          </div>
        );
      case 'Dietary & Allergens Specialist':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/30 backdrop-blur-md p-4 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1 tracking-tight">Allergies to Avoid</span>
              <p className="text-xs text-slate-800 font-medium">{data.allergens_to_avoid?.length > 0 ? data.allergens_to_avoid.join(', ') : 'None'}</p>
            </div>
            <div className="bg-white/30 backdrop-blur-md p-4 border border-white/50 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1 tracking-tight">Dietary Preferences</span>
              <p className="text-xs text-slate-800 font-medium">{data.recommended_labels?.length > 0 ? data.recommended_labels.join(', ') : 'None'}</p>
            </div>
          </div>
        );
      case 'Phase 2: Head Chef (Menu Design)':
        return (
          <div className="space-y-4">
            <AnimatePresence>
              {selectedFood && (
                <FoodDetailModal item={selectedFood} onClose={() => setSelectedFood(null)} />
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(data.menu || data.dishes)?.map((item: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedFood(item)}
                  className="text-left bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col group transition-all hover:border-emerald-300 hover:shadow-lg shadow-sm cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <FoodImageFrame item={item} compact />
                    <div className="absolute top-3 right-3">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 backdrop-blur text-white px-2 py-1 rounded-full border border-white/30">Tap for details</span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-0.5">
                        {item.category || item.tags?.[0] || 'AI Recommendation'}
                      </p>
                      <span className="text-base font-black text-white tracking-tight line-clamp-1">{item.dish}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium flex-1">{item.description}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 truncate">{item.portion_per_guest || '--'}</span>
                      <span className="text-xs text-sky-700 font-bold bg-sky-50 px-3 py-1 rounded-full border border-sky-100 truncate">{item.price || '--'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'Inventory & Procurement Specialist':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {data.procurement_list?.slice(0, 4).map((ing: any, i: number) => (
                <div key={i} className="bg-white/30 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-2xl font-black text-slate-800">{ing.qty?.split(' ')[0] || '--'}</span>
                  <span className="text-xs font-bold text-emerald-700 ml-1">{ing.qty?.split(' ')[1] || ''}</span>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-bold">{ing.item}</p>
                </div>
              ))}
            </div>
            {data.potential_shortages?.length > 0 && (
              <div className="bg-rose-50/50 backdrop-blur-md p-3 border border-rose-100/50 rounded-2xl">
                <span className="text-[9px] font-bold text-rose-700 uppercase block mb-1 tracking-widest">Potential Shortages</span>
                <p className="text-xs text-slate-700">{data.potential_shortages.join(', ')}</p>
              </div>
            )}
          </div>
        );
      case 'Supplier Intelligence Specialist':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.catering_shop_recommendations || data.supplier_matches || []).slice(0, 4).map((supplier: any, i: number) => (
              <div key={i} className="rounded-2xl border border-white/50 bg-white/30 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{supplier.name}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{supplier.area || supplier.market}</p>
                  </div>
                  <span className="rounded-full bg-white/50 border border-white/60 px-3 py-1 text-[10px] font-black text-emerald-800 shadow-sm">{supplier.score || supplier.match_score}</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium line-clamp-2">{supplier.reason || supplier.specialties}</p>
                {supplier.contact && (
                  <p className="mt-3 pt-3 border-t border-white/30 text-[10px] font-bold text-emerald-700 flex items-center gap-1.5 break-all">
                    <span className="bg-emerald-500/10 p-1 rounded-full"><svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
                    {supplier.contact}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      case 'Phase 3: Accountant (Cost Optimization)':
        return (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md p-6 text-center shadow-sm">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] drop-shadow-sm">Total Projected Cost</span>
              <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">{data.optimized_quote}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/30 backdrop-blur-md p-5 border border-white/50 rounded-2xl shadow-sm text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cost Per Guest</span>
                <p className="text-xl font-black text-slate-800 drop-shadow-sm">{data.unit_cost?.split('/')[0] || '--'}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md p-5 border border-white/50 rounded-2xl shadow-sm text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Profit Yield</span>
                <p className="text-xl font-black text-emerald-700 drop-shadow-sm">{data.profit_margin}</p>
              </div>
            </div>
          </div>
        );
      case 'Weather Intelligence':
      case 'Weather Intelligence Agent':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
              <div className={`p-3 rounded-2xl shadow-inner ${data.risk_level === 'high' ? 'bg-rose-100/50 text-rose-700' : 'bg-sky-100/50 text-sky-700'}`}>
                {data.risk_level === 'high' ? <CloudRain className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 tracking-tight">{data.summary}</p>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${data.risk_level === 'high' ? 'text-rose-600' : 'text-sky-600'}`}>Risk Level: {data.risk_level}</p>
              </div>
            </div>
          </div>
        );
      case 'Phase 4: Logistics Lead (Execution)':
        return (
          <div className="space-y-4">
            <div className="bg-white/30 backdrop-blur-md p-5 border border-white/50 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-6 bg-slate-400 rounded-full" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Staffing & Transport</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium pl-5">{data.staffing_needs}</p>
              <p className="text-[11px] text-slate-500 font-medium pl-5 mt-1">{data.transport_plan}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.timeline?.slice(-4).map((t: any, i: number) => (
                <div key={i} className="flex flex-col bg-white/40 backdrop-blur-md p-4 border border-white/60 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-700 bg-white/60 px-3 py-1 rounded-full border border-white/80 shadow-sm">{t.time}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{t.activity}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <div className="text-[8px] text-slate-500/60 font-mono uppercase italic break-all opacity-50">{JSON.stringify(data).substring(0, 100)}...</div>;
    }
  };

  const getPhaseGradient = (agent: string) => {
    if (agent.includes('Concierge')) return 'from-emerald-900 via-emerald-950 to-slate-900';
    if (agent.includes('Head Chef')) return 'from-sky-900 via-slate-900 to-slate-900';
    if (agent.includes('Accountant')) return 'from-amber-900 via-slate-900 to-slate-900';
    if (agent.includes('Logistics Lead')) return 'from-rose-900 via-slate-900 to-slate-900';
    if (agent.includes('Dietary')) return 'from-pink-900 via-slate-900 to-slate-900';
    if (agent.includes('Weather')) return 'from-sky-900 via-indigo-950 to-slate-900';
    if (agent.includes('Supplier')) return 'from-amber-900 via-orange-950 to-slate-900';
    if (agent.includes('Inventory')) return 'from-teal-900 via-emerald-950 to-slate-900';
    return 'from-slate-800 via-slate-900 to-slate-950';
  };

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-4">
      {/* Dark gradient header */}
      <div
        onClick={onToggle}
        className={`relative overflow-hidden bg-gradient-to-br ${getPhaseGradient(agent)} cursor-pointer select-none`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/30'} transition-all`} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              {agent.replace(' Agent', '').replace('Phase 1: ', '').replace('Phase 2: ', '').replace('Phase 3: ', '').replace('Phase 4: ', '')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest bg-white/15 border border-white/20 text-white/80">
              {getStatusText(agent)}
            </span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-white/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </motion.div>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-slate-100">
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


