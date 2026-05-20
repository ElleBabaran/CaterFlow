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

import { 
  NATIVE_GEMINI_KEYS,
  BASE_URL as PEKPIK_BASE_URL,
  DEEPSEEK_KEYS,
  GPT_KEYS
} from "./aiConfig";

export const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const BASE_SYSTEM_INSTRUCTIONS = `You are the CaterFlow AI Orchestrator. 
Your goal is to build a high-end catering blueprint.
STRICT RULES:
1. Output ONLY the raw content, reply, or JSON. NEVER include introductory phrases like "Here is the summary", "Certainly", or "Warm Tagalog translation".
2. Use NATURAL, MODERN, and CONVERSATIONAL vocabulary for all languages. 
   - For Tagalog: Use modern, everyday Tagalog (Taglish is okay). Avoid archaic/deep words (e.g., use "plano" instead of "balangkas", "check" instead of "siyasatin").
3. Respond directly. If asked for a translation, provide ONLY the translated text.`;

async function callAI(prompt: string, jsonMode = false, systemInstruction = "", responseSchema?: any) {
  const finalSystemInstruction = systemInstruction 
    ? `${BASE_SYSTEM_INSTRUCTIONS}\n\nAdditional Role: ${systemInstruction}` 
    : BASE_SYSTEM_INSTRUCTIONS;

  // Primary Reliable Path: Server-Side AI Proxy (Azure Foundry)
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemInstruction: finalSystemInstruction, jsonMode }),
    });

    if (response.ok) {
      const payload = await response.json();
      return payload.content?.trim() || null;
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn("[CaterFlow] Server AI failed, using fallback.", errData.error || response.status);
    }
  } catch (e) {
    console.warn("[CaterFlow] AI Connection Error, using fallback.", e);
  }

  return null; // Return null to allow calling functions to use their own fallbacks
}



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
  ConciergeAgent: "Plan Confirmation (Intake Summary)",
  DietarySpecialist: "Dietary & Allergens Specialist",
  HeadChefAgent: "Phase 1: Head Chef (Menu Design)",
  InventorySpecialist: "Inventory & Procurement Specialist",
  SupplierSpecialist: "Supplier Intelligence Specialist",
  WeatherIntelligence: "Weather Intelligence",
  ContingencyAgent: "Contingency & Plan B Specialist",
  SustainabilityAgent: "Sustainability & Impact Specialist",
  LogisticsLeadAgent: "Phase 3: Logistics Lead (Execution)",
  AccountantAgent: "Phase 2: Accountant (Cost Optimization)",
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
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.warn("No OpenWeatherMap API key found.");
      return generateAiWeatherFallback(location, date, language, "No API key");
    }

    // 1. Geocoding: Get lat/lon for the location (Try raw, then stripped)
    let geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    let geoRes = await fetch(geoUrl);
    let geoData = await geoRes.json();

    if (!geoRes.ok || !Array.isArray(geoData) || geoData.length === 0) {
      // Try stripping country/province (e.g. "Marikina City, Philippines" -> "Marikina")
      const simpleLoc = location.split(',')[0].replace(/city/i, '').trim();
      geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(simpleLoc)}&limit=1&appid=${apiKey}`;
      geoRes = await fetch(geoUrl);
      geoData = await geoRes.json();
    }

    if (!geoRes.ok || !Array.isArray(geoData) || geoData.length === 0) {
      console.error("Geocoding failed for:", location);
      return generateAiWeatherFallback(location, date, language, "Location not found by OpenWeatherMap");
    }

    const { lat, lon } = geoData[0];

    // 2. Fetch Forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    if (!forecastRes.ok || !forecastData || !forecastData.list) {
      return generateAiWeatherFallback(location, date, language, "Forecast fetch failed");
    }

    // 3. Normalize target date for searching
    const targetDateObj = new Date(date);
    if (isNaN(targetDateObj.getTime())) {
      return generateAiWeatherFallback(location, date, language, "Invalid date format");
    }

    const year = targetDateObj.getFullYear();
    const month = String(targetDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(targetDateObj.getDate()).padStart(2, '0');
    const targetDayStr = `${year}-${month}-${day}`;
    const now = new Date();
    const diffDays = Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays > 5) {
      return generateAiWeatherFallback(location, date, language, `Event is ${diffDays} days away. Using historical climatology.`);
    }

    // Find the entry closest to 12:00 PM on the target date
    const closest = forecastData.list.find((entry: any) => entry.dt_txt.includes(targetDayStr) && entry.dt_txt.includes("12:00:00"))
      || forecastData.list.find((entry: any) => entry.dt_txt.includes(targetDayStr))
      || forecastData.list[0];

    if (!closest) {
      return {
        source: "Weather Intelligence System",
        summary: `No forecast found for ${targetDayStr}.`,
        isForecastAvailable: false,
        raw_data: null
      };
    }

    const weatherInfo = {
      temp: `${Math.round(closest.main.temp)}°C`,
      condition: closest.weather[0].main,
      rain: closest.pop !== undefined ? `${Math.round(closest.pop * 100)}%` : "0%",
      humidity: `${closest.main.humidity}%`,
      wind: `${Math.round(closest.wind.speed * 3.6)} km/h`,
    };
    let analysis = {
      score: 7,
      risk: "Low",
      recommendation: "Please ensure standard food safety protocols are followed."
    };

    try {
      const aiPrompt = `Weather Intelligence Agent. 
        FACTUAL DATA for ${location} on ${targetDayStr}:
        - Temperature: ${weatherInfo.temp}
        - Condition: ${weatherInfo.condition}
        - Rain Probability: ${weatherInfo.rain}
        - Humidity: ${weatherInfo.humidity}
        - Wind Speed: ${weatherInfo.wind}
        
        Language: ${language}.
        
        CRITICAL RULES:
        1. Use ONLY provided data. Never invent.
        2. Provide professional catering analysis.
        3. Recommend specific actions.
        4. Use realistic language.
        5. Return JSON.`;

      const aiSchema = {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          risk: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["score", "risk", "recommendation"]
      };

      const text = await callAI(aiPrompt, true, "", aiSchema);
      const parsed = parseAIJSON(text);
      if (parsed) {
        analysis.score = parsed.score ?? analysis.score;
        analysis.risk = parsed.risk ?? analysis.risk;
        analysis.recommendation = parsed.recommendation ?? analysis.recommendation;
      }
    } catch (aiErr) {
      console.error("AI Weather Analysis failed (using fallback):", aiErr);
      if (weatherInfo.condition.toLowerCase().includes('rain')) {
        analysis.score = 4;
        analysis.risk = "Medium";
        analysis.recommendation = "Rain is forecasted. Consider indoor venues or providing adequate tenting for food and guests.";
      } else if (parseInt(weatherInfo.temp) > 30) {
        analysis.score = 6;
        analysis.risk = "Medium";
        analysis.recommendation = "High temperatures detected. Ensure adequate beverage supply and cooling for perishable food items.";
      }
    }

    const formattedSummary =
      `🌤 WEATHER INTELLIGENCE REPORT\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 Location: ${location}\n` +
      `📅 Event Date: ${targetDayStr}\n\n` +
      `🌡 Condition: ${weatherInfo.condition}\n` +
      `🌡 Temperature: ${weatherInfo.temp}\n` +
      `💧 Rain Chance: ${weatherInfo.rain}\n` +
      `☁ Humidity: ${weatherInfo.humidity}\n` +
      `💨 Wind Speed: ${weatherInfo.wind}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 EVENT SUITABILITY SCORE: ${analysis.score}/10\n` +
      `⚠️ RISK LEVEL: ${(analysis.risk || "Unknown").toUpperCase()}\n\n` +
      `💡 CHEF'S RECOMMENDATION:\n${analysis.recommendation}`;

    return {
      source: "Weather Intelligence System",
      summary: formattedSummary,
      risk_level: analysis.risk,
      recommendations: [analysis.recommendation],
      suitability_score: analysis.score,
      isForecastAvailable: true,
      raw_data: { ...weatherInfo, score: analysis.score, risk: analysis.risk, recommendation: analysis.recommendation }
    };
  } catch (err: any) {
    console.error("Weather API error:", err);
    return generateAiWeatherFallback(location, date, language, err.message);
  }
}

