import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Configuration
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/weather", async (req, res) => {
    const { location, date } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined on server." });
      }

      const weatherPrompt = `Predict typical weather for ${location} on ${date}. Return ONLY JSON with summary, risk_level (low/medium/high), recommendations (array of strings).`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: weatherPrompt,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }] 
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Weather Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Orchestration Endpoint
  app.post("/api/orchestrate", async (req, res) => {
    const { input } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined on server." });
      }

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
        model: "gemini-1.5-flash",
        contents: customerPrompt,
        config: { responseMimeType: "application/json" }
      });
      const customerData = JSON.parse(customerResponse.text || "{}");

      // Handle missing critical info early
      if (customerData.budget === "MISSING_CURRENCY") {
        return res.json({
          success: false,
          clarification_required: true,
          field: "budget_currency",
          message: "I've noted your budget, but could you please specify the currency (e.g., USD, PHP, EUR)?"
        });
      }

      // Step 2 & 3: Dietary & Weather Agents
      const dietaryPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `
          You are the Dietary Agent.
          User specified dietary needs: "${customerData.dietary_needs}".
          Identify specific allergens to avoid and recommended labels (e.g. Halal, Vegan, Gluten-Free).
          Return ONLY a JSON object with: allergens_to_avoid (array), recommended_labels (array).
        `,
        config: { responseMimeType: "application/json" }
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ allergens_to_avoid: [], recommended_labels: [] }));

      const weatherPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
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
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ summary: "Weather data unavailable.", risk_level: "low", recommendations: [] }));

      const [dietaryData, weatherData] = await Promise.all([dietaryPromise, weatherPromise]);

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
        model: "gemini-1.5-flash",
        contents: menuPrompt,
        config: { responseMimeType: "application/json" }
      });
      const menuData = JSON.parse(menuResponse.text || "{}");

      // Step 5 & 6: Inventory & Logistics
      const inventoryPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Inventory & Procurement Agent. Menu: ${JSON.stringify(menuData)} for ${customerData.guests} guests. Return JSON: ingredients, procurement_list, potential_shortages.`,
        config: { responseMimeType: "application/json" }
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ ingredients: [], procurement_list: [], potential_shortages: [] }));

      const logisticsPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Logistics Planning Agent. Details: ${JSON.stringify(customerData)}. Return JSON: timeline, staffing_needs, transport_plan.`,
        config: { responseMimeType: "application/json" }
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ timeline: [], staffing_needs: "TBD", transport_plan: "TBD" }));

      const [inventoryData, logisticsData] = await Promise.all([inventoryPromise, logisticsPromise]);

      // Step 7 & 8: Pricing & Monitoring
      const pricingPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Pricing Agent. Quote for budget ${customerData.budget}. Return JSON: optimized_quote, unit_cost, profit_margin, pricing_strategy, markup_percentage.`,
        config: { responseMimeType: "application/json" }
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ optimized_quote: customerData.budget, unit_cost: "TBD", profit_margin: "0%", pricing_strategy: "Manual check", markup_percentage: "0%" }));

      const monitoringPromise = ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Monitoring Agent. Review plan for: ${JSON.stringify(customerData)}. Return JSON: overall_status, execution_readiness (percentage), final_summary.`,
        config: { responseMimeType: "application/json" }
      }).then(res => JSON.parse(res.text || "{}")).catch(() => ({ overall_status: "yellow", execution_readiness: 70, final_summary: "Plan check delayed." }));

      const [pricingData, monitoringData] = await Promise.all([pricingPromise, monitoringPromise]);

      // Package steps for the frontend to replay
      res.json({
        success: true,
        steps: [
          { agent: "Customer Interaction Agent", data: customerData },
          { agent: "Dietary & Allergens Agent", data: dietaryData },
          { agent: "Weather Intelligence Agent", data: weatherData },
          { agent: "Menu Planning Agent", data: { ...menuData, menu: (menuData.menu || []).map((item: any, idx: number) => ({ ...item, image_url: `https://images.unsplash.com/photo-${1504674900247 + idx}?auto=format&fit=crop&q=80&w=400&h=300` })) } },
          { agent: "Inventory & Procurement Agent", data: inventoryData },
          { agent: "Logistics Planning Agent", data: logisticsData },
          { agent: "Pricing & Optimization Agent", data: pricingData },
          { agent: "Monitoring Agent", data: monitoringData }
        ],
        finalData: {
          customer: customerData,
          dietary: dietaryData,
          menu: { ...menuData, menu: (menuData.menu || []).map((item: any, idx: number) => ({ ...item, image_url: `https://images.unsplash.com/photo-${1504674900247 + idx}?auto=format&fit=crop&q=80&w=400&h=300` })) },
          inventory: inventoryData,
          weather: weatherData,
          logistics: logisticsData,
          pricing: pricingData,
          monitoring: monitoringData
        }
      });
    } catch (error: any) {
      console.error("Orchestration error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
