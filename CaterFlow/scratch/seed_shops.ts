import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

const ShopSchema = new mongoose.Schema({
  adminId: String,
  name: String,
  location: String,
  coordinates: { lat: Number, lng: Number },
  specialties: String,
  baseQuote: Number,
  createdAt: { type: Date, default: Date.now }
});

const Shop = mongoose.model('Shop', ShopSchema);

const sampleShops = [
  {
    adminId: 'admin_1',
    name: 'Artisan Flavors Catering',
    location: 'Metropolitan Area, Downtown',
    coordinates: { lat: 14.5995, lng: 120.9842 },
    specialties: 'Gourmet Fusion, Mediterranean, Vegan Options',
    baseQuote: 1500,
  },
  {
    adminId: 'admin_2',
    name: 'Rustic Roots Kitchen',
    location: 'North District, Green Valley',
    coordinates: { lat: 14.6760, lng: 121.0437 },
    specialties: 'Farm-to-Table, Organic, Traditional Comfort Food',
    baseQuote: 1200,
  },
  {
    adminId: 'admin_3',
    name: 'Ocean Breeze Catering',
    location: 'Coastal Road, Bayside',
    coordinates: { lat: 14.5350, lng: 120.9820 },
    specialties: 'Premium Seafood, Coastal Asian Cuisine',
    baseQuote: 2000,
  },
  {
    adminId: 'admin_4',
    name: 'Golden Dragon Events',
    location: 'Chinatown District',
    coordinates: { lat: 14.6010, lng: 120.9760 },
    specialties: 'Authentic Cantonese, Dim Sum Specials',
    baseQuote: 1800,
  }
];

async function seedShops() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing shops to avoid duplicates during testing
    await Shop.deleteMany({});
    console.log('Cleared existing shops');

    await Shop.insertMany(sampleShops);
    console.log(`✓ Seeded ${sampleShops.length} sample shops`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedShops();
