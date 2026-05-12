import { parseBudgetDetails } from "./budget";

export const MENU_KNOWLEDGE_BASE = [
  {
    id: "kb-tropical-buffet",
    title: "Tropical buffet playbook",
    tags: ["filipino", "outdoor", "humid", "buffet", "manila"],
    guidance: "Use grilled mains, sauced items held separately, chilled fruit, and insulated drink stations for humid outdoor events.",
  },
  {
    id: "kb-corporate-service",
    title: "Corporate lunch service",
    tags: ["corporate", "lunch", "professional", "schedule"],
    guidance: "Prioritize neat plated or boxed portions, low-mess sauces, vegetarian parity, clear allergen labels, and a 45 minute setup buffer.",
  },
  {
    id: "kb-filipino-spanish",
    title: "Filipino-Spanish celebration menu",
    tags: ["filipino", "spanish", "fusion", "wedding", "cocktail"],
    guidance: "Blend familiar Filipino staples with Spanish service cues: paella-style rice, grilled skewers, calamansi, sofrito, and tapas-style passed bites.",
  },
  {
    id: "kb-dietary-safety",
    title: "Dietary safety controls",
    tags: ["allergy", "vegetarian", "halal", "vegan", "gluten", "peanut"],
    guidance: "Separate prep tools, mark allergen zones, keep sealed alternatives, and require final dietary confirmation before procurement.",
  },
  {
    id: "kb-rain-contingency",
    title: "Rain and delay contingency",
    tags: ["rain", "weather", "delay", "logistics", "tent", "outdoor"],
    guidance: "Add covered loading, water-resistant packaging, a 30 minute travel buffer, and warm holding equipment for weather risk.",
  },
  {
    id: "kb-low-waste",
    title: "Low-waste packaging and leftovers",
    tags: ["sustainable", "low-waste", "packaging", "donation"],
    guidance: "Use reusable trays where possible, compostable serviceware for disposables, batch replenishment, and a labeled leftover donation protocol.",
  },
];

export const MENU_CATALOG = [
  {
    dish: "Chicken Inasal Skewers",
    tags: ["filipino", "halal-friendly", "grill", "corporate"],
    description: "Calamansi, annatto, garlic, and lemongrass grilled chicken skewers with atsara.",
    portion_per_guest: "2 skewers",
    macros: { calories: 290, protein_g: 28, carbs_g: 8, fat_g: 15 },
    allergens: [],
    image_keyword: "filipino grilled chicken skewers",
  },
  {
    dish: "Seafood Paella Valenciana",
    tags: ["spanish", "filipino-spanish", "premium", "buffet"],
    description: "Saffron rice with seafood, peppers, peas, and citrus wedges for a centerpiece tray.",
    portion_per_guest: "160 g",
    macros: { calories: 380, protein_g: 22, carbs_g: 48, fat_g: 12 },
    allergens: ["shellfish"],
    image_keyword: "seafood paella tray",
  },
  {
    dish: "Vegan Kare-Kare Cups",
    tags: ["filipino", "vegan", "vegetarian", "allergy-safe"],
    description: "Roasted vegetables with annatto rice and peanut-free sunflower kare-kare sauce.",
    portion_per_guest: "1 cup",
    macros: { calories: 260, protein_g: 9, carbs_g: 34, fat_g: 10 },
    allergens: ["sunflower"],
    image_keyword: "vegan filipino vegetable bowl",
  },
  {
    dish: "Beef Salpicao Bites",
    tags: ["spanish", "cocktail", "premium", "beef"],
    description: "Garlic-seared beef cubes with mushroom jus and toasted bread rounds.",
    portion_per_guest: "3 bites",
    macros: { calories: 310, protein_g: 24, carbs_g: 14, fat_g: 17 },
    allergens: ["gluten"],
    image_keyword: "beef tapas bites",
  },
  {
    dish: "Lumpiang Sariwa Rolls",
    tags: ["filipino", "vegetarian", "light", "corporate"],
    description: "Fresh vegetable rolls with garlic soy drizzle and clearly labeled sauce cups.",
    portion_per_guest: "1 roll",
    macros: { calories: 180, protein_g: 6, carbs_g: 28, fat_g: 5 },
    allergens: ["soy", "gluten"],
    image_keyword: "fresh lumpia rolls",
  },
  {
    dish: "Calamansi Leche Flan Verrines",
    tags: ["dessert", "filipino", "spanish", "premium"],
    description: "Mini custard cups with calamansi caramel and crisp coconut crumb.",
    portion_per_guest: "1 verrine",
    macros: { calories: 210, protein_g: 5, carbs_g: 28, fat_g: 9 },
    allergens: ["egg", "dairy"],
    image_keyword: "mini leche flan dessert cups",
  },
  {
    dish: "Tropical Beverage Bar",
    tags: ["drinks", "outdoor", "corporate", "filipino"],
    description: "Calamansi cooler, dalandan iced tea, cucumber water, coffee, and ice reserve.",
    portion_per_guest: "600 ml",
    macros: { calories: 120, protein_g: 0, carbs_g: 30, fat_g: 0 },
    allergens: [],
    image_keyword: "tropical beverage station",
  },
];

