
const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

if (!content.includes("/api/users/link-shop")) {
    const target = "app.post(\"/api/users\", requireAuth, async (req, res) => {";
    const replacement = `  // Link staff to shop via PIN
  app.post("/api/users/link-shop", requireAuth, async (req, res) => {
    try {
      const auth = req.auth;
      const { pin, staffInfo, name } = req.body;
      if (!pin) return res.status(400).json({ error: "PIN is required" });
      const shop = await require("mongoose").model("Shop").findOne({ pin: String(pin).trim() });
      if (!shop) return res.status(404).json({ error: "Invalid PIN. No shop found with this code." });
      
      const update = { shopId: String(shop._id), updatedAt: new Date() };
      if (staffInfo) update.staffInfo = staffInfo;
      if (name) update.name = name;
      
      const user = await require("mongoose").model("UserProfile").findOneAndUpdate(
        { uid: auth.uid }, 
        { $set: update }, 
        { upsert: true, returnDocument: "after" }
      );
      res.json({ success: true, shop: { _id: shop._id, name: shop.name, location: shop.location }, user });
    } catch (err) { res.status(500).json({ error: "Failed to link staff to shop" }); }
  });

  app.post("/api/users", requireAuth, async (req, res) => {`;
    content = content.replace(target, replacement);
}

if (!content.includes("shopId: String")) {
    content = content.replace(
        "role: { type: String, default: \"customer\" },",
        "role: { type: String, default: \"customer\" },\n    shopId: String,\n    staffInfo: String,"
    );
}

if (!content.includes("pin: { type: String, unique: true, sparse: true }")) {
    content = content.replace(
        "isActive: { type: Boolean, default: true },",
        "isActive: { type: Boolean, default: true },\n    pin: { type: String, unique: true, sparse: true },"
    );
}

fs.writeFileSync("server.ts", content);
console.log("Server patched.");

