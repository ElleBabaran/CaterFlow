import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // TODO: Complete Firebase Admin SDK integration
    // import * as admin from 'firebase-admin';
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.auth = {
    //   uid: decodedToken.uid,
    //   email: decodedToken.email,
    // };

    // PLACEHOLDER: For development only
    if (token === 'dev-token') {
      req.auth = {
        uid: req.headers['x-user-id'] as string || 'dev-user',
        email: req.headers['x-user-email'] as string,
      };
      return next();
    }

    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // TODO: Check user role in database
  // const user = await UserProfile.findOne({ uid: req.auth.uid });
  // if (user?.role !== 'admin' && user?.uid !== resourceOwnerId) {
  //   return res.status(403).json({ error: 'Insufficient permissions' });
  // }

  next();
}
