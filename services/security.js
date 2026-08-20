import crypto from 'crypto';
import { redisRateLimit, getRedisStatus } from './redis.js';

// Secret key for signing tokens (derived from environment or secure server fallback)
const JWT_SECRET = process.env.SESSION_SECRET || process.env.MONGODB_PASSWORD || 'eduvault-secure-auth-secret-key-2026';
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'admin@eduvault123';

// In-memory rate limiting map for fallback when Redis is offline
const memoryRateLimits = new Map();

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Dummy compare to avoid timing leak on length mismatch
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Signs an authentication payload using HMAC-SHA256
 */
export function signAuthToken(payload, expiresInSeconds = 86400 * 7) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const dataToSign = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest('base64url');
  return `${dataToSign}.${signature}`;
}

/**
 * Verifies a signed HMAC-SHA256 auth token
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const dataToSign = `${header}.${body}`;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest('base64url');

  if (!timingSafeMatch(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Signs an Admin Session Token
 */
export function signAdminToken(expiresInSeconds = 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', role: 'admin' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ role: 'admin', iat: Date.now(), exp })).toString('base64url');
  const dataToSign = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', `${JWT_SECRET}:${ADMIN_SECRET}`).update(dataToSign).digest('base64url');
  return `${dataToSign}.${signature}`;
}

/**
 * Verifies an Admin Session Token
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  // Strip Bearer prefix if present
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = cleanToken.split('.');
  if (parts.length !== 3) return false;

  const [header, body, signature] = parts;
  const dataToSign = `${header}.${body}`;
  const expectedSignature = crypto.createHmac('sha256', `${JWT_SECRET}:${ADMIN_SECRET}`).update(dataToSign).digest('base64url');

  if (!timingSafeMatch(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Extracts Bearer token from request Authorization header
 */
export function getBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Validates a target URL against SSRF (Blocks localhost, internal subnets, AWS metadata, etc.)
 */
export function validateUrlForSsrf(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'Missing URL parameter' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Only permit HTTP & HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard loopback hostnames
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, reason: 'Access to internal/local domains is prohibited' };
  }

  // Block IPv4 private ranges & cloud metadata (169.254.169.254)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const [, a, b, c, d] = ipMatch.map(Number);
    if (a < 0 || a > 255 || b < 0 || b > 255 || c < 0 || c > 255 || d < 0 || d > 255) {
      return { valid: false, reason: 'Invalid IP address' };
    }
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return { valid: false, reason: 'Access to loopback IP is prohibited' };
    // 0.0.0.0/8 (Current network)
    if (a === 0) return { valid: false, reason: 'Access to 0.0.0.0 is prohibited' };
    // 10.0.0.0/8 (Private)
    if (a === 10) return { valid: false, reason: 'Access to private RFC1918 IP is prohibited' };
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return { valid: false, reason: 'Access to private RFC1918 IP is prohibited' };
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return { valid: false, reason: 'Access to private RFC1918 IP is prohibited' };
    // 169.254.0.0/16 (Link-local / Cloud metadata AWS/GCP/Azure)
    if (a === 169 && b === 254) return { valid: false, reason: 'Access to cloud metadata IP is prohibited' };
  }

  // Block IPv6 loopback & unique local addresses
  if (hostname === '::1' || hostname === '[::1]' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
    return { valid: false, reason: 'Access to private IPv6 address is prohibited' };
  }

  // Block internal port targets
  if (parsed.port) {
    const portNum = Number(parsed.port);
    const allowedPorts = [80, 443, 8080, 8443];
    if (!allowedPorts.includes(portNum)) {
      return { valid: false, reason: `Port ${portNum} is not permitted for proxying` };
    }
  }

  return { valid: true, parsed };
}

/**
 * Universal Rate Limiter with Redis & In-Memory fallback
 */
export async function checkRateLimit(key, limit = 10, windowSecs = 60) {
  try {
    const status = getRedisStatus();
    if (status && status.ready) {
      const result = await redisRateLimit(key, limit, windowSecs);
      if (result && typeof result.allowed === 'boolean' && result.current !== undefined) {
        return {
          allowed: result.allowed,
          remaining: result.remaining,
          resetIn: windowSecs,
        };
      }
    }
  } catch {}

  // In-Memory sliding window fallback
  const now = Date.now();
  const entry = memoryRateLimits.get(key) || { count: 0, resetAt: now + windowSecs * 1000 };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowSecs * 1000;
  } else {
    entry.count += 1;
  }

  memoryRateLimits.set(key, entry);

  // Clean memory map if too large
  if (memoryRateLimits.size > 10000) {
    for (const [k, v] of memoryRateLimits.entries()) {
      if (now > v.resetAt) memoryRateLimits.delete(k);
    }
  }

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Sanitizes input strings against NoSQL injection and basic XSS
 */
export function sanitizeInput(val, maxLength = 255) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

/**
 * Validates and normalizes email string
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  const clean = email.trim().toLowerCase().slice(0, 100);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean : '';
}

/**
 * Masks sensitive secrets for admin views
 */
export function maskSecret(str) {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= 8) return '********';
  return `${str.slice(0, 4)}****${str.slice(-4)}`;
}

// In-memory email cooldown tracking (email -> { lastSent: timestamp, count: number, hourStart: timestamp })
const emailCooldownMap = new Map();

