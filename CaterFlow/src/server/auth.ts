import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function verifyToken(token: string) {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