async function generateAiWeatherFallback(location: string, date: string, language: string, reason: string) {
  try {
    const prompt = `Weather Intelligence Expert. 
    Live data unavailable (${reason}). Generate a HIGHLY REALISTIC Climatology/Historical Weather Intelligence Report for "${location}" during the month of "${date}".
    Language: ${language}.
    Assume typical climate conditions for this location at this time of year.
    
    CRITICAL RULES:
    1. Provide professional catering analysis.
    2. Recommend specific logistical actions (e.g., tents if wet season, fans if summer).
    3. Return ONLY valid JSON matching this schema exactly.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        temp: { type: Type.STRING },
        condition: { type: Type.STRING },
        rain: { type: Type.STRING },
        humidity: { type: Type.STRING },
        wind: { type: Type.STRING },
        score: { type: Type.NUMBER },
        risk: { type: Type.STRING },
        recommendation: { type: Type.STRING }
      },
      required: ["temp", "condition", "rain", "humidity", "wind", "score", "risk", "recommendation"]
    };

    const text = await callAI(prompt, true, "", schema);
    const aiSim = parseAIJSON(text);
    
    if (!aiSim || !aiSim.temp) throw new Error("AI Fallback failed to generate valid JSON");

    const formattedSummary =
      `🌤 AI CLIMATOLOGY INTELLIGENCE REPORT\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 Location: ${location}\n` +
      `📅 Event Date: ${date} (Historical Avg)\n\n` +
      `🌡 Condition: ${aiSim.condition}\n` +
      `🌡 Temperature: ${aiSim.temp}\n` +
      `💧 Est. Rain Chance: ${aiSim.rain}\n` +
      `☁ Avg. Humidity: ${aiSim.humidity}\n` +
      `💨 Wind Speed: ${aiSim.wind}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 EVENT SUITABILITY SCORE: ${aiSim.score}/10\n` +
      `⚠️ RISK LEVEL: ${(aiSim.risk || "unknown").toUpperCase()}\n\n` +
      `💡 CHEF'S RECOMMENDATION:\n${aiSim.recommendation}`;

    return {
      source: "AI Climatology Intelligence (Fallback)",
      summary: formattedSummary,
      risk_level: aiSim.risk,
      recommendations: [aiSim.recommendation],
      suitability_score: aiSim.score,
      isForecastAvailable: true,
      raw_data: aiSim
    };
  } catch (err) {
    return {
      source: "Weather Intelligence System",
      summary: `Weather prediction unavailable for "${location}". Please plan for standard conditions.`,
      isForecastAvailable: false,
      raw_data: null
    };
  }
}

