import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import authRoutes from './server/routes/authRoutes';
import examRoutes from './server/routes/examRoutes';
import taskRoutes from './server/routes/taskRoutes';
import attendanceRoutes from './server/routes/attendanceRoutes';
import adminRoutes from './server/routes/adminRoutes';
import securityRoutes from './server/routes/securityRoutes';
import storageRoutes from './server/routes/storageRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import { db } from './server/db';
import { apiRateLimiter, csrfAndOriginGuard } from './server/auth';
import { storageProvider } from './server/storage/storageProvider';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Higher JSON body limit specifically for base64 file upload endpoint (/api/storage/upload)
  // Allows up to 5 MB binary files (~6.8 MB base64) and lets route handler return structured 413 on >5 MB
  app.use('/api/storage', express.json({ limit: '12mb' }));

  // Default JSON Body Parser with safe 1 MB limit for all other endpoints (P2 requirement)
  app.use(express.json({ limit: '1mb' }));

  // Security Headers & Sanitized Access Logging (P2 requirement)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // Sanitized log: NO password, NO auth tokens, NO personal data printed
      const sanitizedUrl = req.originalUrl.split('?')[0];
      if (!sanitizedUrl.startsWith('/@') && !sanitizedUrl.includes('.vite') && !sanitizedUrl.startsWith('/src/')) {
        console.log(`[HTTP ${req.method}] ${sanitizedUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });

    next();
  });

  // Apply Global API Rate Limiter & Cross-Origin / CSRF Guard to all /api endpoints
  app.use('/api', apiRateLimiter, csrfAndOriginGuard);

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/storage', storageRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/security', securityRoutes);

  // Healthcheck, Storage & PWA Readiness Diagnostic endpoint
  app.get('/api/health', (req, res) => {
    const storageMeta = storageProvider.getProviderMetadata();
    const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Mr. DIVA LMS Enterprise Security, Storage & PWA API',
      version: '2.4.0-phase2-storage-pwa',
      database: {
        schemaVersion: db.schemaVersion,
        isPersistent: true,
        masterKeyVaultIsolated: true,
        usersCount: db.users.length,
        examsCount: db.exams.length,
        tasksCount: db.tasks.length,
        submissionsCount: db.submissions.length,
        examResultsCount: db.examResults.length,
        attendanceRecordsCount: db.attendanceRecords.length,
        storedFilesCount: db.fileObjects.length,
        pushSubscriptionsCount: db.pushSubscriptions.length,
        activeSessions: db.sessions.size,
      },
      storage: {
        providerName: storageMeta.providerName,
        mode: storageMeta.mode,
        isExternalCloudConfigured: storageMeta.isExternalCloudConfigured,
        maxUploadBytes: storageMeta.maxUploadBytes,
        allowedMimeTypes: storageMeta.allowedMimeTypes,
      },
      notifications: {
        serverPushConfigured: vapidConfigured,
        activeDeliveryMode: vapidConfigured ? 'server_web_push_active' : 'local_browser_notification_only',
      },
    });
  });

  // Standardized Error Handler (handles body-parser 413 entity.too.large cleanly)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      res.status(413).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        error: 'Ukuran payload atau berkas melebihi batas maksimum yang diizinkan server (5 MB).',
      });
      return;
    }
    console.error('[UNHANDLED SERVER ERROR]', err?.message || 'Unknown error');
    res.status(err.status || 500).json({
      success: false,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      error: 'Terjadi kesalahan internal pada server.',
    });
  });

  // Setup Vite development server or static serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LMS SERVER] Mr. DIVA LMS Hardened Backend (Fase 2 Storage & PWA) running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[LMS SERVER ERROR] Failed to start server:', err);
  process.exit(1);
});