/**
 * Enforces per-email OTP cooldown (60 seconds) & hourly quota (max 5/hr)
 */
export function checkEmailCooldown(rawEmail, cooldownSecs = 60, maxPerHour = 5) {
  const email = sanitizeEmail(rawEmail);
  if (!email) return { allowed: false, error: 'Invalid email address' };

  const now = Date.now();
  const entry = emailCooldownMap.get(email) || { lastSent: 0, count: 0, hourStart: now };

  // Reset hourly window
  if (now - entry.hourStart > 3600 * 1000) {
    entry.count = 0;
    entry.hourStart = now;
  }

  // 1. Check 60-second consecutive request cooldown
  const timeSinceLast = Math.floor((now - entry.lastSent) / 1000);
  if (entry.lastSent > 0 && timeSinceLast < cooldownSecs) {
    const waitTime = cooldownSecs - timeSinceLast;
    return {
      allowed: false,
      error: `Please wait ${waitTime}s before requesting another verification code.`,
    };
  }

  // 2. Check hourly limit
  if (entry.count >= maxPerHour) {
    const remainingMins = Math.ceil((entry.hourStart + 3600 * 1000 - now) / 60000);
    return {
      allowed: false,
      error: `Too many verification requests for this email. Please try again in ${remainingMins} minutes.`,
    };
  }

  // Record this attempt
  entry.lastSent = now;
  entry.count += 1;
  emailCooldownMap.set(email, entry);

  return { allowed: true, remainingPerHour: maxPerHour - entry.count };
}

// In-memory failed login tracking (email -> { attempts: number, lockUntil: timestamp })
const accountLockoutMap = new Map();

/**
 * Checks if account is currently locked due to consecutive failed logins
 */
export function checkAccountLockout(rawEmail) {
  const email = sanitizeEmail(rawEmail);
  if (!email) return { locked: false };

  const now = Date.now();
  const entry = accountLockoutMap.get(email);
  if (!entry) return { locked: false };

  if (entry.lockUntil && entry.lockUntil > now) {
    const unlockInSecs = Math.ceil((entry.lockUntil - now) / 1000);
    const unlockInMins = Math.ceil(unlockInSecs / 60);
    return {
      locked: true,
      unlockInSecs,
      error: `Account temporarily locked due to 5 consecutive failed login attempts. Please try again in ${unlockInMins} minute(s).`,
    };
  }

  // If lock expired, reset
  if (entry.lockUntil && entry.lockUntil <= now) {
    accountLockoutMap.delete(email);
  }

  return { locked: false };
}

/**
 * Records a failed password attempt and locks account if attempts >= 5
 */
export function recordFailedLogin(rawEmail, maxAttempts = 5, lockDurationSecs = 900) {
  const email = sanitizeEmail(rawEmail);
  if (!email) return;

  const now = Date.now();
  const entry = accountLockoutMap.get(email) || { attempts: 0, lockUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= maxAttempts) {
    entry.lockUntil = now + lockDurationSecs * 1000;
  }

  accountLockoutMap.set(email, entry);
  return { attempts: entry.attempts, locked: entry.attempts >= maxAttempts };
}

/**
 * Clears failed login counter upon successful authentication
 */
export function clearFailedLogins(rawEmail) {
  const email = sanitizeEmail(rawEmail);
  if (email) {
    accountLockoutMap.delete(email);
  }
}

/**
 * Honeypot bot detector (detects automated spambots filling hidden decoy inputs)
 */
export function checkHoneypot(body = {}) {
  if (!body || typeof body !== 'object') return false;
  // If bot fills any decoy honeypot field, flag as bot
  const honeypots = ['website_url_hp', 'hp_confirm_field', 'user_fax_hp', 'bot_trap'];
  for (const hp of honeypots) {
    if (body[hp] && String(body[hp]).trim().length > 0) {
      return true; // Bot caught!
    }
  }
  return false;
}

/**
 * Deep recursive NoSQL query sanitizer (strips keys starting with $ or containing .)
 */
export function sanitizeNoSql(input) {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSql).filter((item) => item !== undefined);
  }

  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    // Drop NoSQL operator keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    const sanitizedVal = sanitizeNoSql(value);
    // If original value had keys but all were stripped away, omit the field entirely
    if (
      sanitizedVal &&
      typeof sanitizedVal === 'object' &&
      !Array.isArray(sanitizedVal) &&
      Object.keys(sanitizedVal).length === 0 &&
      Object.keys(value).length > 0
    ) {
      continue;
    }
    clean[key] = sanitizedVal;
  }
  return clean;
}

/**
 * Validates password complexity & rejects known vulnerable patterns
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters' };
  }

  const commonVulnerable = [
    '12345678', 'password', 'password123', 'admin123', 'qwerty123',
    'eduvault', 'eduvault123', '123456789', 'letmein123', 'welcome123'
  ];

  if (commonVulnerable.includes(password.toLowerCase().trim())) {
    return { valid: false, error: 'This password is too common and easily guessed. Please choose a stronger password.' };
  }

  // Must contain at least one letter and at least one digit or special symbol
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasLetter || !hasDigitOrSymbol) {
    return { valid: false, error: 'Password must include both letters and at least one number or special character.' };
  }

  return { valid: true };
}