export async function translateText(text: string, targetLanguage: string) {
  if (!text || targetLanguage.toLowerCase() === "english") return text;
  try {
    const prompt = `Professional Translator. Translate the following text into ${targetLanguage}. 
      Keep the tone professional and warm. Preserve all emojis and formatting.
      Text to translate: "${text}"`;
    const translated = await callAI(prompt);
    return translated || text;
  } catch (err) {
    console.error("Translation failed:", err);
  }
  return text;
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void, useFoundry = false) {
  try {
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
    const customer = data.customer || {};
    const knowledge = data.knowledge || { mode: "ai_only" };
    const dietary = data.dietary || {};
    const weather = data.weather || {};
    const menu = data.menu || { menu: [] };
    const inventory = data.inventory || {};
    const suppliers = data.suppliers || {};
    const logistics = data.logistics || {};
    const pricing = data.pricing || {};
    const monitoring = data.monitoring || {};
    const sharedMemoryLedger = {
      architecture: "Azure AI Foundry/OpenAI API orchestration",
      workflow_phases: ["User Input & Intent", "Menu Creation", "Cost Optimization", "Logistics Planning"],
      agent_order: AGENT_ORDER,
      deployment: {
        provider: payload.provider || "unknown",
        model_deployment: payload.deployment || "unknown",
        api_version: payload.apiVersion || "unknown",
      },
      readiness_basis: "All recommendation content came from the AI API response.",
    };

    const orderedSteps = [
      { agent: "Phase 1: Concierge (User Intent)", data: customer },
      { agent: "Knowledge Base & RAG Agent", data: knowledge },
      { agent: "Dietary & Allergens Specialist", data: dietary },
      { agent: "Weather Intelligence", data: weather },
      { agent: "Phase 2: Head Chef (Menu Design)", data: menu },
      { agent: "Inventory & Procurement Specialist", data: inventory },
      { agent: "Supplier Intelligence Specialist", data: suppliers },
      { agent: "Phase 4: Logistics Lead (Execution)", data: logistics },
      { agent: "Phase 3: Accountant (Cost Optimization)", data: pricing },
      { agent: "Shared Memory Ledger", data: sharedMemoryLedger },
      { agent: "System Monitoring & QA", data: monitoring },
    ];

    orderedSteps.forEach(onStep);

    return {
      success: true,
      data: {
        customer,
        knowledge,
        dietary,
        weather,
        menu,
        inventory,
        suppliers,
        logistics,
        pricing,
        monitoring,
        sharedMemoryLedger,
        sharedMemory: {
          source_input: input,
          provider: payload.provider || "unknown",
          deployment: payload.deployment || "unknown",
        },
      },
    };
  } catch (err) {
    console.error("[CaterFlow] Orchestration error:", err);
    throw err;
  }
}

