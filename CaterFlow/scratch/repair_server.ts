import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/server.ts';
let content = fs.readFileSync(filePath, 'utf8');

const brokenPart = `        { ...req.body, adminId: (req as any).auth.uid },
        { upsert: true, new: true }
      );
      res.json(shop);`;

const correctPart = `      // Only owner or admin can delete
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
        { upsert: true, new: true }
      );
      res.json(shop);`;

if (content.includes(brokenPart)) {
    content = content.replace(brokenPart, correctPart);
    fs.writeFileSync(filePath, content);
    console.log("✓ Successfully repaired server.ts");
} else {
    console.log("✗ Could not find broken part. Checking alternative matching...");
    // Try matching without exact whitespace
    const lines = content.split('\n');
    const startLine = lines.findIndex(l => l.includes('{ ...req.body, adminId: (req as any).auth.uid },'));
    if (startLine !== -1) {
        lines.splice(startLine, 4, correctPart);
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log("✓ Successfully repaired server.ts using line index");
    } else {
        console.log("✗ Failed to locate broken part even with alternative matching.");
    }
}
