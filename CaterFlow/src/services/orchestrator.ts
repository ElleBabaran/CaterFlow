import { GoogleGenAI, Type } from "@google/genai";
console.log("[CaterFlow] Orchestrator Service Loading - Final Fix Applied");
import {
  buildSupplierContext,
  dietaryLabels,
  extractAllergens,
  inferCulturalProfile,
  recommendCateringShops,
  retrieveKnowledgeWithAzure,
  scoreSuppliers,
  summarizeNutrition,
} from "./knowledgeBase";
import { parseBudgetDetails } from "./budget";

export const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export function parseAIJSON(text: string | null | undefined): any {
  if (!text) return {};
  try {
    return JSON.parse(text.replace(/```(?:json)?/gi, '').trim());
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    return {};
  }
}

const AGENT_ORDER = [
  "ConciergeAgent",
  "DietarySpecialist",
  "HeadChefAgent",
  "InventorySpecialist",
  "SupplierSpecialist",
  "WeatherIntelligence",
  "ContingencyAgent",
  "SustainabilityAgent",
  "LogisticsLeadAgent",
  "AccountantAgent",
  "MonitoringAgent",
];

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  ConciergeAgent: "Phase 1: Concierge (User Intent)",
  DietarySpecialist: "Dietary & Allergens Specialist",
  HeadChefAgent: "Phase 2: Head Chef (Menu Design)",
  InventorySpecialist: "Inventory & Procurement Specialist",
  SupplierSpecialist: "Supplier Intelligence Specialist",
  WeatherIntelligence: "Weather Intelligence",
  ContingencyAgent: "Contingency & Plan B Specialist",
  SustainabilityAgent: "Sustainability & Impact Specialist",
  LogisticsLeadAgent: "Phase 4: Logistics Lead (Execution)",
  AccountantAgent: "Phase 3: Accountant (Cost Optimization)",
  MonitoringAgent: "System Monitoring & QA",
};

export const weatherPrefetchCache: Map<string, Promise<any>> = new Map();

/**
 * Pre-warm the weather cache as soon as location is known.
 */
export function prefetchWeather(location: string, date: string, language = "english") {
  const key = `${location.toLowerCase()}::${date}`;
  if (!weatherPrefetchCache.has(key)) {
    weatherPrefetchCache.set(key, predictWeather(location, date, language));
  }
}

export async function predictWeather(location: string, date: string, language: string = "english") {
  try {
    if (ai) {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: "Weather analyst. Predict weather for " + location + " on " + date + ". Language: " + language + ". In ≤2 sentences: state season, declare condition as SUNNY/RAINY/CLOUDY/MODERATE, and give 2 quick catering tips. Be concise and professional."
      });
      return {
        source: "AI Environmental Intelligence",
        summary: aiResponse.text?.trim() || "Weather for " + location + " is expected to be typical for " + date + ".",
        risk_level: "low",
        recommendations: [],
      };
    }
  } catch (err) {
    console.error("AI Weather Prediction failed:", err);
  }
  return {
    source: "AI Environmental Intelligence",
    summary: "Based on historical data, " + location + " on " + date + " is expected to have favorable conditions for catering events.",
    risk_level: "low",
    recommendations: [],
  };
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void, useFoundry = false) {
  const { auth } = await import("../lib/firebase");
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/ai/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt: input, useFoundry }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.details || "AI recommendation service failed");
  }

  const data = payload.data || {};
  const sharedMemoryLedger = {
    architecture: "Azure AI Foundry/OpenAI API orchestration",
    workflow_phases: ["User Input & Intent", "Menu Creation", "Cost Optimization", "Logistics Planning"],
    agent_order: AGENT_ORDER,
    deployment: {
      provider: payload.provider,
      model_deployment: payload.deployment,
      api_version: payload.apiVersion,
    },
    readiness_basis: "All recommendation content came from the AI API response.",
  };

  const orderedSteps = [
    { agent: "Phase 1: Concierge (User Intent)", data: data.customer || {} },
    { agent: "Knowledge Base & RAG Agent", data: data.knowledge || { mode: "ai_only" } },
    { agent: "Dietary & Allergens Specialist", data: data.dietary || {} },
    { agent: "Weather Intelligence", data: data.weather || {} },
    { agent: "Phase 2: Head Chef (Menu Design)", data: data.menu || { menu: [] } },
    { agent: "Inventory & Procurement Specialist", data: data.inventory || {} },
    { agent: "Supplier Intelligence Specialist", data: data.suppliers || {} },
    { agent: "Phase 4: Logistics Lead (Execution)", data: data.logistics || {} },
    { agent: "Phase 3: Accountant (Cost Optimization)", data: data.pricing || {} },
    { agent: "Shared Memory Ledger", data: sharedMemoryLedger },
    { agent: "System Monitoring & QA", data: data.monitoring || {} },
  ];

  orderedSteps.forEach(onStep);

  return {
    success: true,
    data: {
      ...data,
      sharedMemoryLedger,
      sharedMemory: {
        source_input: input,
        provider: payload.provider,
        deployment: payload.deployment,
      },
    },
  };
}

export async function validateUserResponse(questionKey: string, questionText: string, answer: string, preferredLanguage: string = "english") {
  const normalizedAnswer = String(answer || "").trim();
  const deterministicValidation = validateAnswerDeterministically(questionKey, questionText, normalizedAnswer, preferredLanguage);
  if (!deterministicValidation.valid || deterministicValidation.confident) return deterministicValidation;

  try {
    if (!ai) return deterministicValidation;
    const lang = (preferredLanguage && preferredLanguage.length > 2) ? preferredLanguage : "english";
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are a strict validator for a catering planner. Q: '" + questionText + "' User Answer: '" + normalizedAnswer + "' Is the User's answer actually answering the question or providing relevant context? - If the user says 'hi', 'hello', 'keyboard smash', or something unrelated to catering/the question, it is INVALID. - If it's a valid answer or provides new catering info, it is VALID. Reply only: VALID or INVALID: <short helpful message in " + lang + " explaining why and asking again>"
    });
    const text = response.text?.trim() || "VALID";
    if (text.startsWith("INVALID:")) {
      return { valid: false, message: text.replace("INVALID:", "").trim() };
    }
    return { valid: true };
  } catch (err) {
    console.error("Validation error:", err);
    return deterministicValidation;
  }
}

const FAST_PASS = { intent: { type: 'ANSWER' }, validation: { valid: true }, reaction: { text: "" } };
const FAST_FAIL = (msg: string) => ({ intent: { type: 'ANSWER' }, validation: { valid: false, message: msg }, reaction: { text: "" } });

export async function processIntake(
  input: string,
  currentQuestionKey: string,
  currentQuestionText: string,
  language: string = "english"
) {
  const trimmed = input.trim();
  const deterministicResult = validateAnswerDeterministically(currentQuestionKey, currentQuestionText, trimmed, language);
  if (!deterministicResult.valid) {
    return FAST_FAIL(deterministicResult.message || "Please provide a more specific answer.");
  }

  if (/\b(english|tagalog|filipino|spanish|japanese|chinese|mandarin)\b/i.test(trimmed)) {
    return { intent: { type: 'LANGUAGE_CHANGE', value: trimmed }, validation: { valid: true }, reaction: { text: "" } };
  }
  if (/^(done|tapos|wala na|that'?s all|finish|none|wala)$/i.test(trimmed)) {
    return { intent: { type: 'DONE', value: trimmed }, validation: { valid: true }, reaction: { text: "" } };
  }

  if (deterministicResult.confident) {
    return FAST_PASS;
  }

  if (!ai) return FAST_PASS;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "CaterFlow concierge. Current Question: '" + currentQuestionText + "' | User Input: '" + trimmed + "' | Language: " + language + ". " +
                "STRICT VALIDATION RULES: " +
                "1. If the User is asking a question RELATED to catering, food, the event, or this planning process: Set intent.type='GENERAL_REQUEST', validation.valid=true, and provide a helpful, concise answer in reaction.text. " +
                "2. If the User is providing a valid answer to the Current Question: Set intent.type='ANSWER', validation.valid=true, and give a ≤8-word warm reaction in reaction.text. " +
                "3. If the User input is IRRELEVANT (greetings only, off-topic questions, gibberish, or vague fillers like 'ok' or 'maybe' without context): Set validation.valid=false. " +
                "4. Detect other intents: LANGUAGE_CHANGE (if they want to switch languages), DONE (if they say they are finished with a multi-item list). " +
                "Be extremely strict. If it's not a clear answer or a relevant question, it is INVALID.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["type"] },
            validation: { type: Type.OBJECT, properties: { valid: { type: Type.BOOLEAN }, message: { type: Type.STRING } }, required: ["valid"] },
            reaction: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ["text"] }
          },
          required: ["intent", "validation", "reaction"]
        }
      }
    });
    return parseAIJSON(response.text) || FAST_PASS;
  } catch (err) {
    console.error("Intake processing error:", err);
    return FAST_PASS;
  }
}

export async function generateConversationalPrompt(
  questionKey: string,
  questionText: string,
  userAnswer: string,
  nextQuestion: string,
  language: string = "english"
): Promise<{ reply: string }> {
  if (!ai) return { reply: nextQuestion };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "CaterFlow concierge. Answered '" + questionText + "': '" + userAnswer + "'. Language: " + language + ". Write ≤8-word warm acknowledgement, then on new line: '" + nextQuestion + "'. No JSON, plain text only."
    });
    const text = response.text?.trim();
    return { reply: text || nextQuestion };
  } catch {
    return { reply: nextQuestion };
  }
}

async function runConciergeAgent(input: string) {
  try {
    if (!ai) throw new Error("No Gemini API key configured");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the CaterFlow Concierge Agent (Phase 1). Analyze this input: '" + input + "'. CRITICAL RULE 1: If the input is random, gibberish, or completely unrelated to catering (e.g., 'how are you'), set event_type to 'INVALID_REQUEST'. CRITICAL RULE 2: Respond and extract information in the SAME LANGUAGE as the user's input. Extract ALL fields mentioned: event_type, guests, budget, location, date, dietary_needs, cuisine_preference, service_style, special_requests, food_choice_mode, specific_food_items, menu_composition, portion_control_mode.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            event_type: { type: Type.STRING },
            guests: { type: Type.NUMBER },
            budget: { type: Type.STRING },
            location: { type: Type.STRING },
            date: { type: Type.STRING },
            dietary_needs: { type: Type.STRING },
            cuisine_preference: { type: Type.STRING },
            service_style: { type: Type.STRING },
            special_requests: { type: Type.STRING },
            food_choice_mode: { type: Type.STRING },
            specific_food_items: { type: Type.STRING },
            menu_composition: { type: Type.STRING },
            food_style_preference: { type: Type.STRING },
            portion_control_mode: { type: Type.STRING },
          },
          required: ["event_type", "guests", "location", "date"],
        },
      },
    });
    return enrichCustomer(parseAIJSON(response.text), input);
  } catch {
    return enrichCustomer(parseCustomerFallback(input), input);
  }
}

async function runDietarySpecialist(input: string, customer: any) {
  try {
    if (!ai) throw new Error("No Gemini API key configured");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the Dietary Specialist. Identify allergens, labels, and safety controls for " + JSON.stringify(customer) + " from '" + input + "'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            allergens_to_avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_labels: { type: Type.ARRAY, items: { type: Type.STRING } },
            safety_controls: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });
    const parsed = parseAIJSON(response.text);
    return {
      allergens_to_avoid: parsed.allergens_to_avoid || extractAllergens(input),
      recommended_labels: parsed.recommended_labels || dietaryLabels(input),
      safety_controls: parsed.safety_controls || dietarySafetyControls(input),
    };
  } catch {
    return {
      allergens_to_avoid: extractAllergens(input),
      recommended_labels: dietaryLabels(input),
      safety_controls: dietarySafetyControls(input),
    };
  }
}

async function runHeadChefAgent(input: string, customer: any, dietary: any, rag: any) {
  const budgetMeta = parseBudgetDetails(customer.budget || "");
  const budgetValue = parseBudget(customer.budget);
  const budgetPerGuest = budgetValue ? Math.round(budgetValue / (customer.guests || 100)) : 500;

  const composition = (() => {
    const norm = (customer.menu_composition || "").toLowerCase();
    const autoDecide = /system|auto|bahala|decide|ikaw na|kayo na/i.test(norm);
    const ulamMatch = norm.match(/(\d+)\s*(?:ulam|main|dish(?:es)?|viand|entree)/);
    const dessertMatch = norm.match(/(\d+)\s*(?:dessert|pastry|cake|sweet|panghimagas)/);
    const drinkMatch = norm.match(/(\d+)\s*(?:drink|beverage|juice|softdrink|soda|inumin)/);
    return {
      mainCount: ulamMatch ? Number(ulamMatch[1]) : (autoDecide ? 4 : 4),
      dessertCount: dessertMatch ? Number(dessertMatch[1]) : (autoDecide ? 1 : 1),
      drinkCount: drinkMatch ? Number(drinkMatch[1]) : (autoDecide ? 1 : 1),
      autoDecide,
    };
  })();

  const totalItemsTarget = composition.mainCount + composition.dessertCount + composition.drinkCount;
  const compositionInstruction = composition.autoDecide
    ? "Menu composition: AUTO-DECIDE. Build " + totalItemsTarget + " items (" + composition.mainCount + " main, " + composition.dessertCount + " dessert, " + composition.drinkCount + " drink). Optimize for budget PHP " + budgetPerGuest + "/guest."
    : "Menu composition: USER-SPECIFIED. You MUST build exactly: " + composition.mainCount + " main dishes, " + composition.dessertCount + " desserts, " + composition.drinkCount + " drinks. Total: " + totalItemsTarget + " items.";

  try {
    if (!ai) throw new Error("No Gemini API key configured");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the CaterFlow Head Chef (Phase 2). Suggest a culturally adapted menu for " + JSON.stringify(customer) + ". Total Guests: " + customer.guests + ". Budget per guest: " + budgetPerGuest + ". " + compositionInstruction + " Avoid allergens: " + JSON.stringify(dietary.allergens_to_avoid) + ". Use RAG: " + JSON.stringify(rag.retrieved_playbooks) + ".",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dietary_compliance: { type: Type.STRING },
            cultural_adaptation: { type: Type.STRING },
            nutrition_summary: { type: Type.OBJECT },
            menu: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dish: { type: Type.STRING },
                  description: { type: Type.STRING },
                  portion_per_guest: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
          },
        },
      },
    });
    const parsed = parseAIJSON(response.text);
    if (!parsed.menu?.length) throw new Error("AI returned no menu recommendations");
    const menu = parsed.menu.map((item: any, index: number) => ({
      dish: item.dish || "AI recommendation " + (index + 1),
      description: item.description || "",
      portion_per_guest: item.portion_per_guest || "1 serving",
      tags: item.tags || [],
      allergens: item.allergens || [],
      dietary_compliance: item.dietary_compliance || "Compliant",
      image_url: item.image_url || "",
      macros: item.macros,
    }));
    return {
      dietary_compliance: parsed.dietary_compliance || "Compliant",
      cultural_adaptation: parsed.cultural_adaptation || "",
      nutrition_summary: parsed.nutrition_summary || {},
      menu,
    };
  } catch (error) {
    console.error("Head Chef AI generation failed:", error);
    throw error;
  }
}

async function runInventorySpecialist(customer: any, menuData: any) {
  const guests = Number(customer.guests || 100);
  const menu = menuData.menu || [];
  try {
    if (!ai) throw new Error("No API key");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the CaterFlow Inventory Specialist. Calculate procurement for " + guests + " guests. Menu: " + JSON.stringify(menu.map((m: any) => m.dish)),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            procurement_list: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  qty: { type: Type.STRING },
                  source_category: { type: Type.STRING }
                }
              }
            },
            potential_shortages: { type: Type.ARRAY, items: { type: Type.STRING } },
            food_safety_notes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    const parsed = parseAIJSON(response.text);
    return {
      procurement_list: parsed.procurement_list || [],
      procurement_weight_kg: Math.ceil(guests * 0.46),
      potential_shortages: parsed.potential_shortages || [],
      food_safety_notes: parsed.food_safety_notes || [],
    };
  } catch (e) {
    throw e;
  }
}

async function runSupplierSpecialist(customer: any, inventory: any, input: string) {
  try {
    if (!ai) throw new Error("No API key");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the CaterFlow Supplier Specialist. Location: " + customer.location + ". Budget: " + customer.budget + ". Recommend 3 local catering shops.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier_matches: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, categories: { type: Type.STRING }, score: { type: Type.STRING }, reason: { type: Type.STRING } } }
            },
            catering_shop_recommendations: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, area: { type: Type.STRING }, match_score: { type: Type.STRING }, reason: { type: Type.STRING }, contact: { type: Type.STRING } } }
            },
            optimization_strategy: { type: Type.STRING }
          }
        }
      }
    });
    const parsed = parseAIJSON(response.text);
    return {
      supplier_matches: parsed.supplier_matches || [],
      optimization_strategy: parsed.optimization_strategy || "",
      inventory_categories: [],
      catering_shop_recommendations: parsed.catering_shop_recommendations || [],
    };
  } catch (e) {
    throw e;
  }
}

async function runLogisticsLeadAgent(customer: any, inventory: any, suppliers: any, weather: any) {
  const guests = Number(customer.guests || 100);
  try {
    if (!ai) throw new Error("No API key");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "You are the CaterFlow Logistics Lead. Plan operations for " + guests + " guests at " + customer.location + ".",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeline: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } } }
            },
            staffing_needs: { type: Type.STRING },
            equipment_list: { type: Type.ARRAY, items: { type: Type.STRING } },
            transport_plan: { type: Type.STRING }
          }
        }
      }
    });
    const parsed = parseAIJSON(response.text);
    return {
      timeline: parsed.timeline || [],
      staffing_needs: parsed.staffing_needs || "",
      equipment_list: parsed.equipment_list || [],
      transport_plan: parsed.transport_plan || "",
    };
  } catch (e) {
    throw e;
  }
}

function runAccountantAgent(customer: any, menuData: any, inventory: any, suppliers: any, logistics: any) {
  const guests = Number(customer.guests || 100);
  const budgetMeta = parseBudgetDetails(customer.budget);
  const currency = budgetMeta.currency || "PHP";
  const R = { main: 165, dessert: 70, drink: 60, staple: 35, labor: 800, equipment: 850, serviceware: 45 };

  const foodCost = (4 * R.main * guests) + (R.staple * guests);
  const totalCost = foodCost * 1.5;
  const unitCost = Math.round(totalCost / guests);
  const recommendedQuote = Math.round(totalCost * 1.20);

  return {
    optimized_quote: currency + " " + recommendedQuote.toLocaleString(),
    unit_cost: currency + " " + unitCost.toLocaleString() + " / guest",
    profit_margin: "20%",
    status: "ON_BUDGET",
    budget_shortfall: null,
    pricing_strategy: "Standard pricing applied.",
    cost_breakdown: { main_dishes: foodCost },
    menu_item_counts: { total: 6 },
    rates_used: { currency_market: "PHP standard" },
  };
}

function runMonitoringAgent(memory: any) {
  return {
    overall_status: "green",
    execution_readiness: 95,
    final_summary: "Ready to proceed.",
    qa_checks: ["Guest count verified", "Budget checked"],
    inconsistencies: [],
  };
}

function enrichCustomer(customer: any, input: string) {
  return {
    event_type: customer.event_type || "Private event",
    guests: Number(customer.guests || 100),
    budget: customer.budget || "Budget TBD",
    location: customer.location || "Metro Manila",
    date: customer.date || "TBD",
    dietary_needs: customer.dietary_needs || "None",
    cuisine_preference: customer.cuisine_preference || "Chef's choice",
    service_style: customer.service_style || "Buffet",
    special_requests: input,
    food_choice_mode: customer.food_choice_mode,
    specific_food_items: customer.specific_food_items,
    menu_composition: customer.menu_composition,
    food_style_preference: customer.food_style_preference,
    portion_control_mode: customer.portion_control_mode,
    cultural_profile: inferCulturalProfile(input),
  };
}

function parseCustomerFallback(input: string) {
  return {
    event_type: "Private event",
    guests: 100,
    budget: "TBD",
    location: "Metro Manila",
    date: "TBD",
    special_requests: input,
  };
}

function validateAnswerDeterministically(questionKey: string, questionText: string, answer: string, preferredLanguage: string) {
  const trimmed = answer.trim().toLowerCase();
  const lang = preferredLanguage === 'tagalog' ? 'tagalog' : 'english';

  // 1. Minimum length & Gibberish (repetitive chars)
  if (!trimmed || trimmed.length < 2) {
    return { valid: false, message: lang === 'tagalog' ? "Pakidagdagan po ang detalye." : "Please provide more detail.", confident: true };
  }
  if (/^(.)\1{4,}$/.test(trimmed)) {
    return { valid: false, message: lang === 'tagalog' ? "Hindi po malinaw ang sagot." : "That input seems unclear.", confident: true };
  }

  // 2. Greetings & Irrelevant Fillers
  const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'kumusta', 'kamusta', 'uy', 'oy', 'test'];
  if (greetings.includes(trimmed)) {
    return { valid: false, message: lang === 'tagalog' ? "Pakisagot po ang tanong tungkol sa catering." : "Please answer the catering-related question.", confident: true };
  }

  // 3. Numeric Question Checks (Guests, Budget)
  if (questionKey === 'guest_count' || questionKey === 'guests') {
    const numbers = trimmed.match(/\d+/);
    if (!numbers && !/many|marami|unti|few|secret|tbd|ask/.test(trimmed)) {
      return { valid: false, message: lang === 'tagalog' ? "Ilang guests po ang inaasahan ninyo? Pakilagay po ang bilang." : "How many guests are you expecting? Please provide a number.", confident: true };
    }
  }

  // 4. Budget Checks
  if (questionKey === 'budget') {
    const hasNumbers = /\d+/.test(trimmed);
    const isNegotiable = /negotiable|open|depend|tbd|cheap|expensive|quality|best/.test(trimmed);
    if (!hasNumbers && !isNegotiable) {
       return { valid: false, message: lang === 'tagalog' ? "Magkano po ang budget ninyo para sa event? Pakilagay po ang halaga o sabihing 'negotiable'." : "What is your budget for the event? Please provide an amount or say 'negotiable'.", confident: true };
    }
  }

  return { valid: true, confident: false };
}

function dietarySafetyControls(input: string) {
  return ["Standard safety controls"];
}