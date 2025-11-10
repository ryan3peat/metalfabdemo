import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIdentifier = req.ip || 'unknown';
    const key = `${options.keyPrefix}:${clientIdentifier}`;
    
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (entry.count >= options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    entry.count++;
    next();
  };
}

export function createEmailRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    if (!email) {
      return next();
    }

    const normalizedEmail = email.toLowerCase().trim();
    const key = `${options.keyPrefix}:email:${normalizedEmail}`;
    
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (entry.count >= options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return res.status(200).json({
        message: 'If an account exists with that email, a login link has been sent.',
      });
    }

    entry.count++;
    next();
  };
}
