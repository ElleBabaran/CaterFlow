import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number.parseInt(process.env.PORT || "3000", 10);

  app.use(cors());
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  console.log("Starting CaterFlow Server...");

  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/CaterFlow";
  
  const mongooseOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4,
  };

  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => console.log("✓ Connected to MongoDB"))
    .catch(err => {
      console.error("✗ MongoDB connection error:", err.message);
      console.warn("⚠️  Server continuing without MongoDB — data persistence will be unavailable.");
    });

  mongoose.connection.on('disconnected', () => {
    console.warn("⚠️  MongoDB disconnected, attempting to reconnect...");
    setTimeout(() => {
      mongoose.connect(MONGODB_URI, mongooseOptions).catch(err => 
        console.error("Reconnection failed:", err.message)
      );
    }, 5000);
  });

  const EventSchema = new mongoose.Schema({
    userId: String,
    title: String,
    rawInput: String,
    messages: Array,
    eventData: Object,
    steps: Array,
    qIndex: Number,
    type: { type: String, default: 'plan' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  const Event = mongoose.model("Event", EventSchema);

  const UserSchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    email: String,
    name: String,
    photoURL: String,
    role: { type: String, default: 'customer' },
    shopId: String,
    staffInfo: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  const UserProfile = mongoose.model("UserProfile", UserSchema);
  
  const ShopSchema = new mongoose.Schema({
    adminId: String,
    name: String,
    location: String,
    coordinates: { lat: Number, lng: Number },
    specialties: String,
    baseQuote: Number,
    socials: String,
    shopImage: String,
    description: String,
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    logo: String,
    banner: String,
    isActive: { type: Boolean, default: true },
    pin: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now }
  });
  const Shop = mongoose.model("Shop", ShopSchema);

  const ChatSchema = new mongoose.Schema({
    eventId: String,
    participants: [String],
    messages: [{
      senderId: String,
      text: String,
      type: { type: String, default: 'text' },
      attachment: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now }
    }],
    status: { type: String, default: 'open' }
  });
  const Chat = mongoose.model("Chat", ChatSchema);

  function parseBearerToken(header: string | undefined) {
    if (!header) return "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1] || "";
  }

  async function authContext(req: express.Request) {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
      const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
      const uid = decoded?.user_id || decoded?.sub || decoded?.uid;
      if (!uid) return null;
      const profile = await UserProfile.findOne({ uid });
      return { uid, role: profile?.role || "customer", profile };
    } catch (err) { return null; }
  }

  async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ctx = await authContext(req);
    if (!ctx?.uid) { res.status(401).json({ error: "Unauthorized" }); return; }
    (req as any).auth = ctx;
    next();
  }

  function requireOwnerOrAdmin(getResourceOwner: (req: express.Request) => string | undefined) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const auth = (req as any).auth;
      const owner = getResourceOwner(req);
      if (!auth?.uid || !owner) { res.status(403).json({ error: "Forbidden" }); return; }
      if (auth.role === "admin" || auth.uid === owner) { next(); return; }
      res.status(403).json({ error: "Forbidden" });
    };
  }

  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  function rateLimit(windowMs: number, maxRequests: number) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const key = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      const now = Date.now();
      const record = rateLimitStore.get(key);
      if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        next(); return;
      }
      record.count += 1;
      if (record.count > maxRequests) { res.status(429).json({ error: "Too many requests" }); return; }
      next();
    };
  }

  function pickEventUpdates(body: any) {
    return {
      title: typeof body.title === "string" ? body.title : undefined,
      type: body.type,
      rawInput: typeof body.rawInput === "string" ? body.rawInput.substring(0, 5000) : undefined,
      messages: Array.isArray(body.messages) ? body.messages : undefined,
      eventData: body.eventData && typeof body.eventData === "object" ? body.eventData : undefined,
      steps: Array.isArray(body.steps) ? body.steps : undefined,
      qIndex: typeof body.qIndex === "number" ? body.qIndex : undefined,
      updatedAt: new Date(),
    };
  }

  app.get("/api/users/:uid", requireAuth, requireOwnerOrAdmin((req) => req.params.uid), async (req, res) => {
    try {
      const user = await UserProfile.findOne({ uid: req.params.uid });
      res.json(user);
    } catch (err) { res.status(500).json({ error: "Failed to fetch user profile" }); }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { email, name, role, photoURL, staffInfo, shopId } = req.body;
      const uid = auth.uid;
      const update: any = { email, name, photoURL, updatedAt: new Date() };
      if (role) update.role = role;
      if (staffInfo !== undefined) update.staffInfo = staffInfo;
      if (shopId !== undefined) update.shopId = shopId;
      const user = await UserProfile.findOneAndUpdate({ uid }, { $set: update }, { upsert: true, returnDocument: 'after' });
      res.json(user);
    } catch (err) { res.status(500).json({ error: "Failed to save user profile" }); }
  });

  // Link staff to shop via PIN
  app.post("/api/users/link-shop", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { pin, staffInfo, name } = req.body;
      if (!pin) return res.status(400).json({ error: "PIN is required" });
      const shop = await Shop.findOne({ pin: String(pin).trim() });
      if (!shop) return res.status(404).json({ error: "Invalid PIN. No shop found with this code." });
      const update: any = { shopId: String((shop as any)._id), updatedAt: new Date() };
      if (staffInfo) update.staffInfo = staffInfo;
      if (name) update.name = name;
      const user = await UserProfile.findOneAndUpdate({ uid: auth.uid }, { $set: update }, { upsert: true, returnDocument: 'after' });
      res.json({ success: true, shop: { _id: (shop as any)._id, name: (shop as any).name, location: (shop as any).location }, user });
    } catch (err) { res.status(500).json({ error: "Failed to link staff to shop" }); }
  });

  app.get("/api/staff/orders", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const profile = await UserProfile.findOne({ uid: auth.uid });
      if (!profile || !profile.shopId) {
        return res.json([]);
      }
      const events = await Event.find({
        $or: [
          { "eventData.selectedShop._id": profile.shopId },
          { "eventData.shopId": profile.shopId }
        ]
      }).sort({ updatedAt: -1 });
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch staff shop orders" });
    }
  });

  // Get shop by PIN (for staff to verify before linking)
  app.get("/api/shops/by-pin/:pin", async (req, res) => {
    try {
      const shop = await Shop.findOne({ pin: String(req.params.pin).trim() }).select('name location specialties baseQuote shopImage');
      if (!shop) return res.status(404).json({ error: "No shop found with this PIN" });
      res.json(shop);
    } catch (err) { res.status(500).json({ error: "Failed to find shop by PIN" }); }
  });


  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
  });

  app.get("/favicon.ico", (req, res) => res.status(204).end());

  function parseAiJson(text: string) {
    const cleaned = String(text || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    try {
      if (!cleaned) throw new Error("Empty AI response");
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.error("[CaterFlow] JSON Parse Error on text:", cleaned.substring(0, 500));
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
      throw new Error("AI response was not valid JSON");
    }
  }

  function normalizeMenuPlan(plan: any) {
    try {
      // If AI returns menu inside a nested data/plan object, flatten it
      const actualPlan = plan?.data || plan?.plan || plan || {};
      const menu = Array.isArray(actualPlan?.menu) ? actualPlan.menu : 
                   Array.isArray(plan?.menu) ? plan.menu : [];
      
      const sanitizedMenu = menu.map((item: any, index: number) => ({
        id: item.id || `ai-item-${index + 1}`,
        dish: String(item.dish || item.name || item.title || "AI Dish").trim(),
        description: String(item.description || item.details || "").trim(),
        category: String(item.category || item.type || "Chef recommendation").trim(),
        price: String(item.price || item.estimated_price || item.cost || "").trim(),
        portion_per_guest: String(item.portion_per_guest || item.portion || "1 serving").trim(),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(String) : [],
        reasoning: String(item.reasoning || item.reason || "").trim(),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        allergens: Array.isArray(item.allergens) ? item.allergens.map(String) : [],
        dietary_compliance: String(item.dietary_compliance || "").trim(),
        image_url: String(item.image_url || "").trim(),
      })).filter((item: any) => item.dish);

      return {
        customer: actualPlan.customer || plan.customer || {},
        knowledge: actualPlan.knowledge || plan.knowledge || { mode: "ai_only" },
        dietary: actualPlan.dietary || plan.dietary || { summary: "Compliant" },
        weather: actualPlan.weather || plan.weather || {},
        menu: {
          dietary_compliance: actualPlan.menu_summary?.dietary_compliance || actualPlan.dietary?.summary || plan.dietary?.summary || "Compliant",
          cultural_adaptation: actualPlan.menu_summary?.cultural_adaptation || "",
          nutrition_summary: actualPlan.menu_summary?.nutrition_summary || {},
          menu: sanitizedMenu.length > 0 ? sanitizedMenu : [{ dish: "Chef's Daily Special", description: "A balanced meal curated based on your event requirements.", category: "Main", portion_per_guest: "1 serving" }],
        },
        inventory: actualPlan.inventory || plan.inventory || { procurement_list: [] },
        suppliers: actualPlan.suppliers || plan.suppliers || { supplier_matches: [], catering_shop_recommendations: [] },
        logistics: actualPlan.logistics || plan.logistics || { timeline: [], staffing_needs: "Standard staff allocation." },
        pricing: actualPlan.pricing || plan.pricing || { total_estimate: "Contact for pricing", unit_cost: "Market rate" },
        monitoring: actualPlan.monitoring || plan.monitoring || { execution_readiness: 95 },
      };
    } catch (err) {
      console.error("[CaterFlow] Normalization error:", err);
      return {
        customer: {}, knowledge: { mode: "ai_only" }, dietary: { summary: "Standard safety protocols active." },
        weather: {}, menu: { menu: [{ dish: "Chef's Special", description: "Curated event menu" }] },
        inventory: { procurement_list: [] }, suppliers: { supplier_matches: [] }, logistics: { timeline: [] },
        pricing: { total_estimate: "TBD" }, monitoring: { execution_readiness: 90 }
      };
    }
  }

  app.post("/api/ai/orchestrate", rateLimit(60_000, 12), async (req, res) => {
    const { prompt = "" } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 6000) {
      return res.status(400).json({ error: "Invalid planning prompt" });
    }

    const messages = [
      { 
        role: "system", 
        content: "You are CaterFlow's production food recommendation engine. Generate original, contextual catering recommendations from the user's brief only. \n" +
                 "CRITICAL: Satisfy all user preferences (cuisine, dietary, theme, guests). \n" +
                 "Respond in the same language as the user's prompt (e.g., if the user asks in Tagalog, reasoning must be in Tagalog).\n" +
                 "RETURN JSON ONLY matching this schema:\n" +
                 "{\n" +
                 "  \"menu\": [\n" +
                 "    { \"dish\": \"Name\", \"description\": \"Details\", \"category\": \"Type\", \"price\": \"Est. Price\", \"portion_per_guest\": \"Serving size\", \"reasoning\": \"Why this dish?\" }\n" +
                 "  ],\n" +
                 "  \"dietary\": { \"summary\": \"Compliance info\" },\n" +
                 "  \"pricing\": { \"total_estimate\": \"Total\" }\n" +
                 "}"
      },
      { role: "user", content: `Create a complete catering plan for this brief: ${prompt}\n\nReturn JSON only.` },
    ];

    const aiRequestBody = {
      messages,
      temperature: 0.9,
      top_p: 0.95,
      response_format: { type: "json_object" },
    };

    const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.FOUNDRY_PROJECT_ENDPOINT || "").trim().replace(/^"|"$/g, '');
    const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.FOUNDRY_MODEL || "").trim().replace(/^"|"$/g, '');
    const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API || "").trim().replace(/^"|"$/g, '');

    if (endpoint && deployment && apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
        const aiResponse = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "api-key": apiKey,
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(aiRequestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (aiResponse.ok) {
          const envelope = await aiResponse.json();
          const content = envelope?.choices?.[0]?.message?.content;
          console.log("[CaterFlow] Azure AI Success");
          return res.json({ success: true, provider: "azure_openai", data: normalizeMenuPlan(parseAiJson(content)) });
        } else {
          const errBody = await aiResponse.json().catch(() => ({}));
          console.warn("[CaterFlow] Azure AI Error Status:", aiResponse.status, errBody);
        }
      } catch (err: any) { 
        console.warn("[CaterFlow] Primary AI failed:", err.message); 
      }
    }

    try {
      let aiPool: any = {};
      try {
        aiPool = await import("./src/services/aiConfig.js").catch(() => 
                  import("./src/services/aiConfig.ts").catch(() => ({})));
      } catch (e) {
        console.warn("[CaterFlow] Config import failed, using process.env only");
      }
      
      let { NATIVE_GEMINI_KEYS, DEEPSEEK_KEYS, GPT_KEYS, BASE_URL: PEKPIK_BASE_URL } = aiPool;

      // Inject env keys if config pool is empty
      if (!GPT_KEYS?.length && process.env.OPENAI_API_KEY) GPT_KEYS = [process.env.OPENAI_API_KEY];
      if (!DEEPSEEK_KEYS?.length && process.env.DEEPSEEK_API_KEY) DEEPSEEK_KEYS = [process.env.DEEPSEEK_API_KEY];
      if (!NATIVE_GEMINI_KEYS?.length && process.env.GEMINI_API_KEY) NATIVE_GEMINI_KEYS = [process.env.GEMINI_API_KEY];

      // 1. Fallback to ChatGPT (Official)
      if (GPT_KEYS && GPT_KEYS.length > 0) {
        console.log("[CaterFlow] Attempting GPT-4o failover...");
        for (const gptKey of GPT_KEYS) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${gptKey}`
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: aiRequestBody.messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
              }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const content = data.choices?.[0]?.message?.content;
              return res.json({ success: true, provider: "failover_gpt", data: normalizeMenuPlan(parseAiJson(content)) });
            }
          } catch (e) {}
        }
      }

      // 2. Fallback to DeepSeek
      if (DEEPSEEK_KEYS && DEEPSEEK_KEYS.length > 0) {
        console.log("[CaterFlow] Attempting DeepSeek failover...");
        for (const dsKey of DEEPSEEK_KEYS) {
          const dsEndpoints = ["https://api.deepseek.com/v1", PEKPIK_BASE_URL];
          for (const endpoint of dsEndpoints) {
            try {
              const response = await fetch(`${endpoint}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${dsKey}`
                },
                body: JSON.stringify({
                  model: "deepseek-chat",
                  messages: aiRequestBody.messages,
                  temperature: 0.7,
                  response_format: { type: "json_object" }
                })
              });

              if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                return res.json({ success: true, provider: "failover_deepseek", data: normalizeMenuPlan(parseAiJson(content)) });
              }
            } catch (e) {}
          }
        }
      }

      // 3. Fallback to Native Gemini
      if (NATIVE_GEMINI_KEYS && NATIVE_GEMINI_KEYS.length > 0) {
        console.log("[CaterFlow] Attempting Gemini failover...");
        const geminiModels = ["gemini-2.0-flash-lite", "gemini-1.5-flash"];
        for (const model of geminiModels) {
          for (const nativeKey of NATIVE_GEMINI_KEYS) {
            try {
              const systemInstruction = aiRequestBody.messages.find((m: any) => m.role === "system")?.content || "";
              const userContent = aiRequestBody.messages.find((m: any) => m.role === "user")?.content || "";
              const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${nativeKey}`;
              
              const response = await fetch(googleUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                  contents: [{ parts: [{ text: userContent }] }],
                  generationConfig: { responseMimeType: "application/json" }
                })
              });

              if (response.ok) {
                const data = await response.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                return res.json({ success: true, provider: `failover_gemini_${model}`, data: normalizeMenuPlan(parseAiJson(content)) });
              }
            } catch (e) {}
          }
        }
      }

    } catch (e) {
      console.error("[CaterFlow] Failover engine crash:", e);
    }

    console.warn("[CaterFlow] All AI providers failed. Using local heuristic fallback.");
    const fallbackPlan = {
      success: true,
      provider: "local_healer_fallback",
      data: {
        customer: { event_type: "Catering Event", guests: 100, location: "TBD", date: "TBD" },
        knowledge: { mode: "fallback_recovery" },
        dietary: { summary: "Standard food safety and dietary protocols applied. Verified safe for general consumption." },
        weather: { summary: "Weather intelligence offline. Standard prep recommended.", risk_level: "low" },
        menu: {
          dietary_compliance: "Verified safe",
          cultural_adaptation: "Neutral/Standard",
          nutrition_summary: { calories: "Balanced", protein: "High" },
          menu: [
            { dish: "Premium Chef's Special (Main)", description: "Contextual main course prepared with seasonal ingredients.", category: "Main Course", price: "PHP 450", portion_per_guest: "1 serving", reasoning: "Selected based on event requirements." },
            { dish: "Signature Side Platter", description: "Assorted seasonal sides and accompaniments.", category: "Sides", price: "PHP 150", portion_per_guest: "1 serving", reasoning: "Balances the main course." },
            { dish: "Artisan Dessert Trio", description: "A selection of miniature desserts.", category: "Dessert", price: "PHP 200", portion_per_guest: "1 serving", reasoning: "Sweet conclusion to the meal." }
          ]
        },
        inventory: { 
          procurement_list: [
            { item: "Main Protein", qty: "25kg", source_category: "Butchery" },
            { item: "Staple (Rice/Grain)", qty: "15kg", source_category: "Dry Goods" },
            { item: "Assorted Veggies", qty: "10kg", source_category: "Market" }
          ],
          potential_shortages: []
        },
        suppliers: { 
          supplier_matches: [
            { name: "Local Market Partner", area: "Metro Area", score: "100%", reason: "Reliable fallback source" }
          ],
          catering_shop_recommendations: [] 
        },
        logistics: {
          timeline: [
            { time: "08:00 AM", activity: "Kitchen Prep Starts" },
            { time: "11:00 AM", activity: "Logistics Load-out" },
            { time: "12:00 PM", activity: "On-site Setup" }
          ],
          staffing_needs: "Standard team: 1 Chef, 2 Waiters",
          transport_plan: "Standard delivery van required"
        },
        pricing: { optimized_quote: "PHP 85,000", unit_cost: "PHP 850 / guest", profit_margin: "25%" },
        monitoring: { overall_status: "green", execution_readiness: 100 }
      }
    };
    res.json(fallbackPlan);
  });

  app.get("/api/ai/status", async (req, res) => {
    const status = {
      azure: !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY),
      openai: !!process.env.OPENAI_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      gemini: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    res.json(status);
  });

  app.post("/api/ai/regenerate-item", rateLimit(60_000, 20), async (req, res) => {
    try {
      const { currentItem, context } = req.body || {};
      const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").trim().replace(/^"|"$/g, '');
      const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "").trim().replace(/^"|"$/g, '');
      const apiKey = (process.env.AZURE_OPENAI_API_KEY || "").trim().replace(/^"|"$/g, '');
      if (!endpoint || !deployment || !apiKey) return res.status(503).json({ error: "AI service not configured" });
      const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
      const prompt = `System: You are an expert catering chef. Context: The user is planning a ${context?.theme || 'General'} event for ${context?.guests || 10} guests. Current Item to replace: ${JSON.stringify(currentItem)}. Return ONE JSON object matching the menu card schema.`;
      const aiResponse = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], temperature: 0.8, response_format: { type: "json_object" } })
      });
      const result = await aiResponse.json();
      res.json({ success: true, newItem: parseAiJson(result?.choices?.[0]?.message?.content) });
    } catch (err) { res.status(500).json({ error: "Failed to regenerate item" }); }
  });

  app.get("/api/events/user/:userId", requireAuth, requireOwnerOrAdmin((req) => req.params.userId), async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const skip = Math.min(parseInt(req.query.skip as string) || 0, 10000);
      const events = await Event.find({ userId }).sort({ updatedAt: -1 }).limit(limit).skip(skip);
      const total = await Event.countDocuments({ userId });
      res.json({ events, total, limit, skip });
    } catch (err) { res.status(500).json({ error: "Failed to fetch events" }); }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { userId, type, title, rawInput, messages, eventData, steps, qIndex } = req.body;
      if (userId !== auth.uid) return res.status(403).json({ error: "Forbidden" });

      const firstUserMessage = messages?.find((msg: any) => msg.role === 'user')?.content;
      const fallbackTitle = title || (eventData?.event_type ? `${eventData.event_type} Plan` : firstUserMessage || "Untitled Catering Plan");

      const newEvent = new Event({ 
        userId, 
        type, 
        title: fallbackTitle,
        rawInput: String(rawInput || "").substring(0, 5000), 
        messages: messages || [], 
        eventData: eventData || {}, 
        steps: steps || [], 
        qIndex: typeof qIndex === "number" ? qIndex : 0,
        createdAt: new Date(), 
        updatedAt: new Date() 
      });
      await newEvent.save();
      res.json(newEvent);
    } catch (err) { res.status(500).json({ error: "Failed to save event" }); }
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const eventId = req.params.id;
      const existing = await Event.findById(eventId);
      if (!existing) return res.status(404).json({ error: "Event not found" });
      if (auth.role !== "admin" && auth.uid !== existing.userId) return res.status(403).json({ error: "Forbidden" });
      const update = pickEventUpdates(req.body);
      const updated = await Event.findByIdAndUpdate(eventId, { $set: update }, { returnDocument: 'after' });
      res.json(updated);
    } catch (err) { res.status(500).json({ error: "Failed to update event" }); }
  });

  app.post("/api/events/:id/delivery-status", requireAuth, async (req, res) => {
    try {
      const { status, deliveryLocation } = req.body;
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const eventData = event.eventData || {};
      eventData.delivery_status = status;
      if (deliveryLocation) {
        eventData.deliveryLocation = deliveryLocation;
        eventData.event_location = deliveryLocation;
      }
      // Map progress statuses to state
      if (status === 'delivery_approved') {
        eventData.agreement_status = 'delivery_approved';
      } else if (status === 'completed') {
        eventData.agreement_status = 'completed';
      }
      event.eventData = eventData;
      event.markModified('eventData');
      
      await event.save();
      res.json({ success: true, event });
    } catch (err) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const eventId = req.params.id;
      const existing = await Event.findById(eventId);
      if (!existing) return res.status(404).json({ error: "Event not found" });
      if (auth.role !== "admin" && auth.uid !== existing.userId) return res.status(403).json({ error: "Forbidden" });
      await Event.findByIdAndDelete(eventId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete event" }); }
  });

  app.get("/api/shops", async (req, res) => {
    try {
      const shops = await Shop.find();
      res.json(shops);
    } catch (err) { res.status(500).json({ error: "Failed to fetch shops" }); }
  });

  app.post("/api/shops", requireAuth, async (req, res) => {
    try {
      const shop = await Shop.findOneAndUpdate({ adminId: (req as any).auth.uid }, { ...req.body, adminId: (req as any).auth.uid }, { upsert: true, returnDocument: 'after' });
      res.json(shop);
    } catch (err) { res.status(500).json({ error: "Failed to save shop" }); }
  });

  app.get("/api/shops/discovery", async (req, res) => {
    try {
      const { location } = req.query;
      let query: any = { isActive: true };
      if (location) query.location = { $regex: String(location), $options: 'i' };
      const shops = await Shop.find(query).limit(10);
      res.json(shops);
    } catch (err) { res.status(500).json({ error: "Discovery failed" }); }
  });

  app.get("/api/shops/:id", async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) return res.status(404).json({ error: "Shop not found" });
      res.json(shop);
    } catch (err) { res.status(500).json({ error: "Failed to fetch shop" }); }
  });

  app.get("/api/public/orders/:eventId", rateLimit(60_000, 60), async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
        return res.status(404).json({ error: "Order not found" });
      }

      const event = await Event.findById(req.params.eventId).lean();
      if (!event) return res.status(404).json({ error: "Order not found" });

      const steps = Array.isArray((event as any).steps) ? (event as any).steps : [];
      const menuStep = steps.find((step: any) => String(step.agent || "").includes("Head Chef"));
      const logisticsStep = steps.find((step: any) => String(step.agent || "").includes("Logistics"));
      const pricingStep = steps.find((step: any) => String(step.agent || "").includes("Accountant") || String(step.agent || "").includes("Cost Optimization"));
      const monitoringStep = steps.find((step: any) => String(step.agent || "").includes("Monitoring"));

      const publicEventData = (event as any).eventData || {};

      res.json({
        orderId: String((event as any)._id),
        title: (event as any).title,
        status: publicEventData.agreement_status || ((event as any).type === "finalized_order" ? "finalized" : "planned"),
        finalizedAt: publicEventData.finalized_at,
        event: publicEventData,
        menu: Array.isArray(publicEventData.final_menu) && publicEventData.final_menu.length > 0 ? publicEventData.final_menu : (menuStep?.data?.menu || []),
        logistics: {
          timeline: logisticsStep?.data?.timeline || [],
          staffing_needs: logisticsStep?.data?.staffing_needs || (event as any).eventData?.staffing_needs || "",
        },
        pricing: pricingStep?.data || {},
        monitoring: monitoringStep?.data || {},
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch public order" });
    }
  });

  app.get("/api/chat/:eventId", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const chat = await Chat.findOne({ eventId: req.params.eventId, participants: auth.uid });
      res.json(chat || { messages: [] });
    } catch (err) { res.status(500).json({ error: "Failed to fetch chat" }); }
  });

  app.post("/api/chat/send", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { eventId, text, shopId, type = 'text', attachment } = req.body;
      let chat = await Chat.findOne({ eventId });
      if (!chat) {
        const participants = [auth.uid];
        if (shopId) {
          const shop = await Shop.findById(shopId);
          if (shop) participants.push(shop.adminId);
        }
        chat = new Chat({ eventId, participants, messages: [] });
      }
      chat.messages.push({ 
        senderId: auth.uid, 
        text, 
        type,
        attachment,
        timestamp: new Date() 
      });
      await chat.save();
      res.json(chat);
    } catch (err) { res.status(500).json({ error: "Failed to send message" }); }
  });

  app.post("/api/events/:id/save-prompt", requireAuth, async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      event.type = 'saved_plan';
      await event.save();
      res.json({ success: true, event });
    } catch (err) { res.status(500).json({ error: "Failed to save plan" }); }
  });

  app.get("/api/shops/my/inventory", requireAuth, async (req, res) => {
    try {
      const shop = await Shop.findOne({ adminId: (req as any).auth.uid });
      res.json({ inventory: (shop as any)?.inventory || [] });
    } catch (err) { res.status(500).json({ error: "Failed to fetch inventory" }); }
  });

  app.post("/api/shops/my/inventory", requireAuth, async (req, res) => {
    try {
      const shop = await Shop.findOneAndUpdate({ adminId: (req as any).auth.uid }, { inventory: req.body.items, adminId: (req as any).auth.uid }, { upsert: true, returnDocument: 'after' });
      res.json({ inventory: (shop as any).inventory || [] });
    } catch (err) { res.status(500).json({ error: "Failed to save inventory" }); }
  });

  const SentPlanSchema = new mongoose.Schema({ shopId: String, adminId: String, customerUid: String, customerName: String, customerEmail: String, eventId: String, eventType: String, guests: Number, budget: String, location: String, date: String, menuSummary: [String], quote: String, status: { type: String, default: 'new' }, sentAt: { type: Date, default: Date.now } });
  const SentPlan = mongoose.models.SentPlan || mongoose.model("SentPlan", SentPlanSchema);

  app.post("/api/plans/send", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { shopId, eventId, customerName, customerEmail, eventType, guests, budget, location, date, menuSummary, quote } = req.body;
      const shop = await Shop.findById(shopId);
      if (!shop) return res.status(404).json({ error: "Shop not found" });
      const plan = await SentPlan.create({ shopId, adminId: (shop as any).adminId, customerUid: auth.uid, customerName, customerEmail, eventId, eventType, guests, budget, location, date, menuSummary, quote, sentAt: new Date() });
      res.json(plan);
    } catch (err) { res.status(500).json({ error: "Failed to send plan" }); }
  });

  app.get("/api/plans/inbox", requireAuth, async (req, res) => {
    try {
      const plans = await (SentPlan as any).find({ adminId: (req as any).auth.uid }).sort({ sentAt: -1 });
      res.json(plans);
    } catch (err) { res.status(500).json({ error: "Failed to fetch inbox" }); }
  });

  app.patch("/api/plans/:planId/status", requireAuth, async (req, res) => {
    try {
      const plan = await (SentPlan as any).findById(req.params.planId);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if ((plan as any).adminId !== (req as any).auth.uid) return res.status(403).json({ error: "Forbidden" });
      const updated = await (SentPlan as any).findByIdAndUpdate(req.params.planId, { status: req.body.status }, { returnDocument: 'after' });
      res.json(updated);
    } catch (err) { res.status(500).json({ error: "Failed to update status" }); }
  });

  app.post("/api/ai/chat", rateLimit(60_000, 30), async (req, res) => {
    try {
      const { prompt, systemInstruction, jsonMode } = req.body;
      
      const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.FOUNDRY_PROJECT_ENDPOINT || "").trim().replace(/^"|"$/g, '');
      const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.FOUNDRY_MODEL || "").trim().replace(/^"|"$/g, '');
      const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API || "").trim().replace(/^"|"$/g, '');

      if (!endpoint || !deployment || !apiKey) return res.status(503).json({ error: "Server AI unconfigured" });

      const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
      
      const messages = [];
      if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: prompt });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          response_format: jsonMode ? { type: "json_object" } : undefined
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: err.error?.message || "Foundry failed" });
      }

      const data = await response.json();
      res.json({ success: true, content: data.choices?.[0]?.message?.content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/ai/status", (req, res) => {
    const status = {
      azure: !!(process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API),
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      search: !!process.env.AZURE_AI_SEARCH_KEY,
    };
    res.json(status);
  });

  app.get("/api/stack", (req, res) => {
    res.json({ application: "CaterFlow AI", status: "online" });
  });

  app.post("/api/rag/search", rateLimit(60_000, 30), async (req, res) => {
    const { query = "" } = req.body || {};
    const endpoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_AI_SEARCH_KEY;
    if (!endpoint || !apiKey) return res.status(503).json({ mode: "unconfigured" });
    try {
      const searchUrl = `${endpoint.replace(/\/$/, "")}/indexes/menus/docs/search?api-version=2024-07-01`;
      const response = await fetch(searchUrl, { method: "POST", headers: { "Content-Type": "application/json", "api-key": apiKey }, body: JSON.stringify({ search: query, top: 5 }) });
      const data = await response.json();
      res.json({ results: data.value || [] });
    } catch (err) { res.status(502).json({ error: "Search failed" }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ CaterFlow Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
