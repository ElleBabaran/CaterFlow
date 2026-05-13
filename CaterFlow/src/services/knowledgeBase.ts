import { parseBudgetDetails } from "./budget";

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
  return [];
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
    console.warn("Azure AI Search unavailable:", error);
  }

  return {
    mode: "ai_only_no_rag",
    retrieved_playbooks: [],
    supplier_sources: [],
  };
}

export function buildSupplierContext() {
  return [];
}

export function selectMenuItems(input: string, dietaryNeeds = "") {
  return [];
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

  return [].map((supplier: any) => {
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

  return [].map((shop: any) => {
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