export const SUPPLIER_KNOWLEDGE_BASE = [
  {
    name: "Balintawak Poultry & Meat Hub",
    categories: ["chicken", "beef", "pork", "eggs"],
    market: "Balintawak Market",
    lat: 14.657,
    lng: 121.001,
    reliability: 92,
    lead_time_hours: 18,
    poultry_php_per_kg: 175,
    beef_php_per_kg: 430,
    notes: "Strong poultry pricing and early-morning cold chain pickups.",
  },
  {
    name: "Quinta Fresh Market Cooperative",
    categories: ["seafood", "vegetables", "fruit", "herbs"],
    market: "Quinta Market",
    lat: 14.598,
    lng: 120.984,
    reliability: 89,
    lead_time_hours: 16,
    seafood_php_per_kg: 360,
    vegetables_php_per_kg: 95,
    notes: "Good for seafood and herbs when Manila venue access is central.",
  },
  {
    name: "Pasig Halal Provisions",
    categories: ["halal", "chicken", "beef", "dry goods"],
    market: "Pasig",
    lat: 14.576,
    lng: 121.085,
    reliability: 94,
    lead_time_hours: 20,
    poultry_php_per_kg: 188,
    beef_php_per_kg: 455,
    notes: "Use for halal assurance and signed supplier documentation.",
  },
  {
    name: "EventGear Logistics Manila",
    categories: ["equipment", "tents", "warmers", "transport"],
    market: "Mandaluyong",
    lat: 14.579,
    lng: 121.035,
    reliability: 93,
    lead_time_hours: 12,
    equipment_php_day: 14500,
    notes: "Preferred for tents, warmers, chafing dishes, and vehicle add-ons.",
  },
  {
    name: "PantryLink Wholesale",
    categories: ["beverages", "packaging", "dry goods", "coffee"],
    market: "Taguig",
    lat: 14.529,
    lng: 121.053,
    reliability: 90,
    lead_time_hours: 10,
    beverages_php_per_guest: 95,
    notes: "Fastest for drinks, serviceware, grains, backup pantry items, and coffee.",
  },
];

export const CATERING_SHOP_BASE = [
  {
    name: "Casa Mesa Catering Studio",
    area: "BGC Taguig",
    lat: 14.552,
    lng: 121.051,
    cuisines: ["filipino", "spanish", "corporate", "cocktail"],
    base_package_php_per_guest: 1350,
    min_guests: 50,
    rating: 4.8,
    specialties: "Filipino-Spanish buffet, cocktail hour, dessert station",
  },
  {
    name: "Halal Harvest Events",
    area: "Pasig",
    lat: 14.576,
    lng: 121.085,
    cuisines: ["halal", "filipino", "middle eastern", "corporate"],
    base_package_php_per_guest: 1250,
    min_guests: 40,
    rating: 4.7,
    specialties: "Halal-certified mains, vegetarian trays, allergen-aware labeling",
  },
  {
    name: "Makati Social Table",
    area: "Makati",
    lat: 14.556,
    lng: 121.024,
    cuisines: ["international", "spanish", "premium", "wedding"],
    base_package_php_per_guest: 1650,
    min_guests: 80,
    rating: 4.6,
    specialties: "Premium plated service, tapas, grazing tables",
  },
  {
    name: "Quezon City Fiesta Kitchen",
    area: "Quezon City",
    lat: 14.642,
    lng: 121.043,
    cuisines: ["filipino", "buffet", "birthday", "large event"],
    base_package_php_per_guest: 950,
    min_guests: 60,
    rating: 4.5,
    specialties: "Value buffet, grilled packages, family-style desserts",
  },
  {
    name: "Green Spoon Plant-Based Catering",
    area: "Mandaluyong",
    lat: 14.579,
    lng: 121.035,
    cuisines: ["vegan", "vegetarian", "healthy", "corporate"],
    base_package_php_per_guest: 1150,
    min_guests: 30,
    rating: 4.7,
    specialties: "Vegan bowls, gluten-aware sides, low-waste packaging",
  },
];

const LANGUAGE_PATTERNS = [
  { language: "Tagalog", pattern: /\b(kailangan|para sa|handa|bisita|salamat|po|sa may|magkano|pagkain)\b/i },
  { language: "Spanish", pattern: /\b(boda|cumpleanos|cena|comida|presupuesto|invitados|sin gluten|mariscos)\b/i },
  { language: "English", pattern: /\b(event|guests|budget|location|menu|catering|wedding|corporate)\b/i },
];

