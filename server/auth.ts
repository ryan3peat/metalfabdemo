import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization - supports local auth and supplier sessions
  passport.serializeUser((user: any, cb) => {
    // Serialize user based on authType
    if (user.authType === "local") {
      cb(null, { localAuthUser: user.localAuthUser, authType: "local" });
    } else if (user.authType === "supplier") {
      cb(null, { supplierUser: user.supplierUser, authType: "supplier" });
    } else {
      // Fallback for local auth without explicit authType
      cb(null, { localAuthUser: user, authType: "local" });
    }
  });
  
  passport.deserializeUser(async (user: any, cb) => {
    // Deserialize user based on authType
    if (user.authType === "local") {
      try {
        const freshUser = await storage.getUser(user.localAuthUser.id);
        cb(null, { localAuthUser: freshUser, authType: "local" });
      } catch (error) {
        cb(error);
      }
    } else if (user.authType === "supplier") {
      try {
        const freshSupplier = await storage.getUser(user.supplierUser.id);
        cb(null, { supplierUser: freshSupplier, authType: "supplier" });
      } catch (error) {
        cb(error);
      }
    } else {
      cb(null, user);
    }
  });

  // Universal logout endpoint - handles all auth types
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user is still active (for local auth)
  if (user.authType === "local" && user.localAuthUser && !user.localAuthUser.active) {
    return res.status(401).json({ message: "Account is inactive" });
  }

  // Verify supplier is still active
  if (user.authType === "supplier" && user.supplierUser && !user.supplierUser.active) {
    return res.status(401).json({ message: "Account is inactive" });
  }

  return next();
};
