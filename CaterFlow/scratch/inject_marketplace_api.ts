import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// New Chat and Discovery Endpoints
const newEndpoints = `
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
`;

// Find a good place to inject - after the existing shop routes
const anchor = 'app.get("/api/shops/my/inventory"';
if (content.includes(anchor)) {
    content = content.replace(anchor, newEndpoints + "\n  " + anchor);
} else {
    // Fallback if anchor not found
    content = content.replace('app.get("/api/health"', newEndpoints + "\n  " + 'app.get("/api/health"');
}

fs.writeFileSync(filePath, content);
console.log("✓ Successfully injected Marketplace Chat and Discovery endpoints");