export function detectLanguage(input: string) {
  return LANGUAGE_PATTERNS.find(({ pattern }) => pattern.test(input))?.language || "English";
}

export function inferCulturalProfile(input: string) {
  const normalized = input.toLowerCase();
  const cuisineHints = [
    normalized.includes("filipino") && "Filipino",
    normalized.includes("spanish") && "Spanish",
    normalized.includes("japanese") && "Japanese",
    normalized.includes("halal") && "Halal-aware",
    normalized.includes("vegan") && "Plant-forward",
  ].filter(Boolean);

  return {
    language: detectLanguage(input),
    cuisine_signals: cuisineHints.length ? cuisineHints : ["International"],
    adaptation: cuisineHints.includes("Filipino") && cuisineHints.includes("Spanish")
      ? "Use Filipino-Spanish fusion with familiar local flavors, tapas-style service cues, and clearly labeled dietary variants."
      : "Preserve the user's cuisine preference while keeping service format and dietary safety explicit.",
  };
}

export function retrieveKnowledge(input: string) {
  const normalizedInput = input.toLowerCase();
  const scored = MENU_KNOWLEDGE_BASE.map((entry) => {
    const score = entry.tags.reduce((total, tag) => total + (normalizedInput.includes(tag) ? 1 : 0), 0);
    return { ...entry, score };
  }).sort((a, b) => b.score - a.score);

  const selected = scored.filter((entry) => entry.score > 0).slice(0, 4);
  return selected.length > 0 ? selected : scored.slice(0, 3);
}

export async function retrieveKnowledgeWithAzure(input: string) {
  try {
    const response = await fetch("/api/rag/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input, indexes: ["menus", "suppliers"] }),
    });

    if (!response.ok) throw new Error(`RAG API returned ${response.status}`);
    const payload = await response.json();

    if (payload.mode === "azure_ai_search" && payload.results?.length) {
      return {
        mode: "azure_ai_search",
        retrieved_playbooks: payload.results.filter((item: any) => item.index === "menus"),
        supplier_sources: payload.results.filter((item: any) => item.index === "suppliers"),
      };
    }
  } catch (error) {
    console.warn("Azure AI Search unavailable, using local fallback:", error);
  }

  return {
    mode: "local_fallback",
    retrieved_playbooks: retrieveKnowledge(input),
    supplier_sources: buildSupplierContext(),
  };
}

export function buildSupplierContext() {
  return SUPPLIER_KNOWLEDGE_BASE.map((supplier) => ({
    ...supplier,
    categories: supplier.categories.join(", "),
  }));
}

export function selectMenuItems(input: string, dietaryNeeds = "") {
  const normalized = `${input} ${dietaryNeeds}`.toLowerCase();
  const blockedAllergens = extractAllergens(normalized);
  const requestedTags = normalized.split(/[^a-z]+/).filter(Boolean);

  const scored = MENU_CATALOG.map((item) => {
    const score = item.tags.reduce((total, tag) => total + (requestedTags.includes(tag) || normalized.includes(tag) ? 2 : 0), 0);
    const allergenPenalty = item.allergens.some((allergen) => blockedAllergens.includes(allergen)) ? -10 : 0;
    return { ...item, score: score + allergenPenalty };
  }).sort((a, b) => b.score - a.score);

  const safe = scored.filter((item) => item.score > -5).slice(0, 6);
  return safe.length >= 4 ? safe : MENU_CATALOG.slice(0, 6);
}

export function extractAllergens(input: string) {
  const known = ["peanut", "tree nut", "shellfish", "dairy", "egg", "gluten", "soy", "sesame"];
  return known.filter((allergen) => input.toLowerCase().includes(allergen) || input.toLowerCase().includes(`no ${allergen}`));
}

export function dietaryLabels(input: string) {
  const normalized = input.toLowerCase();
  return [
    normalized.includes("halal") && "Halal",
    normalized.includes("vegan") && "Vegan",
    normalized.includes("vegetarian") && "Vegetarian",
    normalized.includes("gluten") && "Gluten-aware",
    normalized.includes("peanut") && "Peanut-free controls",
  ].filter(Boolean);
}

