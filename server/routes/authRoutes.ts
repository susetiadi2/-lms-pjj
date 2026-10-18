import { Router, Response } from 'express';
import { db, verifyPassword, createSession, revokeSession } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  sanitizeString,
} from '../auth';

const router = Router();

// Login endpoint with strict bcrypt verification, rate limiting, and CSRF-bound persistent session generation
router.post('/login', (req, res): void => {
  const rawUsername = sanitizeString(req.body?.username, 100);
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const roleDemo = sanitizeString(req.body?.roleDemo, 30);
  const demoUserId = sanitizeString(req.body?.demoUserId, 60);

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${clientIp}_${rawUsername || roleDemo || demoUserId || 'guest'}`;

  // Check brute force rate limit (P0 requirement)
  const rateLimitStatus = checkLoginRateLimit(rateLimitKey);
  if (!rateLimitStatus.allowed) {
    res.setHeader('Retry-After', String(rateLimitStatus.retryAfterSeconds || 60));
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      error: `Terlalu banyak percobaan login gagal. Demi keamanan, akses diblokir sementara. Coba lagi dalam ${rateLimitStatus.retryAfterSeconds} detik.`,
      retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
    });
    return;
  }

  let user = undefined;

  if (rawUsername) {
    // Standard username + password login: PASSWORD IS MANDATORY (Fix P0 Bypass!)
    if (!rawPassword) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Kata sandi wajib diisi untuk login akun.',
      });
      return;
    }

    user = db.users.find((u) => u.username.toLowerCase() === rawUsername.toLowerCase());
    if (!user) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Pengguna tidak ditemukan atau kata sandi salah.',
      });
      return;
    }

    const isValid = verifyPassword(rawPassword, user.passwordHash);
    if (!isValid) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Kata sandi tidak sesuai.',
      });
      return;
    }
  } else if (roleDemo || demoUserId) {
    // Explicit Demo Role Switcher (restricted strictly to default school SCH-DIVA-001 preview accounts)
    if (demoUserId) {
      user = db.users.find((u) => u.id === demoUserId && u.schoolId === 'SCH-DIVA-001');
    } else if (['kepala_sekolah', 'guru', 'siswa'].includes(roleDemo)) {
      user = db.users.find((u) => u.role === roleDemo && u.schoolId === 'SCH-DIVA-001');
    }

    if (!user) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Akun demo tidak ditemukan.',
      });
      return;
    }
  } else {
    recordFailedLogin(rateLimitKey);
    res.status(400).json({
      success: false,
      code: 'MISSING_CREDENTIALS',
      error: 'Username dan kata sandi wajib disertakan.',
    });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      code: 'USER_INACTIVE',
      error: 'Akun Anda berstatus nonaktif. Silakan hubungi admin sekolah.',
    });
    return;
  }

  // Reset failed login counter on success
  resetLoginAttempts(rateLimitKey);

  // Create persistent server session with CSRF token
  const session = createSession(user);

  res.json({
    success: true,
    token: session.token,
    csrfToken: session.csrfToken,
    session: {
      userId: user.id,
      schoolId: user.schoolId,
      role: user.role,
      expiresAt: session.expiresAt,
    },
    user: {
      id: user.id,
      schoolId: user.schoolId,
      username: user.username,
      name: user.name,
      role: user.role,
      nisOrNip: user.nisOrNip,
      className: user.className,
      subjectSpecialty: user.subjectSpecialty,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
    school: db.schools.find((s) => s.id === user.schoolId),
  });
});

// Verify session - used on app load to guarantee client role matches server truth
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || !req.session) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Unauthorized' });
    return;
  }

  const school = db.schools.find((s) => s.id === req.user?.schoolId);

  res.json({
    success: true,
    serverVerified: true,
    csrfToken: req.session.csrfToken,
    user: {
      id: req.user.id,
      schoolId: req.user.schoolId,
      username: req.user.username,
      name: req.user.name,
      role: req.user.role, // Truth from server DB
      nisOrNip: req.user.nisOrNip,
      className: req.user.className,
      subjectSpecialty: req.user.subjectSpecialty,
      email: req.user.email,
      phone: req.user.phone,
      status: req.user.status,
    },
    school,
    session: {
      token: req.session.token,
      csrfToken: req.session.csrfToken,
      role: req.session.role,
      expiresAt: req.session.expiresAt,
    },
  });
});

// Logout endpoint with server session revocation
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (req.session) {
    revokeSession(req.session.token);
  }
  res.json({ success: true, message: 'Berhasil keluar dan sesi server telah dihapus secara permanen.' });
});

export default router;
