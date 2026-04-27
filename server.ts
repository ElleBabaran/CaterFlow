import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/weather", async (req, res) => {
    const { location, date } = req.body;
    try {
      const weatherPrompt = `Predict typical weather for ${location} on ${date}. Return summary, risk_level (low/medium/high), and recommendations (array of strings).`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Weather Error:", error);
      const isQuota = error.message?.includes("429") || error.message?.toLowerCase().includes("quota");
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? "Neural link saturated (Quota Exceeded). Please try again in 60 seconds." : error.message 
      });
    }
  });

  app.post("/api/orchestrate", async (req, res) => {
    const { input } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in the server environment. Please check your .env file." });
    }
    try {
      // Step 0: Clarification Check
      const clarificationPrompt = `Analyze this user request for a catering event: "${input}". 
      Is there enough information to create a basic plan (at least event type, rough location, and rough date/time)?
      If something critical is missing or too vague, provide a helpful follow-up question.
      Return "ready: true" if we can proceed, or "ready: false" with a "question".`;
      
      const clarResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: clarificationPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ready: { type: Type.BOOLEAN },
              question: { type: Type.STRING }
            },
            required: ["ready"]
          }
        }
      });
      const clarData = JSON.parse(clarResponse.text || "{}");
      if (!clarData.ready) {
        return res.json({ 
          success: false, 
          needs_clarification: true, 
          question: clarData.question || "Could you please provide more details about the event type, location, or date?" 
        });
      }

      // Step 1: Customer Extraction
      const customerPrompt = `Extract event requirements from: "${input}". 
      Return details such as event_type, guests, budget, location, date, dietary_needs.
      CRITICAL: Extract the budget EXACTLY as mentioned (e.g., "$500 total" or "$50/person").`;
      const customerResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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

      // Step 2 & 3: Research (Weather & Dietary)
      const researchPrompt = `For an event in ${customerData.location} on ${customerData.date} with dietary needs: ${customerData.dietary_needs}, research weather and dietary constraints. Use Google Search for current conditions if the date is close.`;
      const researchResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: researchPrompt,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
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

      // Step 4: Menu
      const menuPrompt = `Suggest 5-6 item menu for ${JSON.stringify(customerData)} considering weather ${weatherData.summary}. 
      CRITICAL: You MUST stay strictly within the budget of ${customerData.budget}.
      Provide a specific 'image_keyword' for EACH dish to find a high-quality food photo (e.g., 'gourmet-tacos', 'steak-frites').`;
      const menuResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
                    portion_per_guest: { type: Type.STRING },
                    image_keyword: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      const menuDataRaw = JSON.parse(menuResponse.text || '{"menu":[]}');
      const finalMenu = (menuDataRaw.menu || []).map((item: any) => ({
        ...item,
        image_url: `https://loremflickr.com/400/300/food,${encodeURIComponent(item.image_keyword || item.dish)}`
      }));
      const menuData = { ...menuDataRaw, menu: finalMenu };

      // Step 5-8: Operations
      const opsPrompt = `Plan inventory, logistics, pricing, and monitoring for this menu: ${JSON.stringify(menuData)} for ${customerData.guests} people.
      The budget is ${customerData.budget}. Ensure pricing breakdown respects this.`;
      const opsResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: opsPrompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              inventory: { type: Type.OBJECT },
              logistics: { type: Type.OBJECT },
              pricing: { type: Type.OBJECT },
              monitoring: { 
                type: Type.OBJECT,
                properties: {
                  overall_status: { type: Type.STRING },
                  execution_readiness: { type: Type.STRING },
                  final_summary: { type: Type.STRING }
                },
                required: ["overall_status", "final_summary"]
              }
            }
          }
        }
      });
      const opsData = JSON.parse(opsResponse.text || '{"inventory":{}, "logistics":{}, "pricing":{}, "monitoring":{}}');

      res.json({
        success: true,
        steps: [
          { agent: "Customer Interaction Agent", data: customerData },
          { agent: "Dietary & Allergens Agent", data: dietaryData },
          { agent: "Weather Intelligence Agent", data: weatherData },
          { agent: "Menu Planning Agent", data: menuData },
          { agent: "Inventory & Procurement Agent", data: opsData.inventory },
          { agent: "Logistics Planning Agent", data: opsData.logistics },
          { agent: "Pricing & Optimization Agent", data: opsData.pricing },
          { agent: "Monitoring Agent", data: opsData.monitoring }
        ],
        finalData: {
          customer: customerData,
          dietary: dietaryData,
          menu: menuData,
          inventory: opsData.inventory,
          weather: weatherData,
          logistics: opsData.logistics,
          pricing: opsData.pricing,
          monitoring: opsData.monitoring
        }
      });
    } catch (error: any) {
      console.error("Orchestration error:", error);
      const isQuota = error.message?.includes("429") || error.message?.toLowerCase().includes("quota");
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota ? "Neural link saturated (Quota Exceeded). Please try again in 60 seconds." : error.message 
      });
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
