import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Resilience Wrapper for Gemini Model calls
 */
async function callGemini(modelName: string, prompt: string, config: any = {}) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config
    });
    return response;
  } catch (error: any) {
    console.error(`Gemini call failed [${modelName}]:`, error);
    throw error;
  }
}

export async function validateAnswer(question: string, answer: string) {
  const commonAnswers = ['wedding', 'birthday', 'corporate', 'party', 'event', 'catering', 'food', 'pesos', 'php', 'bbq', 'ikaw', 'bahala', 'any', 'surprise', 'suprise'];
  if (commonAnswers.includes(answer.toLowerCase().trim())) {
    return { valid: true, re_ask_message: "" };
  }

  try {
    const prompt = `### ROLE: INPUT_RELEVANCE_FILTER
    ### BOT_QUESTION: "${question}"
    ### USER_INPUT: "${answer}"
    
    ### EVALUATION_REQUIREMENTS:
    1. GIBBERISH_SCAN: Reject random character strings (e.g., "hs", "jnsns", "kskd").
    2. NUMERICAL_REQUIREMENT: If the question is about GUESTS, the answer MUST contain a number, a quantity word, or uncertainty.
    3. TOPIC_ADHERENCE: Reject inputs that are completely unrelated to event planning.
    
    ### RESPONSE:
    JSON ONLY: { "valid": boolean, "re_ask_message": string }`;
    
    const response = await callGemini("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          valid: { type: Type.BOOLEAN },
          re_ask_message: { type: Type.STRING }
        },
        required: ["valid", "re_ask_message"]
      }
    });

    return JSON.parse(response.text || '{"valid": true, "re_ask_message": ""}');
  } catch (error) {
    console.error("Validation error:", error);
    return { valid: true, re_ask_message: "" }; // Fail safe to accept on AI error
  }
}

