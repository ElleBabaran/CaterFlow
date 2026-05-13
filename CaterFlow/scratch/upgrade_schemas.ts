import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update ShopSchema
const oldShopSchema = `  const ShopSchema = new mongoose.Schema({
    adminId: String,
    name: String,
    location: String,
    coordinates: { lat: Number, lng: Number },
    specialties: String,
    baseQuote: Number,
    createdAt: { type: Date, default: Date.now }
  });`;

const newShopSchema = `  const ShopSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    logo: String,
    banner: String,
    location: String,
    coordinates: { lat: Number, lng: Number },
    specialties: [String],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    contactInfo: {
      phone: String,
      email: String,
      facebook: String,
      address: String
    },
    menuPackages: [{
      name: String,
      price: Number,
      items: [String],
      image: String
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  });`;

if (content.includes(oldShopSchema)) {
    content = content.replace(oldShopSchema, newShopSchema);
}

// 2. Update ChatSchema
const oldChatSchema = `  const ChatSchema = new mongoose.Schema({
    eventId: String,
    participants: [String],
    messages: [{
      senderId: String,
      text: String,
      timestamp: { type: Date, default: Date.now }
    }],
    status: { type: String, default: 'open' }
  });`;

const newChatSchema = `  const ChatSchema = new mongoose.Schema({
    eventId: String,
    customerId: String,
    shopId: String,
    participants: [String],
    messages: [{
      senderId: String,
      role: String, // 'customer' or 'admin'
      text: String,
      type: { type: String, default: 'text' }, // 'text', 'receipt', 'quote'
      attachment: Object,
      timestamp: { type: Date, default: Date.now }
    }],
    status: { type: String, default: 'open' },
    updatedAt: { type: Date, default: Date.now }
  });`;

if (content.includes(oldChatSchema)) {
    content = content.replace(oldChatSchema, newChatSchema);
}

fs.writeFileSync(filePath, content);
console.log("✓ Successfully upgraded Schemas in server.ts");
