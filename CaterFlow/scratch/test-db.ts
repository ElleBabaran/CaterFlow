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
    
    // Define UserSchema
    const UserSchema = new mongoose.Schema({
      uid: String,
      email: String,
      name: String,
      role: String,
      createdAt: Date,
      updatedAt: Date
    });

    const UserProfile = mongoose.model("UserProfile", UserSchema);
    
    const count = await UserProfile.countDocuments({});
    console.log(`Total user profiles in DB: ${count}`);
    
    const users = await UserProfile.find({}).limit(5);
    console.log("Sample users:", users);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error("✗ Connection error:", err);
    process.exit(1);
  });
