import { Router, Response } from 'express';
import { db, runInTransaction, PushSubscriptionRecord } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  enforceSchoolIsolation,
  sanitizeString,
} from '../auth';

const router = Router();

/**
 * Checks whether production VAPID keys or FCM credentials are configured in the server environment.
 * Never claims background server push is active when VAPID keys are absent.
 */
function getPushServerConfigStatus() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@edunexa.my.id';

  const isVapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

  return {
    serverPushConfigured: isVapidConfigured,
    architecture: 'Web Push API (RFC 8030 + VAPID)',
    activeDeliveryMode: isVapidConfigured
      ? 'server_web_push_active'
      : 'local_browser_notification_only',
    vapidPublicKey: isVapidConfigured ? vapidPublicKey : null,
    vapidSubject,
    limitationsNotice:
      'Saat kunci VAPID server belum dikonfigurasi di environment produksi, pengingat berjalan melalui Browser Notification API lokal dan Web Audio saat aplikasi terbuka. Alarm suara atau push latar belakang saat perangkat terkunci/offline dibatasi oleh kebijakan sistem operasi dan membutuhkan konfigurasi VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY di server produksi.',
  };
}

// Get Notification Architecture & Subscription Status
router.get('/status', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const config = getPushServerConfigStatus();

  const userSubscriptions = db.pushSubscriptions.filter(
    (s) => s.userId === user.id && s.schoolId === user.schoolId
  );

  res.json({
    success: true,
    ...config,
    isUserSubscribedOnServer: userSubscriptions.length > 0,
    subscriptionsCount: userSubscriptions.length,
  });
});

// Register Web Push Subscription for Task Deadline Reminders
router.post('/subscribe', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { endpoint, keys, userAgent } = req.body || {};

  const cleanEndpoint = sanitizeString(endpoint, 500);
  const p256dh = sanitizeString(keys?.p256dh, 250);
  const auth = sanitizeString(keys?.auth, 150);

  if (!cleanEndpoint || !p256dh || !auth) {
    res.status(400).json({
      success: false,
      code: 'INVALID_PUSH_SUBSCRIPTION',
      error: 'Objek langganan Web Push (endpoint, keys.p256dh, keys.auth) wajib lengkap.',
    });
    return;
  }

  const newSub: PushSubscriptionRecord = {
    id: `push-${Date.now()}-${user.id}`,
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    endpoint: cleanEndpoint,
    keys: { p256dh, auth },
    userAgent: sanitizeString(userAgent, 250),
    createdAt: new Date().toISOString(),
  };

  runInTransaction(() => {
    const existingIdx = db.pushSubscriptions.findIndex(
      (s) => s.userId === user.id && s.endpoint === cleanEndpoint
    );
    if (existingIdx >= 0) {
      db.pushSubscriptions[existingIdx] = newSub;
    } else {
      db.pushSubscriptions.push(newSub);
    }
  });

  const config = getPushServerConfigStatus();

  res.status(201).json({
    success: true,
    serverPushConfigured: config.serverPushConfigured,
    activeDeliveryMode: config.activeDeliveryMode,
    subscription: {
      id: newSub.id,
      createdAt: newSub.createdAt,
    },
    message: config.serverPushConfigured
      ? 'Langganan Web Push berhasil disimpan dan aktif untuk pengingat server.'
      : 'Endpoint langganan tersimpan di database. Catatan: Pengiriman push latar belakang dari server memerlukan VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY pada environment produksi.',
  });
});

// Unsubscribe from Web Push Notifications
router.post('/unsubscribe', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { endpoint } = req.body || {};
  const cleanEndpoint = sanitizeString(endpoint, 500);

  runInTransaction(() => {
    db.pushSubscriptions = db.pushSubscriptions.filter((s) => {
      if (s.userId !== user.id || s.schoolId !== user.schoolId) return true;
      if (cleanEndpoint) return s.endpoint !== cleanEndpoint;
      return false;
    });
  });

  res.json({
    success: true,
    message: 'Langganan notifikasi berhasil dihapus dari database server.',
  });
});

export default router;
