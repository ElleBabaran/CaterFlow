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
  app.use(express.json({ limit: '10mb' })); // Set size limit
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  console.log("Starting CaterFlow Server...");

  // MongoDB Connection with proper error handling and reconnection
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

  // Handle connection events
  mongoose.connection.on('disconnected', () => {
    console.warn("⚠️  MongoDB disconnected, attempting to reconnect...");
    setTimeout(() => {
      mongoose.connect(MONGODB_URI, mongooseOptions).catch(err => 
        console.error("Reconnection failed:", err.message)
      );
    }, 5000);
  });

  mongoose.connection.on('error', (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  const EventSchema = new mongoose.Schema({
    userId: String,
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
    createdAt: { type: Date, default: Date.now }
  });
  const Shop = mongoose.model("Shop", ShopSchema);

  const ChatSchema = new mongoose.Schema({
    eventId: String,
    participants: [String],
    messages: [{
      senderId: String,
      text: String,
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
      
      // SECURITY: Only trust uid from decoded token, NEVER from request body/params
      const uid = decoded?.user_id || decoded?.sub || decoded?.uid;
      if (!uid) return null;
      
      const profile = await UserProfile.findOne({ uid });
      return {
        uid,
        role: profile?.role || "customer",
        profile,
      };
    } catch (err) {
      return null;
    }
  }

  async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ctx = await authContext(req);
    if (!ctx?.uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as any).auth = ctx;
    next();
  }

  function requireOwnerOrAdmin(getResourceOwner: (req: express.Request) => string | undefined) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const auth = (req as any).auth;
      const owner = getResourceOwner(req);
      if (!auth?.uid || !owner) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      if (auth.role === "admin" || auth.uid === owner) {
        next();
        return;
      }
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
        next();
        return;
      }

      record.count += 1;
      if (record.count > maxRequests) {
        res.status(429).json({ error: "Too many requests" });
        return;
      }

      next();
    };
  }

  function pickEventUpdates(body: any) {
    return {
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
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { email, name, role, photoURL } = req.body;
      const uid = auth.uid; // SECURITY: Use authenticated uid, NOT request body
      
      if (!uid || !email || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (!/^[^\@\s]+@[^\@\s]+\.[^\@\s]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: "Name too long" });
      }
      
      const update: any = { 
        email, 
        name, 
        photoURL,
        updatedAt: new Date()
      };
      
      // During development/signup, allow setting the role if provided
      if (role) update.role = role;

      const user = await UserProfile.findOneAndUpdate(
        { uid },
        { $set: update },
        { upsert: true, returnDocument: 'after' }
      );
      res.json(user);
    } catch (err) {
      console.error("Error saving user:", err);
      res.status(500).json({ error: "Failed to save user profile" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });

  function parseAiJson(text: string) {
    const cleaned = String(text || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
      throw new Error("AI response was not valid JSON");
    }
  }

  function normalizeMenuPlan(plan: any) {
    const menu = Array.isArray(plan?.menu) ? plan.menu : [];
    if (!menu.length) throw new Error("AI returned no menu recommendations");

    return {
      customer: plan.customer || {},
      knowledge: plan.knowledge || { mode: "ai_only" },
      dietary: plan.dietary || {},
      weather: plan.weather || {},
      menu: {
        dietary_compliance: plan.menu_summary?.dietary_compliance || plan.dietary?.summary || "",
        cultural_adaptation: plan.menu_summary?.cultural_adaptation || "",
        nutrition_summary: plan.menu_summary?.nutrition_summary || {},
        menu: menu.map((item: any, index: number) => ({
          id: item.id || `ai-item-${index + 1}`,
          dish: String(item.dish || item.name || "").trim(),
          description: String(item.description || "").trim(),
          category: String(item.category || item.type || "Chef recommendation").trim(),
          price: String(item.price || item.estimated_price || "").trim(),
          portion_per_guest: String(item.portion_per_guest || item.portion || "").trim(),
          ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(String) : [],
          reasoning: String(item.reasoning || item.reason || "").trim(),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          allergens: Array.isArray(item.allergens) ? item.allergens.map(String) : [],
          dietary_compliance: String(item.dietary_compliance || "").trim(),
          image_url: String(item.image_url || "").trim(),
        })).filter((item: any) => item.dish),
      },
      inventory: plan.inventory || { procurement_list: [] },
      suppliers: plan.suppliers || { supplier_matches: [], catering_shop_recommendations: [] },
      logistics: plan.logistics || {},
      pricing: plan.pricing || {},
      monitoring: plan.monitoring || {},
    };
  }

  app.post("/api/ai/orchestrate", rateLimit(60_000, 12), async (req, res) => {
    const { prompt = "" } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 6000) {
      return res.status(400).json({ error: "Invalid planning prompt" });
    }

    const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.FOUNDRY_PROJECT_ENDPOINT || "").trim().replace(/^"|"$/g, '');
    const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.FOUNDRY_MODEL || "").trim().replace(/^"|"$/g, '');
    const apiVersion = (process.env.AZURE_OPENAI_API_VERSION || process.env.FOUNDRY_API_VERSION || "2024-10-21").trim().replace(/^"|"$/g, '');
    const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API || "").trim().replace(/^"|"$/g, '');

    console.log("[DEBUG] AI Config Check:", { 
      endpoint: !!endpoint, 
      deployment: !!deployment, 
      apiKey: !!apiKey,
      raw_foundry_api: !!process.env.FOUNDRY_API 
    });

    if (!endpoint || !deployment || !apiKey) {
      return res.status(503).json({
        error: "Azure AI Foundry/OpenAI is not configured",
        details: {
          endpointConfigured: Boolean(endpoint),
          deploymentConfigured: Boolean(deployment),
          apiVersion,
          apiKeyConfigured: Boolean(apiKey),
        },
      });
    }

    const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
    const systemPrompt = [
      "You are CaterFlow's production food recommendation engine.",
      "Generate original, contextual catering recommendations from the user's brief only.",
      "Do not use fixed examples, fallback menus, mock data, repeated canned dishes, or placeholder food names.",
      "Return JSON only. Include unique menu cards with dish, category (must be 'meal', 'beverage', or 'dessert'), price, ingredients, reasoning, tags, allergens, portion_per_guest, and optional image_url.",
      "Ensure a balanced mix of meals, beverages, and desserts suitable for the theme.",
      "If the brief is incomplete, make reasonable AI assumptions and disclose them in monitoring.assumptions.",
    ].join(" ");

    try {
      const aiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Create a complete catering plan for this brief: ${prompt}

JSON shape:
{
  "customer": {"event_type":"","guests":0,"budget":"","location":"","date":"","cuisine_preference":"","service_style":""},
  "knowledge": {"mode":"azure_openai_ai_only","notes":[]},
  "dietary": {"allergens_to_avoid":[],"recommended_labels":[],"safety_controls":[],"summary":""},
  "weather": {"summary":"","risk_level":"","recommendations":[]},
  "menu_summary": {"dietary_compliance":"","cultural_adaptation":"","nutrition_summary":{}},
  "menu": [{"dish":"","description":"","category":"","price":"","portion_per_guest":"","ingredients":[],"reasoning":"","tags":[],"allergens":[],"dietary_compliance":"","image_url":""}],
  "inventory": {"procurement_list":[{"item":"","qty":"","source_category":""}],"procurement_weight_kg":0,"potential_shortages":[],"food_safety_notes":[]},
  "suppliers": {"supplier_matches":[],"catering_shop_recommendations":[],"optimization_strategy":""},
  "logistics": {"timeline":[{"time":"","activity":""}],"staffing_needs":"","equipment_list":[],"transport_plan":""},
  "pricing": {"optimized_quote":"","cost_breakdown":[],"margin_strategy":"","menu_item_counts":{}},
  "monitoring": {"execution_readiness":0,"quality_checks":[],"assumptions":[],"final_summary":""}
}`,
            },
          ],
          temperature: 0.9,
          top_p: 0.95,
          response_format: { type: "json_object" },
        }),
      });

      const raw = await aiResponse.text();
      console.log("--------------------------------------------------");
      console.log("[Azure AI Foundry RAW Payload Received]");
      console.log(raw);
      console.log("--------------------------------------------------");

      if (!aiResponse.ok) {
        return res.status(502).json({ error: "Azure AI request failed", details: raw });
      }

      const envelope = JSON.parse(raw);
      const content = envelope?.choices?.[0]?.message?.content;
      const plan = normalizeMenuPlan(parseAiJson(content));
      res.json({
        success: true,
        provider: "azure_openai",
        deployment,
        apiVersion,
        data: plan,
      });
    } catch (err: any) {
      console.error("[Azure AI Orchestration Error]", err?.message || err);
      res.status(502).json({ error: "Failed to generate AI recommendations", details: err?.message || String(err) });
    }
  });

  // ── Single Item Regeneration Endpoint ──────────────────────────────────
  app.post("/api/ai/regenerate-item", rateLimit(60_000, 20), async (req, res) => {
    try {
      const { currentItem, context } = req.body || {};
      
      const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.FOUNDRY_PROJECT_ENDPOINT || "").trim().replace(/^"|"$/g, '');
      const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.FOUNDRY_MODEL || "").trim().replace(/^"|"$/g, '');
      const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY || process.env.FOUNDRY_API || "").trim().replace(/^"|"$/g, '');

      if (!endpoint || !deployment || !apiKey) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
      
      const prompt = `System: You are an expert catering chef. 
      Context: The user is planning a ${context?.theme || 'General'} event for ${context?.guests || 10} guests in ${context?.location || 'Manila'}.
      Current Item to replace: ${JSON.stringify(currentItem)}
      Task: Provide ONE alternative dish that fits the same category (${currentItem?.category || 'meal'}) but is different and better.
      Return ONE JSON object matching the menu card schema: dish, category, price, ingredients, reasoning, tags, allergens, portion_per_guest, image_url.
      No markdown, no preamble.`;

      const aiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          response_format: { type: "json_object" }
        })
      });

      const result = await aiResponse.json();
      res.json({ success: true, newItem });
    } catch (err) {
      console.error("Regeneration failed:", err);
      res.status(500).json({ error: "Failed to regenerate item" });
    }
  });

  app.get("/api/events/user/:userId", requireAuth, requireOwnerOrAdmin((req) => req.params.userId), async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId || typeof userId !== 'string' || userId.length > 128) {
        return res.status(400).json({ error: "Invalid userId" });
      }
      
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Cap at 100
      const skip = Math.min(parseInt(req.query.skip as string) || 0, 10000);
      
      const events = await Event.find({ userId }).sort({ updatedAt: -1 }).limit(limit).skip(skip);
      const total = await Event.countDocuments({ userId });
      
      res.json({ events, total, limit, skip });
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { userId, type, rawInput, messages, eventData, steps } = req.body;
      
      // SECURITY: Validate userId matches authenticated user
      if (userId !== auth.uid) {
        return res.status(403).json({ error: "Cannot create event for different user" });
      }
      
      // Validate required fields
      if (!userId || !type) {
        return res.status(400).json({ error: "Missing required fields: userId, type" });
      }
      
      // Validate size to prevent DOS
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 5 * 1024 * 1024) { // 5MB limit
        return res.status(413).json({ error: "Request too large" });
      }
      
      const newEvent = new Event({
        userId,
        type,
        rawInput: String(rawInput || "").substring(0, 5000),
        messages: messages || [],
        eventData: eventData || {},
        steps: steps || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newEvent.save();
      res.json(newEvent);
    } catch (err) {
      console.error("Error saving event:", err);
      res.status(500).json({ error: "Failed to save event" });
    }
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const eventId = req.params.id;
      
      if (!eventId || !/^[a-f0-9]{24}$/.test(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const existing = await Event.findById(eventId);
      if (!existing) return res.status(404).json({ error: "Event not found" });
      
      // Only owner or admin can update
      if (auth.role !== "admin" && auth.uid !== existing.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 5 * 1024 * 1024) {
        return res.status(413).json({ error: "Request too large" });
      }
      
      const update = Object.fromEntries(
        Object.entries(pickEventUpdates(req.body)).filter(([, value]) => value !== undefined)
      );

      const updated = await Event.findByIdAndUpdate(eventId,
        { $set: update },
        { returnDocument: 'after' }
      );
      res.json(updated);
    } catch (err) {
      console.error("Error updating event:", err);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const eventId = req.params.id;
      
      if (!eventId || !/^[a-f0-9]{24}$/.test(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const existing = await Event.findById(eventId);
      if (!existing) return res.status(404).json({ error: "Event not found" });
      
      // Only owner or admin can delete
      if (auth.role !== "admin" && auth.uid !== existing.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await Event.findByIdAndDelete(eventId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting event:", err);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.get("/api/shops", async (req, res) => {
    try {
      const shops = await Shop.find();
      res.json(shops);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch shops" });
    }
  });

  app.post("/api/shops", requireAuth, async (req, res) => {
    try {
      const shop = await Shop.findOneAndUpdate(
        { adminId: (req as any).auth.uid },
        { ...req.body, adminId: (req as any).auth.uid },
        { upsert: true, returnDocument: 'after' }
      );
      res.json(shop);
    } catch (err) {
      res.status(500).json({ error: "Failed to save shop" });
    }
  });

  // Shop Inventory endpoints
  
  // Enhanced Shop Discovery
  app.get("/api/shops/discovery", async (req, res) => {
    try {
      const { location, budget, guests } = req.query;
      let query: any = { isActive: true };
      
      // Basic location filtering if location string is provided
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      
      // In a real app, we'd use GeoJSON for distance, but here we filter by city/name
      const shops = await Shop.find(query).limit(10);
      res.json(shops);
    } catch (err) {
      res.status(500).json({ error: "Discovery failed" });
    }
  });

  app.get("/api/shops/:id", async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) return res.status(404).json({ error: "Shop not found" });
      res.json(shop);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch shop details" });
    }
  });

  // Real-time Marketplace Chat
  app.get("/api/chat/:eventId", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const chat = await Chat.findOne({ 
        eventId: req.params.eventId,
        participants: auth.uid 
      });
      res.json(chat || { messages: [] });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.post("/api/chat/send", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { eventId, text, type, attachment, shopId } = req.body;
      
      let chat = await Chat.findOne({ eventId });
      
      if (!chat) {
        // Create new chat if it doesn't exist
        const participants = [auth.uid];
        if (shopId) {
          const shop = await Shop.findById(shopId);
          if (shop) participants.push(shop.adminId);
        }
        
        chat = new Chat({
          eventId,
          customerId: auth.uid,
          shopId,
          participants,
          messages: []
        });
      }

      const newMessage = {
        senderId: auth.uid,
        role: auth.role,
        text,
        type: type || 'text',
        attachment: attachment || null,
        timestamp: new Date()
      };

      chat.messages.push(newMessage);
      chat.updatedAt = new Date();
      await chat.save();
      
      res.json(chat);
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/events/:id/save-prompt", requireAuth, async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      // Logic to permanently lock or tag the event as 'saved'
      event.type = 'saved_plan';
      await event.save();
      res.json({ success: true, event });
    } catch (err) {
      res.status(500).json({ error: "Failed to save conversation" });
    }
  });

  app.get("/api/shops/my/inventory", requireAuth, async (req, res) => {
    try {
      const shop = await Shop.findOne({ adminId: (req as any).auth.uid });
      if (!shop) return res.json({ inventory: [] });
      res.json({ inventory: (shop as any).inventory || [] });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/shops/my/inventory", requireAuth, async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ error: "items must be an array" });
      const shop = await Shop.findOneAndUpdate(
        { adminId: (req as any).auth.uid },
        { inventory: items, adminId: (req as any).auth.uid },
        { upsert: true, returnDocument: 'after' }
      );
      res.json({ inventory: (shop as any).inventory || [] });
    } catch (err) {
      res.status(500).json({ error: "Failed to save inventory" });
    }
  });

  // Plans sent to a shop (Admin Inbox)
  const SentPlanSchema = new mongoose.Schema({
    shopId: String,
    adminId: String,
    customerUid: String,
    customerName: String,
    customerEmail: String,
    eventId: String,
    eventType: String,
    guests: Number,
    budget: String,
    location: String,
    date: String,
    menuSummary: [String],
    quote: String,
    status: { type: String, default: 'new' }, // new | viewed | accepted | declined
    sentAt: { type: Date, default: Date.now },
  });
  const SentPlan: any = mongoose.models.SentPlan || mongoose.model("SentPlan", SentPlanSchema);

  // Customer sends their plan to a shop
  app.post("/api/plans/send", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const { shopId, eventId, customerName, customerEmail, eventType, guests, budget, location, date, menuSummary, quote } = req.body;
      if (!shopId) return res.status(400).json({ error: "shopId is required" });

      const shop = await Shop.findById(shopId);
      if (!shop) return res.status(404).json({ error: "Shop not found" });

      const plan = await SentPlan.create({
        shopId,
        adminId: (shop as any).adminId,
        customerUid: auth.uid,
        customerName: customerName || auth.uid,
        customerEmail: customerEmail || '',
        eventId,
        eventType: eventType || 'Event',
        guests: guests || 0,
        budget: budget || '',
        location: location || '',
        date: date || '',
        menuSummary: menuSummary || [],
        quote: quote || '',
        status: 'new',
        sentAt: new Date(),
      });
      res.json(plan);
    } catch (err) {
      console.error("Error sending plan:", err);
      res.status(500).json({ error: "Failed to send plan to shop" });
    }
  });

  // Admin fetches their inbox (plans sent to their shop)
  app.get("/api/plans/inbox", requireAuth, async (req, res) => {
    try {
      const plans = await SentPlan.find({ adminId: (req as any).auth.uid }).sort({ sentAt: -1 });
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  // Update plan status (accept / decline / viewed)
  app.patch("/api/plans/:planId/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['new','viewed','accepted','declined'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const plan = await SentPlan.findById(req.params.planId);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if ((plan as any).adminId !== (req as any).auth.uid) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const updated = await SentPlan.findByIdAndUpdate(req.params.planId, { status }, { returnDocument: 'after' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update plan status" });
    }
  });


  app.get("/api/chats/:eventId", requireAuth, async (req, res) => {
    try {
      const auth = (req as any).auth;
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (auth.role !== "admin" && auth.uid !== event.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const chat = await Chat.findOne({ eventId: req.params.eventId });
      res.json(chat || { eventId: req.params.eventId, participants: [event.userId], messages: [] });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.post("/api/chats/:eventId/messages", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;
      const senderId = (req as any).auth.uid;
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if ((req as any).auth.role !== "admin" && senderId !== event.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (typeof text !== "string" || !text.trim() || text.length > 2000) {
        return res.status(400).json({ error: "Invalid message text" });
      }

      const chat = await Chat.findOneAndUpdate(
        { eventId: req.params.eventId },
        {
          $setOnInsert: { participants: [event.userId] },
          $push: { messages: { senderId, text: text.trim(), timestamp: Date.now() } },
        },
        { upsert: true, returnDocument: 'after' }
      );
      res.json(chat);
    } catch (err) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/stack", (req, res) => {
    res.json({
      application: "CaterFlow AI - AI-Powered Multi-Agent System for Smart Catering Operations",
      requiredStack: {
        microsoftAgentFramework: {
          status: "implemented",
          files: [
            "microsoft-agent-framework/catering_workflow.py",
            "microsoft-agent-framework/agents.py",
            "microsoft-agent-framework/memory.py",
            "microsoft-agent-framework/database.py",
            "microsoft-agent-framework/main.py",
          ],
          purpose: "Multi-agent orchestration blueprint with shared memory and CaterFlow agent roles.",
        },
        microsoftFoundry: {
          status: process.env.FOUNDRY_PROJECT_ENDPOINT ? "configured" : "credential_required",
          endpointConfigured: Boolean(process.env.FOUNDRY_PROJECT_ENDPOINT),
          model: process.env.FOUNDRY_MODEL || "gpt-5.4-mini",
          purpose: "FoundryChatClient path for running the Microsoft Agent Framework workflow.",
        },
        azureAiSearch: {
          status: process.env.AZURE_AI_SEARCH_ENDPOINT && process.env.AZURE_AI_SEARCH_KEY ? "configured" : "credential_required",
          indexes: process.env.AZURE_AI_SEARCH_INDEX ? [process.env.AZURE_AI_SEARCH_INDEX] : ["menus", "suppliers"],
          purpose: "RAG retrieval for menu playbooks and supplier/catering-shop context.",
        },
      },
      activeRuntime: process.env.AZURE_OPENAI_API_KEY || process.env.FOUNDRY_API_KEY ? "Azure AI Runtime Configured" : "Azure AI Credentials Required",
    });
  });

  app.post("/api/rag/search", rateLimit(60_000, 30), async (req, res) => {
    const { query = "", indexes = ["menus", "suppliers"] } = req.body || {};
    const endpoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
    const configuredIndex = process.env.AZURE_AI_SEARCH_INDEX;
    const apiKey = process.env.AZURE_AI_SEARCH_KEY;

    if (!endpoint || !apiKey) {
      res.status(503).json({
        mode: "azure_ai_search_unconfigured",
        message: "Azure AI Search is not configured.",
        query,
      });
      return;
    }

    try {
      console.log(`[RAG] Searching Azure indexes for: "${query}"`);
      const requestedIndexes = configuredIndex ? [configuredIndex] : indexes;
      const results = await Promise.all(requestedIndexes.map(async (index: string) => {
        const searchUrl = `${endpoint.replace(/\/$/, "")}/indexes/${index}/docs/search?api-version=2024-07-01`;
        const searchResponse = await fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            search: query,
            top: 5,
          }),
        });

        if (!searchResponse.ok) {
          console.error(`[Azure Search] Index ${index} failed: ${searchResponse.status}`);
          throw new Error(`Azure AI Search index ${index} returned ${searchResponse.status}`);
        }

        const data = await searchResponse.json();
        console.log(`[Azure Search] Index ${index} returned ${data.value?.length || 0} results`);
        return (data.value || []).map((item: any) => ({ ...item, index }));
      }));

      const finalResults = results.flat();
      console.log(`[RAG] Total Azure results: ${finalResults.length}`);
      res.json({ mode: "azure_ai_search", results: finalResults });
    } catch (error: any) {
      console.error(`[RAG Error] ${error?.message}`);
      res.status(502).json({
        mode: "azure_ai_search_error",
        message: error?.message || "Azure AI Search request failed",
      });
    }
  });

  app.post("/api/foundry/orchestrate", requireAuth, rateLimit(60_000, 10), async (req, res) => {
    const { request = "" } = req.body || {};
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFilePromise = promisify(execFile);

    if (typeof request !== "string" || !request.trim() || request.length > 5000) {
      return res.status(400).json({ error: "Invalid orchestration request" });
    }

    console.log(`[Foundry] Orchestrating with Python Framework: "${request.substring(0, 50)}..."`);

    try {
      const scriptPath = path.join(process.cwd(), "microsoft-agent-framework", "main.py");
      const { stdout, stderr } = await execFilePromise("python", [scriptPath, request], {
        cwd: process.cwd(),
        timeout: 60_000,
        maxBuffer: 1024 * 1024,
      });

      if (stderr && !stdout) {
        console.error(`[Foundry Error] ${stderr}`);
        return res.status(500).json({ error: "Foundry Agent Framework failed", details: stderr });
      }

      const blueprint = JSON.parse(stdout);
      res.json(blueprint);
    } catch (err: any) {
      console.error(`[Foundry Fatal] ${err.message}`);
      res.status(500).json({ error: "Failed to connect to Foundry Python Runtime", details: err.message });
    }
  });

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

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ CaterFlow Server running on http://0.0.0.0:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n⏹️  Graceful shutdown initiated...");
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log("✓ MongoDB connection closed");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