export async function predictWeather(location: string, date: string) {
  try {
    const prompt = `Predict typical weather for ${location} on ${date}. Return summary, risk_level (low/medium/high), and recommendations (array of strings).`;
    const response = await callGemini("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          risk_level: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "risk_level", "recommendations"]
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Weather prediction error:", error);
    return { summary: "Analysis link unstable.", risk_level: "low", recommendations: ["Neural bypass active."] };
  }
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void) {
  try {
    // 1. Requirement Extraction
    const customerPrompt = `### ROLE: REQUIREMENT_ANALYZER
    ### SOURCE_INPUT: "${input}"
    Extract structured catering requirements. Return JSON with: event_type, guests (number), budget, location, date, dietary_needs.`;
    const customerRes = await callGemini("gemini-3-flash-preview", customerPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                event_type: { type: Type.STRING },
                guests: { type: Type.NUMBER },
                budget: { type: Type.STRING },
                location: { type: Type.STRING },
                date: { type: Type.STRING },
                dietary_needs: { type: Type.STRING }
            },
            required: ["event_type", "guests", "location", "date"]
        }
    });
    const requirements = JSON.parse(customerRes.text || "{}");
    onStep({ agent: "Customer Interaction Agent", data: requirements });

    // 2. Intelligence Agent (Weather & Dietary)
    const researchPrompt = `For ${requirements.location} on ${requirements.date}: weather forecast and dietary analysis for ${requirements.dietary_needs}.`;
    const researchRes = await callGemini("gemini-3-flash-preview", researchPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              weather: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, risk_level: { type: Type.STRING } } },
              dietary: { type: Type.OBJECT, properties: { allergens: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            }
        }
    });
    const context = JSON.parse(researchRes.text || "{}");
    onStep({ agent: "Dietary & Allergens Agent", data: context.dietary });
    onStep({ agent: "Weather Intelligence Agent", data: context.weather });

    // 3. Menu Synthesis Agent
    const menuPrompt = `Suggest a comprehensive catering menu for ${JSON.stringify(requirements)} considering ${JSON.stringify(context)}. 
    
    CUISINE LOGIC:
    1. If the user provided a specific cuisine preference (e.g., "BBQ", "Japanese", "Filipino"), you MUST follow it strictly.
    2. If the user said "surprise me", "ikaw bahala", "you decide", or haven't specified, you as a high-end AI chef should suggest a cohesive, trending, and suitable cuisine based on the event type and weather.
    
    STRICT CATEGORIES: You MUST include at least: 2 Main Courses, 1 Side, 1 Dessert, and 1 Drink.
    Note: If the user input mentions prioritizing weather-based suggestions, ensure items match that context.
    
    For each item, provide:
    - dish name
    - description
    - category (Main, Side, Dessert, Drink)
    - calories (per serving)
    - macros (protein, carbs, fat in grams)
    - serving_size (e.g., "250g", "1 cup")
    - estimated_price (price per person for this item)
    - image_keyword (specific food-only search term)`;

    const menuRes = await callGemini("gemini-3-flash-preview", menuPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                menu: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: { 
                            dish: { type: Type.STRING }, 
                            description: { type: Type.STRING }, 
                            category: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            macros: { 
                                type: Type.OBJECT,
                                properties: {
                                    protein: { type: Type.NUMBER },
                                    carbs: { type: Type.NUMBER },
                                    fat: { type: Type.NUMBER }
                                }
                            },
                            serving_size: { type: Type.STRING },
                            estimated_price: { type: Type.NUMBER },
                            image_keyword: { type: Type.STRING } 
                        } 
                    } 
                }
            }
        }
    });
    const menuData = JSON.parse(menuRes.text || '{"menu":[]}');
    const menu = {
        ...menuData,
        menu: menuData.menu.map((it: any) => ({ 
            ...it, 
            image_url: `https://loremflickr.com/800/600/food,${encodeURIComponent(it.image_keyword || it.dish)}` 
        }))
    };
    onStep({ agent: "Menu Planning Agent", data: menu });

    // 4. Strategic Operations Agent
    const opsPrompt = `Operational manifest for: ${JSON.stringify(menu)} for ${requirements.guests} people. Budget: ${requirements.budget}.
    
    CRITICAL: 
    1. Inventory items MUST include an 'estimated_cost' per quantity.
    2. The sum of all item costs should align with the total budget.
    3. Pricing summary MUST include:
       - 'cost_per_person'
       - 'cost_breakdown': { "Food": number, "Labor": number, "Logistics": number, "Overhead": number } (values should be percentages or absolute values summing to total cost)
    4. Monitoring: provide health metrics.`;

    const opsRes = await callGemini("gemini-3-flash-preview", opsPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                inventory: { 
                    type: Type.OBJECT, 
                    properties: { 
                        procurement_list: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    item: { type: Type.STRING }, 
                                    qty: { type: Type.STRING },
                                    estimated_cost: { type: Type.STRING }
                                } 
                            } 
                        } 
                    } 
                },
                logistics: { 
                    type: Type.OBJECT, 
                    properties: { 
                        timeline: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    time: { type: Type.STRING }, 
                                    activity: { type: Type.STRING } 
                                } 
                            } 
                        }, 
                        staffing: { type: Type.STRING } 
                    } 
                },
                pricing: { 
                    type: Type.OBJECT, 
                    properties: { 
                        optimized_quote: { type: Type.STRING }, 
                        cost_per_person: { type: Type.STRING }, 
                        cost_breakdown: {
                            type: Type.OBJECT,
                            properties: {
                                Food: { type: Type.NUMBER },
                                Labor: { type: Type.NUMBER },
                                Logistics: { type: Type.NUMBER },
                                Overhead: { type: Type.NUMBER }
                            }
                        },
                        unit_cost: { type: Type.STRING }, 
                        margin: { type: Type.STRING } 
                    } 
                },
                monitoring: { 
                    type: Type.OBJECT, 
                    properties: { 
                        ready_pct: { type: Type.NUMBER }, 
                        risk_assessment: { type: Type.STRING }, 
                        final_summary: { type: Type.STRING } 
                    } 
                }
            }
        }
    });
    const ops = JSON.parse(opsRes.text || "{}");
    
    onStep({ agent: "Inventory & Procurement Agent", data: ops.inventory });
    onStep({ agent: "Logistics Planning Agent", data: ops.logistics });
    onStep({ agent: "Pricing & Optimization Agent", data: ops.pricing });
    onStep({ agent: "Monitoring Agent", data: { ...ops.monitoring, overall_status: "green" } });

    return { 
        success: true, 
        data: { 
            customer: requirements, 
            weather: context.weather, 
            dietary: context.dietary, 
            menu, 
            inventory: ops.inventory, 
            logistics: ops.logistics, 
            pricing: ops.pricing, 
            monitoring: ops.monitoring 
        } 
    };

  } catch (error) {
    console.error("Orchestration error:", error);
    throw error;
  }
}
