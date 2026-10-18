import { Request, Response, NextFunction } from 'express';
import { db, getSession, SessionRecord, UserRecord } from './db';

export interface AuthenticatedRequest extends Request {
  session?: SessionRecord;
  user?: UserRecord;
}

// ============================================================================
// 1. Login Brute-Force Rate Limiter (P0 Requirement)
// ============================================================================
interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes block

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttemptAt: now,
    });
  } else {
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS;
    }
  }
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// ============================================================================
// 2. General API Rate Limiter (P2 Requirement)
// ============================================================================
interface ApiRateRecord {
  count: number;
  windowStart: number;
}

const apiRateBuckets = new Map<string, ApiRateRecord>();
const API_WINDOW_MS = 60 * 1000; // 1 minute
const API_MAX_REQUESTS = 240;    // 240 requests / minute per IP

export function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const bucket = apiRateBuckets.get(clientIp);

  if (!bucket || now - bucket.windowStart > API_WINDOW_MS) {
    apiRateBuckets.set(clientIp, { count: 1, windowStart: now });
    next();
    return;
  }

  bucket.count += 1;
  if (bucket.count > API_MAX_REQUESTS) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({
      success: false,
      code: 'API_RATE_LIMIT_EXCEEDED',
      error: 'Terlalu banyak permintaan API dari alamat IP ini. Silakan tunggu beberapa saat.',
    });
    return;
  }

  next();
}

// ============================================================================
// 3. CSRF & Cross-Origin Protection Middleware (P0 Requirement)
// ============================================================================
export function csrfAndOriginGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    next();
    return;
  }

  // 1. Check Sec-Fetch-Site header if sent by modern browsers
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite && secFetchSite === 'cross-site') {
    res.status(403).json({
      success: false,
      code: 'CSRF_CROSS_SITE_BLOCKED',
      error: 'Permintaan lintas situs (Cross-Site Request Forgery) ditolak oleh server.',
    });
    return;
  }

  // 2. If Cookie header is used for session or X-CSRF-Token is provided, validate CSRF token against session
  const csrfHeader = req.headers['x-csrf-token'];
  if (req.session && csrfHeader && typeof csrfHeader === 'string') {
    if (csrfHeader !== req.session.csrfToken) {
      res.status(403).json({
        success: false,
        code: 'INVALID_CSRF_TOKEN',
        error: 'Token CSRF tidak cocok dengan sesi aktif.',
      });
      return;
    }
  }

  next();
}

// ============================================================================
// 4. Authentication & Session Validation Middleware (P0 Requirement)
// ============================================================================
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Sesi tidak valid atau belum login. Token autentikasi diperlukan.',
    });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      code: 'SESSION_EXPIRED',
      error: 'Token sesi kedaluwarsa atau telah dicabut dari database server.',
    });
    return;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user || user.status !== 'active') {
    res.status(403).json({
      success: false,
      code: 'USER_INACTIVE',
      error: 'Akun dinonaktifkan atau tidak ditemukan.',
    });
    return;
  }

  // Keep session role and schoolId strictly synchronized with live user record in DB
  if (session.role !== user.role || session.schoolId !== user.schoolId) {
    session.role = user.role;
    session.schoolId = user.schoolId;
  }

  req.session = session;
  req.user = user;
  next();
}

// ============================================================================
// 5. Strict Server-Side RBAC Guard (P0 Requirement)
// ============================================================================
export function requireRoles(roles: Array<'kepala_sekolah' | 'guru' | 'siswa'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.session || !req.user) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        error: 'Autentikasi diperlukan.',
      });
      return;
    }

    // Verify against BOTH live user record and session record
    const effectiveRole = req.user.role;
    if (!roles.includes(effectiveRole) || !roles.includes(req.session.role)) {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        error: `Akses ditolak: Operasi ini membutuhkan peran [${roles.join(', ')}]. Peran server Anda: [${effectiveRole}].`,
        serverVerifiedRole: effectiveRole,
        requestedRoleAttempt: req.headers['x-client-role-claim'] || req.body?.role || 'unknown',
      });
      return;
    }

    next();
  };
}

// ============================================================================
// 6. Multi-Tenant School Isolation Guard (P0 Requirement)
// ============================================================================
export function enforceSchoolIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Autentikasi diperlukan.' });
    return;
  }

  const targetSchoolId = (req.params.schoolId || req.query.schoolId || req.body?.schoolId) as string | undefined;

  if (targetSchoolId && targetSchoolId !== req.user.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Pelanggaran batas sekolah: Akun Anda terdaftar di sekolah [${req.user.schoolId}], tidak berhak mengakses [${targetSchoolId}].`,
      userSchoolId: req.user.schoolId,
      attemptedSchoolId: targetSchoolId,
    });
    return;
  }

  next();
}

// Input Sanitization Helper (P2 Requirement)
export function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}
