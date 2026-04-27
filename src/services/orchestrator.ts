import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function predictWeather(location: string, date: string) {
  try {
    const weatherPrompt = `
      You are the Weather Agent.
      Location: ${location}, Date: ${date}.
      Use Google Search to find typical or forecasted weather for this location and date.
      Return ONLY a JSON object with: summary, risk_level (low/medium/high), recommendations (array of strings).
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: weatherPrompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Weather prediction error:", error);
    return { summary: "Weather data unavailable", risk_level: "low", recommendations: [] };
  }
}

export async function orchestrateCatering(input: string, onStep: (step: any) => void) {
  try {
    // Step 1: Customer Interaction Agent
    const customerPrompt = `
      You are the Customer Interaction Agent. 
      Extract event requirements from this input: "${input}".
      Look for: event_type, guests, budget, location (city/country), date, dietary_needs, cuisine_preference, dessert_preference, drink_preference, special_requests.
      
      CRITICAL: For 'budget', you MUST include the currency symbol or code (e.g., "$100", "5000 PHP", "3000 Pesos"). 
      If the user provides a number but you are unsure of the currency, set budget to "MISSING_CURRENCY".
      
      Return ONLY a JSON object with: event_type, guests, budget, location, date, dietary_needs, cuisine_preference, dessert_preference, drink_preference, special_requests.
    `;
    const customerResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: customerPrompt,
      config: { responseMimeType: "application/json" }
    });
    const customerData = JSON.parse(customerResponse.text || "{}");
    onStep({ agent: "Customer Interaction Agent", data: customerData });

    // Handle missing critical info
    if (customerData.budget === "MISSING_CURRENCY") {
      return {
        success: false,
        clarification_required: true,
        field: "budget_currency",
        message: "I've noted your budget, but could you please specify the currency (e.g., USD, PHP, EUR)?"
      };
    }

    // Step 2 & 3: Dietary & Weather Agents (Parallel)
    const [dietaryResponse, weatherResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Dietary Agent.
          User specified dietary needs: "${customerData.dietary_needs}".
          Identify specific allergens to avoid and recommended labels (e.g. Halal, Vegan, Gluten-Free).
          Return ONLY a JSON object with: allergens_to_avoid (array), recommended_labels (array).
        `,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Weather Agent.
          Location: ${customerData.location}, Date: ${customerData.date}.
          Use Google Search to find typical weather.
          IMPORTANT: End summary with: "With this info, we will decide what food should we suggest."
          Return ONLY a JSON object with: summary, risk_level (low/medium/high), recommendations (array of strings).
        `,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }] 
        }
      })
    ]);

    const dietaryData = JSON.parse(dietaryResponse.text || "{}");
    onStep({ agent: "Dietary & Allergens Agent", data: dietaryData });

    const weatherData = JSON.parse(weatherResponse.text || "{}");
    onStep({ agent: "Weather Intelligence Agent", data: weatherData });

    // Step 4: Menu Planning Agent
    const menuPrompt = `
      You are the Menu Planning Agent.
      Event Requirements: ${JSON.stringify(customerData)}.
      Dietary Constraints: ${JSON.stringify(dietaryData)}.
      Weather Forecast: ${weatherData.summary}.
      Suggest a 5-6 item menu.
      Return ONLY a JSON object with: 
      - menu: array of objects with 'dish', 'description', 'portion_per_guest'
      - dietary_compliance: a short note.
    `;
    const menuResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: menuPrompt,
      config: { responseMimeType: "application/json" }
    });
    const menuData = JSON.parse(menuResponse.text || "{}");
    
    // Add dummy images for visual flair
    const finalMenu = (menuData.menu || []).map((item: any, idx: number) => ({
      ...item,
      image_url: `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&q=80&w=400&h=300`
    }));
    const finalMenuData = { ...menuData, menu: finalMenu };
    onStep({ agent: "Menu Planning Agent", data: finalMenuData });

    // Step 5 & 6: Inventory & Logistics
    const [inventoryResponse, logisticsResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Inventory & Procurement Agent. Menu: ${JSON.stringify(menuData)} for ${customerData.guests} guests. Return JSON: ingredients, procurement_list, potential_shortages.`,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Logistics Planning Agent. Details: ${JSON.stringify(customerData)}. Return JSON: timeline, staffing_needs, transport_plan.`,
        config: { responseMimeType: "application/json" }
      })
    ]);

    const inventoryData = JSON.parse(inventoryResponse.text || "{}");
    onStep({ agent: "Inventory & Procurement Agent", data: inventoryData });

    const logisticsData = JSON.parse(logisticsResponse.text || "{}");
    onStep({ agent: "Logistics Planning Agent", data: logisticsData });

    // Step 7 & 8: Pricing & Monitoring
    const [pricingResponse, monitoringResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pricing Agent. Quote for budget ${customerData.budget}. Return JSON: optimized_quote, unit_cost, profit_margin, pricing_strategy, markup_percentage.`,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Monitoring Agent. Review plan for: ${JSON.stringify(customerData)}. Return JSON: overall_status, execution_readiness (percentage), final_summary.`,
        config: { responseMimeType: "application/json" }
      })
    ]);

    const pricingData = JSON.parse(pricingResponse.text || "{}");
    onStep({ agent: "Pricing & Optimization Agent", data: pricingData });
    
    const monitoringData = JSON.parse(monitoringResponse.text || "{}");
    onStep({ agent: "Monitoring Agent", data: monitoringData });

    return {
      success: true,
      data: {
        customer: customerData,
        dietary: dietaryData,
        menu: finalMenuData,
        inventory: inventoryData,
        weather: weatherData,
        logistics: logisticsData,
        pricing: pricingData,
        monitoring: monitoringData
      }
    };
  } catch (error) {
    console.error("Orchestration error:", error);
    throw error;
  }
}
