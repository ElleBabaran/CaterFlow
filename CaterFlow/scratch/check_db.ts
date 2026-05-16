import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function testConnection() {
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ Successfully connected to MongoDB Atlas');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    // Check shops count
    const shopCount = await mongoose.connection.db.collection('shops').countDocuments();
    console.log(`Number of shops in 'shops' collection: ${shopCount}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Connection failed:');
    console.error(err.message);
    if (err.message.includes('IP address')) {
      console.error('\nIMPORTANT: Your current IP is still not whitelisted in Atlas.');
    }
    process.exit(1);
  }
}

testConnection();