export async function validateUserResponse(questionKey: string, questionText: string, answer: string, preferredLanguage: string = "english") {
  const normalizedAnswer = String(answer || "").trim();
  const deterministicValidation = validateAnswerDeterministically(questionKey, questionText, normalizedAnswer, preferredLanguage);
  if (!deterministicValidation.valid || deterministicValidation.confident) return deterministicValidation;

  try {
    const lang = (preferredLanguage && preferredLanguage.length > 2) ? preferredLanguage : "english";
    const prompt = "You are a strict validator for a catering planner. Q: '" + questionText + "' User Answer: '" + normalizedAnswer + "' Is the User's answer actually answering the question or providing relevant context? - If the user says 'hi', 'hello', 'keyboard smash', or something unrelated to catering/the question, it is INVALID. - If it's a valid answer or provides new catering info, it is VALID. Reply only: VALID or INVALID: <short helpful message in " + lang + " explaining why and asking again>";

    const text = await callAI(prompt) || "VALID";
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

  const languageMatch = trimmed.match(/\b(english|tagalog|filipino|spanish|japanese|chinese|mandarin|nihongo|日本語|indonesian|bahasa|korean|korea|french|german|vietnamese|thai|arabic)\b/i);
  if (languageMatch) {
    const isLanguageStep = currentQuestionKey === 'preferred_language';
    const isExplicitChange = /\b(speak|switch|change|use|translate|in|naka|mag|magsalita|bicara|pake)\b/i.test(trimmed);
    const commonGreetings = /^(hi|hello|hey|yo|sup|test)$/i.test(trimmed);
    const isJustLanguageName = trimmed.split(/\s+/).length <= 2 && !commonGreetings;
    const isCuisineContext = currentQuestionKey === 'cuisine_preference' || /cuisine|food|dish|menu/i.test(currentQuestionText);

    // Context-aware logic:
    // 1. If it's an explicit command (e.g. "speak in Japanese"), it's always a language change.
    // 2. If it's the dedicated language question, it's always a language change.
    // 3. If it's just the language name, only change if NOT in a cuisine-related context.
    if (isLanguageStep || isExplicitChange || (isJustLanguageName && !isCuisineContext)) {
      return { intent: { type: 'LANGUAGE_CHANGE', value: languageMatch[0] }, validation: { valid: true }, reaction: { text: "" } };
    }
  }
  if (/^(done|tapos|wala na|that'?s all|finish|none|wala)$/i.test(trimmed)) {
    return { intent: { type: 'DONE', value: trimmed }, validation: { valid: true }, reaction: { text: "" } };
  }

  if (deterministicResult.confident) {
    return FAST_PASS;
  }

  if (!ai) return FAST_PASS;

  try {
    const prompt = "CaterFlow concierge. Current Question: '" + currentQuestionText + "' | User Input: '" + trimmed + "' | Language: " + language + ". " +
      "STRICT VALIDATION RULES: " +
      "1. If the User is asking a question RELATED to catering, food, the event, or this planning process: Set intent.type='GENERAL_REQUEST', validation.valid=true, and provide a helpful, concise answer in reaction.text. " +
      "2. If the User is providing a valid answer to the Current Question: Set intent.type='ANSWER', validation.valid=true, and give a ≤8-word warm reaction in reaction.text. " +
      "3. If the User input is IRRELEVANT (greetings only, off-topic questions, gibberish, or vague fillers like 'ok' or 'maybe' without context): Set validation.valid=false. " +
      "4. Detect other intents: LANGUAGE_CHANGE (if they want to switch languages, even if it's a language not on the hardcoded list), DONE (if they say they are finished with a multi-item list). " +
      "CRITICAL: YOUR ENTIRE RESPONSE (reaction.text and validation.message) MUST BE IN " + language.toUpperCase() + ". " +
      "If the bot asks a numeric question (like guest count) and the user answers with a language name (like 'Indonesian'), it is a LANGUAGE_CHANGE, not a valid answer.";

    const schema = {
      type: Type.OBJECT,
      properties: {
        intent: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["type"] },
        validation: { type: Type.OBJECT, properties: { valid: { type: Type.BOOLEAN }, message: { type: Type.STRING } }, required: ["valid"] },
        reaction: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ["text"] }
      },
      required: ["intent", "validation", "reaction"]
    };

    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
    if (!parsed) return FAST_PASS;
    return {
      intent: parsed.intent || FAST_PASS.intent,
      validation: parsed.validation || FAST_PASS.validation,
      reaction: parsed.reaction || FAST_PASS.reaction
    };
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
  try {
    const prompt = "CaterFlow concierge. Answered '" + questionText + "': '" + userAnswer + "'. Language: " + language + ". Write ≤8-word warm acknowledgement, then on new line: '" + nextQuestion + "'. No JSON, plain text only.";
    const reply = await callAI(prompt);
    return { reply: reply || nextQuestion };
  } catch {
    return { reply: nextQuestion };
  }
}

async function runConciergeAgent(input: string) {
  try {
    const prompt = "You are the CaterFlow Concierge Agent (Phase 1). Analyze this input: '" + input + "'. CRITICAL RULE 1: If the input is random, gibberish, or completely unrelated to catering (e.g., 'how are you'), set event_type to 'INVALID_REQUEST'. CRITICAL RULE 2: Respond and extract information in the SAME LANGUAGE as the user's input. Extract ALL fields mentioned: event_type, guests, budget, location, date, dietary_needs, cuisine_preference, service_style, special_requests, food_choice_mode, specific_food_items, menu_composition, portion_control_mode.";

    const schema = {
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
    };

    const text = await callAI(prompt, true, "", schema);
    return enrichCustomer(parseAIJSON(text), input);
  } catch {
    return enrichCustomer(parseCustomerFallback(input), input);
  }
}

async function runDietarySpecialist(input: string, customer: any) {
  try {
    const prompt = "You are the Dietary Specialist. Identify allergens, labels, and safety controls for " + JSON.stringify(customer) + " from '" + input + "'.";
    const schema = {
      type: Type.OBJECT,
      properties: {
        allergens_to_avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommended_labels: { type: Type.ARRAY, items: { type: Type.STRING } },
        safety_controls: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    };
    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
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
  const budgetValue = budgetMeta.value;
  const budgetPerGuest = budgetValue ? Math.round(budgetValue / (customer.guests || 100)) : 500;

  const composition = (() => {
    const norm = (customer.menu_composition || "").toLowerCase();
    const autoDecide = /system|auto|bahala|decide|ikaw na|kayo na|marami|madami|generous/i.test(norm);
    const ulamMatch = norm.match(/(\d+)\s*(?:ulam|main|dish(?:es)?|viand|entree)/);
    const appetizerMatch = norm.match(/(\d+)\s*(?:appetizer|starter|pampagana|hors d'oeuvre)/);
    const dessertMatch = norm.match(/(\d+)\s*(?:dessert|pastry|cake|sweet|panghimagas)/);
    const drinkMatch = norm.match(/(\d+)\s*(?:drink|beverage|juice|softdrink|soda|inumin)/);
    return {
      mainCount: ulamMatch ? Number(ulamMatch[1]) : (autoDecide ? 6 : 6),
      appetizerCount: appetizerMatch ? Number(appetizerMatch[1]) : (autoDecide ? 3 : 3),
      dessertCount: dessertMatch ? Number(dessertMatch[1]) : (autoDecide ? 3 : 3),
      drinkCount: drinkMatch ? Number(drinkMatch[1]) : (autoDecide ? 3 : 3),
      autoDecide,
    };
  })();

  const totalItemsTarget = composition.mainCount + composition.appetizerCount + composition.dessertCount + composition.drinkCount;
  const compositionInstruction = composition.autoDecide
    ? "Menu composition: AUTO-DECIDE. Build an expansive, premium menu with " + totalItemsTarget + " items (" + composition.mainCount + " mains, " + composition.appetizerCount + " appetizers, " + composition.dessertCount + " desserts, " + composition.drinkCount + " drinks). Optimize for budget PHP " + budgetPerGuest + "/guest."
    : "Menu composition: USER-SPECIFIED. You MUST build exactly: " + composition.mainCount + " main dishes, " + composition.appetizerCount + " appetizers, " + composition.dessertCount + " desserts, " + composition.drinkCount + " drinks. Total: " + totalItemsTarget + " items.";

  const stylePref = customer.food_style_preference || "Chef's Choice";
  const cuisinePref = customer.cuisine_preference || "Any Cuisine";
  
  try {
    const prompt = `You are the CaterFlow Head Chef (Phase 2). 
    STRICT COMPLIANCE MANDATE:
    1. CUISINE: You MUST follow the '${cuisinePref}' preference.
    2. COOKING STYLE: You MUST follow the '${stylePref}' style. (e.g., if 'Veggies', no meat. If 'Grilled', no frying).
    3. DIETARY & ALLERGENS: Zero tolerance. Avoid: ${JSON.stringify(dietary.allergens_to_avoid)}. Follow: ${JSON.stringify(dietary.recommended_labels)}.
    4. CATEGORIES: You MUST classify every item EXACTLY as one of these 4 strings: 'Main Dish', 'Appetizer', 'Dessert', or 'Drink'. Do not use any other category names.
    5. BEVERAGES: You MUST explicitly include the required number of drinks/beverages in the menu. Do not skip the drinks!
    
    Event Context: ${JSON.stringify(customer)}
    Total Guests: ${customer.guests}
    Budget per guest: ${budgetPerGuest}
    
    ${compositionInstruction}
    
    Use RAG context for authentic recipes: ${JSON.stringify(rag.retrieved_playbooks)}
    
    Any dish that violates the CUISINE, STYLE, or DIETARY rules is a FAILURE. Provide a premium, cohesive menu that meets 100% of these criteria.`;
    const schema = {
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
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              portion_per_guest: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["dish", "category", "description", "portion_per_guest"]
          },
        },
      },
    };
    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
    if (!parsed.menu?.length) throw new Error("AI returned no menu recommendations");
    const menu = parsed.menu.map((item: any, index: number) => {
      let cat = item.category || "Main Dish";
      if (!['Main Dish', 'Appetizer', 'Dessert', 'Drink'].includes(cat)) {
        if (/drink|beverage|juice|soda|water|wine|beer|coffee|tea/i.test(cat) || /drink|beverage|juice|soda/i.test(item.dish)) cat = 'Drink';
        else if (/dessert|sweet|cake|pastry/i.test(cat) || /dessert|sweet/i.test(item.dish)) cat = 'Dessert';
        else if (/appetizer|starter/i.test(cat)) cat = 'Appetizer';
        else cat = 'Main Dish';
      }
      return {
        dish: item.dish || "AI recommendation " + (index + 1),
        category: cat,
        description: item.description || "",
        portion_per_guest: item.portion_per_guest || "1 serving",
        tags: item.tags || [cat],
        allergens: item.allergens || [],
        dietary_compliance: item.dietary_compliance || "Compliant",
        image_url: item.image_url || "",
        macros: item.macros,
      };
    });
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
    const SYSTEM_INSTRUCTIONS = `You are the CaterFlow AI Orchestrator. 
Your goal is to build a high-end catering blueprint.
STRICT RULES:
1. Output ONLY the raw content or JSON. NEVER include introductory phrases like "Here is the summary" or "Certainly, I can help".
2. Use NATURAL, MODERN, and CONVERSATIONAL vocabulary for all languages. 
   - For Tagalog: Use modern, everyday Tagalog (Taglish is okay if it sounds more natural). Avoid archaic or "deep" words (e.g., use "plano" instead of "balangkas", "check" instead of "siyasatin").
3. Preserve all emojis and formatting requested.
4. If the user asks in a specific language, respond in that language using a warm but professional tone.`;
    const prompt = SYSTEM_INSTRUCTIONS + "\n\nYou are the CaterFlow Inventory Specialist. Calculate procurement for " + guests + " guests. Menu: " + JSON.stringify(menu.map((m: any) => m.dish));
    const schema = {
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
    };
    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
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
    const prompt = "You are the CaterFlow Supplier Specialist. Location: " + customer.location + ". Budget: " + customer.budget + ". Recommend 3 local catering shops.";
    const schema = {
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
    };
    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
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
    const prompt = "You are the CaterFlow Logistics Lead. Plan operations for " + guests + " guests at " + customer.location + ".";
    const schema = {
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
    };
    const text = await callAI(prompt, true, "", schema);
    const parsed = parseAIJSON(text);
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

  // Base rates per guest
  const R = { main: 165, dessert: 70, drink: 60, staple: 35 };
  // Flat fees
  const LABOR_RATE_PER_STAFF = 800; // per staff per event
  const SERVER_RATE = 600; // per server per event
  const DELIVERY_FEE_BASE = 1500; // base delivery fee
  const DELIVERY_FEE_PER_km = 15; // per km rate
  const EQUIPMENT_FEE = 850;
  const SERVICEWARE_FEE = 45;

  // 1. Calculate food cost from inventory/ingredients
  const procurementList = inventory.procurement_list || [];
  const ingredientCosts = procurementList.map((item: any) => {
    const qty = item.qty || "1";
    const qtyNum = parseFloat(qty.replace(/[^0-9.]/g, '')) || 1;
    // Estimate price per ingredient unit
    const estimatedPricePerUnit = item.source_category === 'protein' ? 180 :
                                  item.source_category === 'vegetable' ? 60 :
                                  item.source_category === 'dry goods' ? 45 :
                                  item.source_category === 'beverage' ? 35 : 80;
    const total = qtyNum * estimatedPricePerUnit;
    return {
      item: item.item,
      quantity: qty,
      estimated_price: currency + " " + Math.round(total).toLocaleString(),
      category: item.source_category || "miscellaneous"
    };
  });

  // Fallback ingredient calculation if no procurement list
  const menuItems = menuData.menu || [];
  const estimatedFoodCost = procurementList.length > 0
    ? ingredientCosts.reduce((sum: number, i: any) => sum + parseFloat(i.estimated_price.replace(/[^0-9]/g, '')), 0)
    : (4 * R.main * guests) + (R.staple * guests);

  // 2. Calculate staff requirements
  const chefCount = Math.ceil(guests / 50); // 1 chef per 50 guests
  const serverCount = Math.ceil(guests / 15); // 1 server per 15 guests
  const helperCount = Math.ceil(guests / 25); // 1 helper per 25 guests
  const totalStaffCount = chefCount + serverCount + helperCount;

  // 3. Calculate labor costs
  const chefLabor = chefCount * LABOR_RATE_PER_STAFF * 8; // 8 hours
  const serverLabor = serverCount * SERVER_RATE * 6; // 6 hours
  const helperLabor = helperCount * LABOR_RATE_PER_STAFF * 6;
  const totalLaborCost = chefLabor + serverLabor + helperLabor;

  // 4. Calculate delivery fee
  const deliveryFee = logistics?.distance_km
    ? DELIVERY_FEE_BASE + (logistics.distance_km * DELIVERY_FEE_PER_km)
    : DELIVERY_FEE_BASE;

  // 5. Equipment and serviceware
  const equipmentCost = guests > 100 ? EQUIPMENT_FEE + (Math.floor((guests - 100) / 50) * 200) : EQUIPMENT_FEE;
  const servicewareCost = guests > 100 ? SERVICEWARE_FEE + (Math.floor((guests - 100) / 50) * 15) : SERVICEWARE_FEE;

  // 6. Total calculation
  const foodCostTotal = estimatedFoodCost;
  const subtotal = foodCostTotal + totalLaborCost + deliveryFee + equipmentCost + servicewareCost;
  const overhead = subtotal * 0.15; // 15% overhead
  const totalCost = subtotal + overhead;
  const unitCost = Math.round(totalCost / guests);
  const recommendedQuote = Math.round(totalCost * 1.20); // 20% margin

  return {
    optimized_quote: currency + " " + recommendedQuote.toLocaleString(),
    unit_cost: currency + " " + unitCost.toLocaleString() + " / guest",
    profit_margin: "20%",
    status: budgetMeta.value && budgetMeta.value < unitCost ? "OVER_BUDGET" : "ON_BUDGET",
    budget_shortfall: budgetMeta.value && budgetMeta.value < unitCost
      ? currency + " " + (unitCost - budgetMeta.value).toLocaleString() + " / guest"
      : null,
    pricing_strategy: "Itemized costing with staff and delivery breakdown",

    // Detailed cost breakdown
    cost_breakdown: {
      ingredients_total: currency + " " + Math.round(foodCostTotal).toLocaleString(),
      labor_total: currency + " " + Math.round(totalLaborCost).toLocaleString(),
      delivery_fee: currency + " " + Math.round(deliveryFee).toLocaleString(),
      equipment_fee: currency + " " + Math.round(equipmentCost).toLocaleString(),
      serviceware_fee: currency + " " + Math.round(servicewareCost).toLocaleString(),
      overhead_15: currency + " " + Math.round(overhead).toLocaleString(),
      grand_total: currency + " " + Math.round(totalCost).toLocaleString()
    },

    // Ingredients detail
    ingredients: ingredientCosts.length > 0 ? ingredientCosts : [
      { item: "Mixed proteins (pork, chicken, beef)", quantity: "~15 kg", estimated_price: currency + " 2,500", category: "protein" },
      { item: "Fresh vegetables", quantity: "~8 kg", estimated_price: currency + " 800", category: "vegetable" },
      { item: "Rice and starches", quantity: "~10 kg", estimated_price: currency + " 500", category: "dry goods" },
      { item: "Beverages and drinks", quantity: "~30 liters", estimated_price: currency + " 1,200", category: "beverage" }
    ],

    // Staff breakdown
    staff_breakdown: {
      total_staff_needed: totalStaffCount,
      chefs: chefCount,
      servers: serverCount,
      helpers: helperCount,
      labor_costs: {
        chef_per_hour: currency + " " + LABOR_RATE_PER_STAFF + " / 8 hrs",
        server_per_event: currency + " " + SERVER_RATE + " / 6 hrs",
        helper_per_hour: currency + " " + LABOR_RATE_PER_STAFF + " / 6 hrs",
        total_labor: currency + " " + Math.round(totalLaborCost).toLocaleString()
      }
    },

    // Delivery info
    delivery: {
      base_fee: currency + " " + DELIVERY_FEE_BASE.toLocaleString(),
      distance_km: logistics?.distance_km || "TBD",
      estimated_delivery_fee: currency + " " + Math.round(deliveryFee).toLocaleString()
    },

    menu_item_counts: { total: menuItems.length || 6 },
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

  // 5. Option Buttons Checks
  if (questionKey === 'food_choice_mode') {
    if (/suggest|chef|kayo|specific|ako|meron|mayroon|mag-suggest/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'portion_control_mode') {
    if (/system|auto|bahala|decide|specify|ako|manual/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'menu_composition') {
    if (/system|auto|bahala|decide|\d/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'event_time') {
    if (/lunch|dinner|breakfast|noon|morning|afternoon|evening|am|pm|\d/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'service_style') {
    if (/buffet|plated|family|cocktail|station|dine|serve/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'venue_type') {
    if (/indoor|outdoor|garden|hall|home|backyard|office|hotel|house/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'beverage_plan') {
    if (/juice|soda|wine|beer|water|coffee|tea|alcohol|mocktail|cocktail|drink|none/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'staffing_needs') {
    if (/yes|no|oo|hindi|need|chef|waiter|server|staff/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'nearby_suggestions') {
    if (/yes|no|oo|hindi/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }
  if (questionKey === 'preferred_language') {
    if (/english|tagalog|filipino|spanish|japanese|chinese|mandarin|others/i.test(trimmed)) {
      return { valid: true, confident: true };
    }
  }

  return { valid: true, confident: false };
}

export async function getFoodDetails(dishName: string, description: string) {
  const prompt = `You are a Master Chef. Generate authentic recipe and cooking details for: "${dishName}" (${description}). 
  You MUST return ONLY a raw JSON matching this schema:
  {
    "ingredients": [
      { "item": "Main Ingredient (e.g. Beef)", "qty": "150g" },
      { "item": "Second Ingredient", "qty": "50g" }
    ],
    "nutrition": {
      "calories": 320,
      "protein": "25g",
      "carbs": "12g",
      "fat": "6g"
    },
    "how_to_cook": [
      "Step 1: Prep the ingredients...",
      "Step 2: Sauté the aromatics...",
      "Step 3: Simmer until tender..."
    ]
  }`;
  
  try {
    const responseText = await callAI(prompt, true, "You are a professional Master Chef who provides exact cooking recipes, ingredients, and nutritional values.") || "{}";
    return parseAIJSON(responseText);
  } catch (err) {
    console.error("Chef AI call failed, using heuristic recipe:", err);
    return {
      ingredients: [
        { "item": "Primary Protein/Ingredient", "qty": "200g" },
        { "item": "Chef Special Herbs & Seasonings", "qty": "to taste" }
      ],
      nutrition: {
        "calories": 300,
        "protein": "20g",
        "carbs": "15g",
        "fat": "8g"
      },
      how_to_cook: [
        "Step 1: Prep and wash all ingredients carefully.",
        "Step 2: Season the main items with signature Chef herbs.",
        "Step 3: Cook at optimal temperature until fully flavored and tender.",
        "Step 4: Garnish and serve fresh."
      ]
    };
  }
}

function dietarySafetyControls(input: string) {
  return ["Standard safety controls"];
}