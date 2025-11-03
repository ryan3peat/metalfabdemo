import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "../storage";

// Configuration for admin-only local authentication
const ADMIN_ALLOWED_EMAILS = [
  "ryan@essentialflavours.com.au",
  "admin@essentialflavours.com",
];

// Login attempt tracking for rate limiting
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Configure Passport LocalStrategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Check if email is in admin allowlist
        if (!ADMIN_ALLOWED_EMAILS.includes(email.toLowerCase())) {
          console.warn(`[LocalAuth] Unauthorized login attempt for non-admin email: ${email}`);
          return done(null, false, { message: "Invalid credentials" });
        }

        // Check rate limiting
        const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
        const now = Date.now();

        // Check if account is locked
        if (attempts.lockedUntil && now < attempts.lockedUntil) {
          const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
          console.warn(`[LocalAuth] Account locked for ${email}. Remaining: ${remainingMinutes}m`);
          return done(null, false, {
            message: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
          });
        }

        // Reset counter if attempt window expired
        if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
          attempts.count = 0;
          attempts.lockedUntil = undefined;
        }

        // Get user from database
        const user = await storage.getUserByEmail(email);

        if (!user) {
          console.warn(`[LocalAuth] Login attempt for non-existent user: ${email}`);
          incrementFailedAttempts(email, attempts, now);
          return done(null, false, { message: "Invalid credentials" });
        }

        // Check if user is active
        if (!user.active) {
          console.warn(`[LocalAuth] Login attempt for inactive user: ${email}`);
          return done(null, false, { message: "Account is inactive" });
        }

        // Check if password is set
        if (!user.passwordHash) {
          console.warn(`[LocalAuth] Login attempt for user without password: ${email}`);
          return done(null, false, { message: "Password not set. Please use Replit Auth or contact admin." });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          console.warn(`[LocalAuth] Invalid password for user: ${email}`);
          incrementFailedAttempts(email, attempts, now);
          return done(null, false, { message: "Invalid credentials" });
        }

        // Successful login - reset attempts
        loginAttempts.delete(email);
        console.info(`[LocalAuth] Successful login for user: ${email}`);
        return done(null, user);
      } catch (error) {
        console.error("[LocalAuth] Authentication error:", error);
        return done(error);
      }
    }
  )
);

// Helper function to increment failed attempts and apply lockout
function incrementFailedAttempts(email: string, attempts: LoginAttempt, now: number) {
  attempts.count += 1;
  attempts.lastAttempt = now;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION;
    console.warn(
      `[LocalAuth] Account locked for ${email} after ${attempts.count} failed attempts`
    );
  }

  loginAttempts.set(email, attempts);
}


// Password hashing utility (cost factor 12 for security)
export async function hashPassword(password: string): Promise<string> {
  const BCRYPT_ROUNDS = 12;
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Password validation utility
export function validatePasswordComplexity(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

export default passport;
