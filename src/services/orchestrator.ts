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
      You are the Customer Interaction Agent powered by the Microsoft Agent Framework. 
      Leveraging Microsoft Foundry and Azure AI Search for data indexing, extract event requirements from this input: "${input}".
      Look for: event_type, guests, budget, location (city/country), date, dietary_needs, cuisine_preference, dessert_preference, drink_preference, special_requests.
      
      CRITICAL: For 'budget', you MUST include the currency symbol or code (e.g., "$100", "5000 PHP", "3000 Pesos"). 
      If the user provides a number but you are unsure of the currency or it is not explicitly mentioned, set budget to "MISSING_CURRENCY".
      If you see words like "Pesos", "Php", "USD", etc., ensure they are attached to the budget value.
      
      Return ONLY a JSON object with: event_type, guests, budget, location, date, dietary_needs, cuisine_preference, dessert_preference, drink_preference, special_requests.
    `;
    const customerResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: customerPrompt,
      config: { responseMimeType: "application/json" }
    });
    const customerData = JSON.parse(customerResponse.text || "{}");
    onStep({ agent: "Customer Interaction Agent", data: customerData });

    // Handle missing critical info early
    if (customerData.budget === "MISSING_CURRENCY") {
      return {
        success: false,
        clarification_required: true,
        field: "budget_currency",
        message: "I've noted your budget, but could you please specify the currency (e.g., USD, PHP, EUR)?"
      };
    }

    const missingFields = Object.entries(customerData)
      .filter(([key, val]) => val === "missing" || val === null || val === "" || (key === 'budget' && val === "MISSING_CURRENCY"))
      .map(([key]) => key);

    if (missingFields.length > 0 && missingFields.includes('event_type')) {
      return {
        success: false,
        clarification_required: true,
        field: "general",
        message: "I need a few more details to create a perfect plan. Specifically, what kind of event is this?"
      };
    }

    // Step 2 & 3: Dietary & Weather Agents (Parallelized for speed)
    const [dietaryResponse, weatherResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Dietary Agent.
          User specified dietary needs: "${customerData.dietary_needs}".
          Based ONLY on the user's specified needs, identify specific allergens to avoid and recommended labels (e.g. Halal, Vegan, Gluten-Free).
          DO NOT assume or invent allergies (like peanuts) if the user didn't mention them. If the user said "none" or left it blank, return empty arrays.
          Return ONLY a JSON object with: allergens_to_avoid (array), recommended_labels (array).
        `,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Weather Agent.
          Location: ${customerData.location}, Date: ${customerData.date}.
          Use Google Search to find typical or forecasted weather for this location and date.
          Predict potential weather impact on the catering event.
          IMPORTANT: In your summary, you MUST end with the statement: "With this info, we will decide what food should we suggest."
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
      Weather Forecast: ${weatherData.summary}. Risk Level: ${weatherData.risk_level}.
      
      1. Suggest a 5-6 item menu that matches the user's cuisine preference and strictly respects constraints.
      2. If 'dessert_preference' is 'Yes' or specified, include 1-2 appropriate dessert options.
      3. If 'drink_preference' is specified, include 1-2 drink recommendations that pair well with the food.
      4. DIRECTLY use weather info: if hot, recommend refreshing/cold dishes/drinks. If raining/cold, recommend comfort dishes/hot drinks.
      
      Return ONLY a JSON object with: 
      - menu: array of objects with 'dish', 'description', 'portion_per_guest', 'image_search_query'
      - dietary_compliance: a short note on how this menu meets the requirements.
    `;
    const menuResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: menuPrompt,
      config: { responseMimeType: "application/json" }
    });
    const menuData = JSON.parse(menuResponse.text || "{}");

    // Robustness: ensure menu exists
    const finalMenuArray = menuData.menu || menuData.dishes || [];
    
    // Add visual layer to menu items
    const processedMenu = finalMenuArray.map((item: any) => {
      // Create a better search query for images
      const query = encodeURIComponent(`${item.dish} food`).replace(/%20/g, ',');
      return {
        ...item,
        image_url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300&sig=${Math.floor(Math.random() * 10000)}` 
      };
    });

    // In a real app we'd use an actual Image API, for now let's use a themed set of Unsplash IDs for variety
    const foodPlaceholders = [
      'photo-1546069901-ba9599a7e63c', // Salad bowl
      'photo-1504674900247-0877df9cc836', // Generic high quality dish
      'photo-1567620905732-2d1ec7bb7445', // Gourmet styling
      'photo-1565299624946-b28f40a0ae38', // Hot dish / Pizza / Pasta
      'photo-1565958011703-44f9829ba187', // Dessert / Sweet
      'photo-1482049016688-2d3e1b311543', // Healthy wrap/sandwich
      'photo-1467003909585-2f8a72700288', // Fine dining
      'photo-1473093226795-af9932fe5856', // Hearty pasta
      'photo-1512621776951-a57141f2eefd', // Fresh salad
      'photo-1476224203421-9ac3993c3901', // Platter
      'photo-1555939594-58d7cb561ad1', // Skewers/Grilled
      'photo-1540189549336-e6e99c3679fe', // Mixed veggies
      'photo-1504754668056-230e385f984d', // Breakfast
      'photo-1565299585323-38d6b0865b47', // Asian
      'photo-1484723091739-30a097e8f929', // Gourmet toast
      'photo-1543353071-873f17a7a088', // Mediterranean
      'photo-1547592166-23ac45744acd', // Table setup
      'photo-1551218808-94e220e084d2', // Restaurant vibe
    ];

    processedMenu.forEach((item: any, idx: number) => {
      const photoId = foodPlaceholders[idx % foodPlaceholders.length];
      item.image_url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=80&w=800&h=600&sig=${idx + Date.now()}`;
    });

    const finalMenuData = { ...menuData, menu: processedMenu };
    onStep({ agent: "Menu Planning Agent", data: finalMenuData });

    // Step 5 & 6: Inventory & Logistics (Parallelized)
    const [inventoryResponse, logisticsResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Inventory & Procurement Agent.
          Menu: ${JSON.stringify(menuData)} for ${customerData.guests} guests.
          1. Determine precise ingredient requirements.
          2. Identify potential shortages (assume current stock is 0).
          3. Generate a structured 'Procurement List' with estimated market costs.
          Return ONLY a JSON object with: ingredients (array of objects with 'name', 'quantity', 'unit'), procurement_list (array of objects with 'item', 'qty', 'est_cost'), potential_shortages (array of strings).
        `,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Logistics Planning Agent.
          Event Details: ${JSON.stringify(customerData)}.
          Weather Risk: ${weatherData.risk_level}.
          1. Plan a detailed preparation timeline (Prep -> Cook -> Pack -> Deliver).
          2. Allocate resources (staff count, transport requirements).
          3. Account for weather risks in schedules.
          Return ONLY a JSON object with: timeline (array of objects with 'time', 'activity', 'duration'), staffing_needs (string), transport_plan (string).
        `,
        config: { responseMimeType: "application/json" }
      })
    ]);

    const inventoryData = JSON.parse(inventoryResponse.text || "{}");
    onStep({ agent: "Inventory & Procurement Agent", data: inventoryData });

    const logisticsData = JSON.parse(logisticsResponse.text || "{}");
    onStep({ agent: "Logistics Planning Agent", data: logisticsData });

    // Step 7 & 8: Pricing & Monitoring (Parallelized)
    const [pricingResponse, monitoringResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Pricing & Optimization Agent.
          Guest Count: ${customerData.guests}.
          Procurement Costs: ${JSON.stringify(inventoryData.procurement_list)}.
          Budget specified by user: ${customerData.budget}.
          
          TASK:
          1. 'optimized_quote' should be the TOTAL PRICE (Food + Labor + Margin). It MUST NOT exceed the user's budget of ${customerData.budget}. If your calculated costs exceed this, you MUST suggest a strategy to stay WITHIN or BELOW this limit.
          2. 'unit_cost' MUST be the total price divided by the number of guests (${customerData.guests}).
          3. 'profit_margin' should be the percentage profit. Aim for ~30% but prioritize staying within the user's budget.
          4. Format all currency strings using the correct symbol (e.g. ₱, $, etc.) based on the user's budget input.
          
          Return ONLY a JSON object with: 
          - optimized_quote: string (Total Price)
          - unit_cost: string (Quote per Guest)
          - profit_margin: string (e.g. "28.5%")
          - pricing_strategy: string (Brief reasoning)
          - markup_percentage: string
        `,
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are the Monitoring Agent.
          Review the entire plan for consistency and risks:
          Event: ${JSON.stringify(customerData)}
          Menu: ${JSON.stringify(menuData)}
          Logistics: ${JSON.stringify(logisticsData)}
          1. Track 'Execution Readiness' (0-100%).
          2. Flags risks or potential delays based on weather and logistics.
          3. Final consistency check between menu and dietary needs.
          Return ONLY a JSON object with: overall_status (green/yellow/red), execution_readiness (percentage), final_summary (string).
        `,
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
        menu: menuData,
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
