import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

console.log("Connecting to MongoDB Atlas...");
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("✓ Connected to MongoDB");
    
    const EventSchema = new mongoose.Schema({
      userId: String,
      title: String,
      rawInput: String,
      messages: Array,
      eventData: Object,
      steps: Array,
      createdAt: Date,
      updatedAt: Date
    });

    const Event = mongoose.model("Event", EventSchema);
    
    const count = await Event.countDocuments({});
    console.log(`Total events/conversations in DB: ${count}`);
    
    const events = await Event.find({}).limit(5);
    console.log("Sample events:", events.map(e => ({
      id: e._id,
      userId: e.userId,
      title: e.title,
      rawInput: e.rawInput,
      messageCount: e.messages?.length
    })));
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error("✗ Connection error:", err);
    process.exit(1);
  });