export async function scoreSuppliers(location = "", input = "") {
  const normalized = `${location} ${input}`.toLowerCase();
  const venueBias = await inferVenueCoordinates(location || input);

  return SUPPLIER_KNOWLEDGE_BASE.map((supplier) => {
    const distanceKm = Math.round(haversineKm(venueBias.lat, venueBias.lng, supplier.lat, supplier.lng) * 10) / 10;
    const relevance = supplier.categories.reduce((total, category) => total + (normalized.includes(category) ? 8 : 0), 0);
    const trafficBuffer = distanceKm > 10 ? 45 : distanceKm > 5 ? 30 : 20;
    const score = Math.max(65, Math.round(supplier.reliability + relevance - distanceKm * 1.4));
    return {
      ...supplier,
      score: `${score}%`,
      estimated_distance_km: distanceKm,
      traffic_buffer_minutes: trafficBuffer,
      reason: `${supplier.market}: ${distanceKm} km estimated route, ${trafficBuffer} min Metro Manila buffer, ${supplier.notes}`,
    };
  }).sort((a, b) => Number.parseInt(b.score) - Number.parseInt(a.score));
}

export function summarizeNutrition(menu: any[]) {
  const totals = menu.reduce((acc, item) => {
    const macros = item.macros || {};
    acc.calories += Number(macros.calories || 0);
    acc.protein_g += Number(macros.protein_g || 0);
    acc.carbs_g += Number(macros.carbs_g || 0);
    acc.fat_g += Number(macros.fat_g || 0);
    return acc;
  }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  return {
    per_guest_estimate: totals,
    note: "Macro estimates are menu-planning approximations and should be verified against final recipes.",
  };
}

export async function recommendCateringShops(location = "", input = "", budgetText = "", guests = 100) {
  const normalized = `${location} ${input}`.toLowerCase();
  const budgetMeta = parseBudgetDetails(budgetText || input);
  const budget = budgetMeta.value;
  const venueBias = await inferVenueCoordinates(location || input);

  return CATERING_SHOP_BASE.map((shop) => {
    const distanceKm = Math.round(haversineKm(venueBias.lat, venueBias.lng, shop.lat, shop.lng) * 10) / 10;
    const estimatedQuote = Math.round(shop.base_package_php_per_guest * guests);
    const cuisineScore = shop.cuisines.reduce((total, cuisine) => total + (normalized.includes(cuisine) ? 13 : 0), 0);
    const distanceScore = Math.max(0, 35 - distanceKm * 2.5);
    const overBudgetRatio = budget ? Math.max(0, (estimatedQuote - budget) / Math.max(budget, 1)) : 0;
    const budgetScore = budget
      ? estimatedQuote <= budget
        ? 40
        : Math.max(-30, 20 - overBudgetRatio * 65)
      : 18;
    const dataConfidencePenalty = normalized.length < 10 ? -8 : 0;
    const matchScore = Math.round(Math.min(98, 30 + cuisineScore + distanceScore + budgetScore + (shop.rating - 4) * 5 + dataConfidencePenalty));

    return {
      ...shop,
      estimated_quote_php: estimatedQuote,
      estimated_distance_km: distanceKm,
      within_budget: budget ? estimatedQuote <= budget : true,
      budget_gap_php: budget ? estimatedQuote - budget : 0,
      match_score: `${matchScore}%`,
      confidence: normalized.length < 10 ? "low" : "medium",
      reason: budget
        ? estimatedQuote <= budget
          ? `${shop.area}, ${distanceKm} km away. Estimated ${budgetMeta.currency} ${estimatedQuote.toLocaleString()} is within the ${budgetMeta.currency} ${budget.toLocaleString()} budget.`
          : `${shop.area}, ${distanceKm} km away. Estimated ${budgetMeta.currency} ${estimatedQuote.toLocaleString()} exceeds budget by ${budgetMeta.currency} ${(estimatedQuote - budget).toLocaleString()}.`
        : `${shop.area}, ${distanceKm} km away. Budget not detected, showing best cuisine/location match.`,
    };
  }).sort((a, b) => {
    if (a.within_budget !== b.within_budget) return a.within_budget ? -1 : 1;
    return Number.parseInt(b.match_score) - Number.parseInt(a.match_score);
  });
}

const geoCache: Record<string, { lat: number, lng: number }> = {};

export async function inferVenueCoordinates(location = "") {
  const normalized = location.toLowerCase();
  
  if (geoCache[normalized]) return geoCache[normalized];

  if (normalized.includes("bgc") || normalized.includes("taguig")) return { lat: 14.55, lng: 121.05 };
  if (normalized.includes("makati")) return { lat: 14.556, lng: 121.024 };
  if (normalized.includes("quezon")) return { lat: 14.642, lng: 121.043 };
  if (normalized.includes("pasig")) return { lat: 14.576, lng: 121.085 };
  if (normalized.includes("manila")) return { lat: 14.5995, lng: 120.9842 };
  
  if (location && location.trim().length > 3) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'CaterFlow-App'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geoCache[normalized] = coords;
        return coords;
      }
    } catch (e) {
      console.error("Geocoding failed, falling back to default.", e);
    }
  }

  return { lat: 14.59, lng: 121.02 };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}
