import mongoose from 'mongoose';

export const mongoService = {
  connect: async (uri: string) => {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4,
      });
      console.log('✓ MongoDB connected');
    } catch (error) {
      console.error('✗ MongoDB connection failed:', error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.log('✓ MongoDB disconnected');
    } catch (error) {
      console.error('✗ MongoDB disconnection failed:', error);
      throw error;
    }
  },

  getConnectionState: () => {
    const states: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  },

  // Event operations
  createEvent: async (eventData: any) => {
    // This would be implemented in your Express server
    // The schema is already defined in server.ts
    return eventData;
  },

  getEventsByUser: async (userId: string) => {
    // Fetch from database
    return [];
  },

  // User operations
  createOrUpdateUser: async (uid: string, userData: any) => {
    return { uid, ...userData };
  },

  getUserProfile: async (uid: string) => {
    return { uid };
  },

  // Shop operations
  getShops: async () => {
    return [];
  },

  createShop: async (shopData: any) => {
    return shopData;
  },

  // Chat operations
  getChat: async (eventId: string) => {
    return { eventId, messages: [] };
  },

  addChatMessage: async (eventId: string, senderId: string, text: string) => {
    return {
      eventId,
      senderId,
      text,
      timestamp: new Date()
    };
  }
};
