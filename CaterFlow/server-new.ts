import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import cors from 'cors';

import { loadConfig } from './src/server/config';
import { Logger } from './src/server/logger';
import { requireAuth, validateRequest, rateLimit, errorHandler, requestLogger } from './src/server/middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger('server');

async function startServer() {
  try {
    const config = loadConfig();
    const app = express();

    // Middleware setup
    app.use(cors());
    app.use(express.json({ limit: '10mb' })); // Prevent DoS with size limit
    app.use(requestLogger());
    app.use(rateLimit({ windowMs: 60000, maxRequests: 100 })); // 100 requests per minute

    logger.info('Starting CaterFlow Server...', { port: config.port });

    // Connect to MongoDB with retry logic
    let mongoConnected = false;
    let retries = 0;
    const maxRetries = 5;

    while (!mongoConnected && retries < maxRetries) {
      try {
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        mongoConnected = true;
        logger.info('Connected to MongoDB');
      } catch (err) {
        retries++;
        if (retries < maxRetries) {
          logger.warn(`MongoDB connection failed, retry ${retries}/${maxRetries}...`, { error: (err as any)?.message });
          await new Promise((resolve) => setTimeout(resolve, 2000 * retries)); // Exponential backoff
        }
      }
    }

    if (!mongoConnected) {
      throw new Error('Failed to connect to MongoDB after ' + maxRetries + ' retries');
    }

    // Mongoose Schemas (consolidated - single database)
    const EventSchema = new mongoose.Schema({
      userId: { type: String, required: true, index: true },
      rawInput: String,
      messages: Array,
      eventData: Object,
      steps: Array,
      qIndex: Number,
      type: { type: String, default: 'plan' },
      createdAt: { type: Date, default: Date.now, index: true },
      updatedAt: { type: Date, default: Date.now },
    });

    const UserSchema = new mongoose.Schema({
      uid: { type: String, unique: true, required: true, index: true },
      email: { type: String, unique: true, sparse: true },
      name: String,
      photoURL: String,
      role: { type: String, default: 'customer', enum: ['customer', 'admin', 'staff'] },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    const ShopSchema = new mongoose.Schema({
      adminId: { type: String, required: true, index: true },
      name: String,
      location: String,
      coordinates: { lat: Number, lng: Number },
      specialties: String,
      baseQuote: Number,
      createdAt: { type: Date, default: Date.now },
    });

    const ChatSchema = new mongoose.Schema({
      eventId: { type: String, required: true, index: true },
      participants: [String],
      messages: [
        {
          senderId: String,
          text: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      status: { type: String, default: 'open' },
    });

    // Apply indexes
    EventSchema.index({ userId: 1, createdAt: -1 });
    UserSchema.index({ role: 1 });
    ShopSchema.index({ adminId: 1 });

    const Event = mongoose.model('Event', EventSchema);
    const UserProfile = mongoose.model('UserProfile', UserSchema);
    const Shop = mongoose.model('Shop', ShopSchema);
    const Chat = mongoose.model('Chat', ChatSchema);

    // API Routes

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Stack endpoint (for hackathon compliance)
    app.get('/api/stack', (req, res) => {
      res.json({
        application: 'CaterFlow AI - AI-Powered Multi-Agent Catering Operations',
        requiredStack: {
          microsoftAgentFramework: {
            status: 'implemented',
            files: [
              'microsoft-agent-framework/catering_workflow.py',
              'microsoft-agent-framework/agents.py',
              'microsoft-agent-framework/memory.py',
              'microsoft-agent-framework/database.py',
              'microsoft-agent-framework/main.py',
            ],
            purpose: 'Multi-agent orchestration blueprint with shared memory',
          },
          microsoftFoundry: {
            status: config.foundryProjectEndpoint ? 'configured' : 'credential_required',
            endpointConfigured: Boolean(config.foundryProjectEndpoint),
            model: config.foundryModel,
            purpose: 'FoundryChatClient for running Microsoft Agent Framework workflow',
          },
          azureAiSearch: {
            status: config.azureAiSearchEndpoint && config.azureAiSearchKey ? 'configured' : 'local_fallback',
            indexes: config.azureAiSearchIndex ? [config.azureAiSearchIndex] : ['menus', 'suppliers'],
            purpose: 'RAG retrieval for menu playbooks and supplier context',
          },
        },
        activeRuntime: config.geminiApiKey ? 'Cloud AI Runtime Configured' : 'Local Deterministic Fallback',
      });
    });

    // Gemini API proxy endpoint (backend keeps the key secure)
    app.post('/api/ai/generate', requireAuth, validateRequest({ body: { prompt: 'string' } }), async (req, res) => {
      try {
        if (!config.geminiApiKey) {
          return res.status(503).json({ error: 'AI service not configured' });
        }

        const { prompt } = req.body;

        if (typeof prompt !== 'string' || prompt.trim().length === 0) {
          return res.status(400).json({ error: 'Invalid prompt' });
        }

        // Call Gemini API (or your LLM)
        // This is a placeholder - implement actual LLM call here
        res.json({
          result: 'Mock AI response - configure your LLM endpoint',
          model: 'gemini-3-flash-preview',
        });
      } catch (error) {
        logger.error('AI generation error', { error });
        res.status(500).json({ error: 'Failed to generate response' });
      }
    });

    // User endpoints
    app.get('/api/users/:uid', requireAuth, validateRequest({ params: { uid: 'string' } }), async (req, res) => {
      try {
        const { uid } = req.params;
        const auth = (req as any).auth;

        // User can only read their own profile unless admin
        if (auth.uid !== uid && auth.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const user = await UserProfile.findOne({ uid });
        res.json(user);
      } catch (err) {
        logger.error('Failed to fetch user', { error: err });
        res.status(500).json({ error: 'Failed to fetch user profile' });
      }
    });

    app.post(
      '/api/users',
      requireAuth,
      validateRequest({ body: { uid: 'string', email: 'string', name: 'string' } }),
      async (req, res) => {
        try {
          const { uid, email, name, role } = req.body;
          const auth = (req as any).auth;

          // Prevent users from creating profiles for other users
          if (auth.uid !== uid && auth.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
          }

          const user = await UserProfile.findOneAndUpdate(
            { uid },
            {
              email,
              name,
              $setOnInsert: { role: role || 'customer' },
              updatedAt: Date.now(),
            },
            { upsert: true, new: true }
          );
          res.json(user);
        } catch (err) {
          logger.error('Failed to save user', { error: err });
          res.status(500).json({ error: 'Failed to save user profile' });
        }
      }
    );

    // Events endpoints
    app.get('/api/events/user/:userId', requireAuth, validateRequest({ params: { userId: 'string' } }), async (req, res) => {
      try {
        const { userId } = req.params;
        const auth = (req as any).auth;

        if (auth.uid !== userId && auth.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Pagination to prevent memory bomb
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
        const skip = (page - 1) * limit;

        const events = await Event.find({ userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await Event.countDocuments({ userId });

        res.json({ events, pagination: { page, limit, total } });
      } catch (err) {
        logger.error('Failed to fetch events', { error: err });
        res.status(500).json({ error: 'Failed to fetch events' });
      }
    });

    app.post(
      '/api/events',
      requireAuth,
      validateRequest({ body: { userId: 'string' } }),
      async (req, res) => {
        try {
          const { userId, ...eventData } = req.body;
          const auth = (req as any).auth;

          if (auth.uid !== userId && auth.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
          }

          const newEvent = new Event({ userId, ...eventData });
          await newEvent.save();
          res.status(201).json(newEvent);
        } catch (err) {
          logger.error('Failed to save event', { error: err });
          res.status(500).json({ error: 'Failed to save event' });
        }
      }
    );

    app.put('/api/events/:id', requireAuth, validateRequest({ params: { id: 'string' } }), async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).auth;

        const existing = await Event.findById(id);
        if (!existing) return res.status(404).json({ error: 'Event not found' });

        // Authorization check
        if (auth.uid !== existing.userId && auth.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const updated = await Event.findByIdAndUpdate(
          id,
          { ...req.body, updatedAt: Date.now() },
          { new: true }
        );
        res.json(updated);
      } catch (err) {
        logger.error('Failed to update event', { error: err });
        res.status(500).json({ error: 'Failed to update event' });
      }
    });

    app.delete('/api/events/:id', requireAuth, validateRequest({ params: { id: 'string' } }), async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).auth;

        const existing = await Event.findById(id);
        if (!existing) return res.status(404).json({ error: 'Event not found' });

        if (auth.uid !== existing.userId && auth.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }

        await Event.findByIdAndDelete(id);
        res.json({ success: true });
      } catch (err) {
        logger.error('Failed to delete event', { error: err });
        res.status(500).json({ error: 'Failed to delete event' });
      }
    });

    // Shops endpoints
    app.get('/api/shops', rateLimit({ windowMs: 60000, maxRequests: 200 }), async (req, res) => {
      try {
        const shops = await Shop.find().limit(100); // Prevent fetching all shops
        res.json(shops);
      } catch (err) {
        logger.error('Failed to fetch shops', { error: err });
        res.status(500).json({ error: 'Failed to fetch shops' });
      }
    });

    app.post(
      '/api/shops',
      requireAuth,
      validateRequest({ body: { name: 'string', location: 'string' } }),
      async (req, res) => {
        try {
          const auth = (req as any).auth;
          const shop = await Shop.findOneAndUpdate(
            { adminId: auth.uid },
            { ...req.body, adminId: auth.uid },
            { upsert: true, new: true }
          );
          res.json(shop);
        } catch (err) {
          logger.error('Failed to save shop', { error: err });
          res.status(500).json({ error: 'Failed to save shop' });
        }
      }
    );

    // Chat endpoints
    app.get('/api/chats/:eventId', requireAuth, validateRequest({ params: { eventId: 'string' } }), async (req, res) => {
      try {
        const { eventId } = req.params;
        const chat = await Chat.findOne({ eventId });
        res.json(chat || { eventId, messages: [] });
      } catch (err) {
        logger.error('Failed to fetch chat', { error: err });
        res.status(500).json({ error: 'Failed to fetch chat' });
      }
    });

    app.post(
      '/api/chats/:eventId/messages',
      requireAuth,
      validateRequest({ body: { text: 'string' }, params: { eventId: 'string' } }),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const { text } = req.body;
          const senderId = (req as any).auth.uid;

          const chat = await Chat.findOneAndUpdate(
            { eventId },
            { $push: { messages: { senderId, text, timestamp: new Date() } } },
            { upsert: true, new: true }
          );
          res.json(chat);
        } catch (err) {
          logger.error('Failed to send message', { error: err });
          res.status(500).json({ error: 'Failed to send message' });
        }
      }
    );

    // Serve Vite client
    if (config.nodeEnv === 'development') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    // Error handling (must be last)
    app.use(errorHandler);

    // Start server with graceful shutdown
    const server = app.listen(config.port, () => {
      logger.info(`✓ Server running on http://localhost:${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
