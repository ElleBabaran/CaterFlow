export interface Question {
  key: string;
  text: string;
}

export const QUESTIONS: Question[] = [
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

export const QUESTION_TRANSLATIONS: Record<string, Record<string, string>> = {
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

export function normalizeLanguage(value = "") {
  const text = value.toLowerCase();
  if (/tagalog|filipino|tl|pilipino/.test(text)) return "tagalog";
  if (/spanish|espanol|español/.test(text)) return "spanish";
  if (/japanese|nihongo|jp|日本語/.test(text)) return "japanese";
  return "english";
}

export function getQuestionText(index: number, language?: string) {
  const question = QUESTIONS[index];
  if (!question) return "";
  const normalized = normalizeLanguage(language);
  return QUESTION_TRANSLATIONS[normalized]?.[question.key] || question.text;
}

export function detectFoodChoiceMode(userText: string): 'suggest' | 'specific' {
  const text = userText.toLowerCase();
  const suggestKeywords = [
    'suggest', 'chef', 'decide', 'bahala', 'kayo', 'mag-suggest',
    'you choose', 'up to you', 'your choice', 'recommend'
  ];
  const specificKeywords = [
    'specific', 'i have', 'meron', 'mayroon', 'ako', 'i want',
    'i know', 'already', 'particular'
  ];
  
  const suggestScore = suggestKeywords.filter(k => text.includes(k)).length;
  const specificScore = specificKeywords.filter(k => text.includes(k)).length;
  
  return suggestScore >= specificScore ? 'suggest' : 'specific';
}

export const SUMMARY_FIELDS = [
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
