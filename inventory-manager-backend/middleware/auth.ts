import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

interface AuthRequest extends Request {
  user?: any;
}

// Middleware to authenticate JWT token
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional authentication - allows both authenticated and unauthenticated requests
export const optionalAuthenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};