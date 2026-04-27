import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function predictWeather(location: string, date: string) {
  try {
    const weatherPrompt = `Predict typical weather for ${location} on ${date}. Return summary, risk_level (low/medium/high), and recommendations (array of strings).`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: weatherPrompt,
      config: { 
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
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Weather prediction error:", error);
    return { summary: "Predictive analysis link unstable.", risk_level: "low", recommendations: ["Neural bypass active. Plan for standard conditions."] };
  }
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void) {
  try {
    // Step 1: Customer Extraction
    const customerPrompt = `Extract event requirements from: "${input}". Return details such as event_type, guests, budget, location, date, dietary_needs.`;
    const customerResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: customerPrompt,
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
            dietary_needs: { type: Type.STRING }
          },
          required: ["event_type", "guests", "location", "date"]
        }
      }
    });
    const customerData = JSON.parse(customerResponse.text || "{}");
    onStep({ agent: "Customer Interaction Agent", data: customerData });

    // Step 2 & 3: Research (Weather & Dietary)
    const researchPrompt = `For an event in ${customerData.location} on ${customerData.date} with dietary needs: ${customerData.dietary_needs}, research weather and dietary constraints. Use Google Search for the weather forecast.`;
    const researchResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: researchPrompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                risk_level: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            dietary: {
              type: Type.OBJECT,
              properties: {
                allergens_to_avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    const researchData = JSON.parse(researchResponse.text || '{"weather": {"summary":"Searching..."}, "dietary": {"allergens_to_avoid":[]}}');
    const weatherData = researchData.weather || { summary: "Weather intelligence scanning..." };
    const dietaryData = researchData.dietary || { allergens_to_avoid: [] };

    onStep({ agent: "Dietary & Allergens Agent", data: dietaryData });
    onStep({ agent: "Weather Intelligence Agent", data: weatherData });

    // Step 4: Menu
    const menuPrompt = `Suggest 5-6 item menu for ${JSON.stringify(customerData)} considering weather ${weatherData.summary}. Include image keywords for Unsplash as part of dish details if possible.`;
    const menuResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: menuPrompt,
      config: { 
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
                  portion_per_guest: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    const menuDataRaw = JSON.parse(menuResponse.text || '{"menu":[]}');
    const finalMenu = (menuDataRaw.menu || []).map((item: any, idx: number) => ({
      ...item,
      image_url: `https://images.unsplash.com/photo-${1504674900247 + idx}?auto=format&fit=crop&q=80&w=400&h=300`
    }));
    const menuData = { ...menuDataRaw, menu: finalMenu };
    onStep({ agent: "Menu Planning Agent", data: menuData });

    // Step 5-8: Operations
    const opsPrompt = `Plan inventory, logistics, pricing, and monitoring for this menu: ${JSON.stringify(menuData)} for ${customerData.guests} people.`;
    const opsResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: opsPrompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            inventory: { type: Type.OBJECT },
            logistics: { type: Type.OBJECT },
            pricing: { type: Type.OBJECT },
            monitoring: { type: Type.OBJECT }
          }
        }
      }
    });
    const opsData = JSON.parse(opsResponse.text || '{"inventory":{}, "logistics":{}, "pricing":{}, "monitoring":{}}');

    onStep({ agent: "Inventory & Procurement Agent", data: opsData.inventory });
    onStep({ agent: "Logistics Planning Agent", data: opsData.logistics });
    onStep({ agent: "Pricing & Optimization Agent", data: opsData.pricing });
    onStep({ agent: "Monitoring Agent", data: opsData.monitoring });

    return {
      success: true,
      data: {
        customer: customerData,
        dietary: dietaryData,
        menu: menuData,
        inventory: opsData.inventory,
        weather: weatherData,
        logistics: opsData.logistics,
        pricing: opsData.pricing,
        monitoring: opsData.monitoring
      }
    };
  } catch (error) {
    console.error("Orchestration error:", error);
    throw error;
  }
}
