import { Router, Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { db, runInTransaction, FileObjectRecord } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  enforceSchoolIsolation,
  sanitizeString,
} from '../auth';
import {
  storageProvider,
  validateAndInspectFileBuffer,
  MAX_UPLOAD_SIZE_BYTES,
} from '../storage/storageProvider';

const router = Router();

// Get Storage Provider Configuration & School File Metrics
router.get('/info', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const providerMeta = storageProvider.getProviderMetadata();

  const visibleFiles = db.fileObjects.filter((f) => {
    if (f.schoolId !== user.schoolId) return false;
    if (user.role === 'siswa') return f.ownerId === user.id;
    return true;
  });

  res.json({
    success: true,
    provider: providerMeta,
    filesCount: visibleFiles.length,
    files: visibleFiles.map((f) => ({
      id: f.id,
      ownerId: f.ownerId,
      ownerName: f.ownerName,
      taskId: f.taskId,
      originalName: f.originalNameSanitized,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      sha256: f.sha256,
      createdAt: f.createdAt,
      downloadUrl: `/api/storage/files/${f.id}`,
    })),
  });
});

// Upload Task File (PDF / Photo) with Strict Server-Side Binary Inspection
router.post('/upload', authenticateToken, enforceSchoolIsolation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { fileName, mimeType, base64Data, taskId, ownerId } = req.body || {};

  // Prevent student from spoofing another student's ownerId
  if (ownerId && ownerId !== user.id) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_OWNER_SPOOFING',
      error: 'Akses ditolak: Anda hanya diizinkan mengunggah berkas tugas atas nama akun Anda sendiri.',
    });
    return;
  }

  // If taskId is provided, verify the task exists and belongs to the user's school
  const cleanTaskId = sanitizeString(taskId, 80);
  if (cleanTaskId) {
    const targetTask = db.tasks.find((t) => t.id === cleanTaskId);
    if (!targetTask) {
      res.status(404).json({
        success: false,
        code: 'TASK_NOT_FOUND',
        error: 'Tugas tujuan unggahan tidak ditemukan.',
      });
      return;
    }
    if (targetTask.schoolId !== user.schoolId) {
      res.status(403).json({
        success: false,
        code: 'CROSS_TENANT_VIOLATION',
        error: `Pelanggaran isolasi sekolah: Tidak dapat mengunggah berkas ke tugas sekolah lain [${targetTask.schoolId}].`,
      });
      return;
    }
  }

  if (!fileName || typeof fileName !== 'string' || !base64Data || typeof base64Data !== 'string') {
    res.status(400).json({
      success: false,
      code: 'INVALID_UPLOAD_PAYLOAD',
      error: 'Nama berkas dan konten biner (base64Data) wajib disertakan.',
    });
    return;
  }

  // Strip optional data URL prefix (e.g. "data:application/pdf;base64,")
  const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  // Quick pre-decode size check (~1.37x base64 overhead)
  if (base64Clean.length > Math.ceil(MAX_UPLOAD_SIZE_BYTES * 1.4)) {
    res.status(413).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      error: 'Ukuran berkas melebihi batas maksimum 5 MB.',
    });
    return;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(base64Clean, 'base64');
  } catch {
    res.status(400).json({
      success: false,
      code: 'INVALID_BASE64',
      error: 'Format encoding berkas tidak valid.',
    });
    return;
  }

  // Run strict server-side binary magic bytes, size, extension & malware/script inspection
  const inspection = validateAndInspectFileBuffer(
    fileBuffer,
    fileName,
    typeof mimeType === 'string' ? mimeType : undefined
  );

  if (!inspection.valid) {
    const statusMap: Record<string, number> = {
      FILE_EMPTY: 400,
      FILE_TOO_LARGE: 413,
      INVALID_EXTENSION: 415,
      UNSUPPORTED_MEDIA_TYPE: 415,
      MAGIC_BYTES_MISMATCH: 415,
      MALICIOUS_CONTENT_DETECTED: 400,
    };
    const httpStatus = statusMap[inspection.errorCode || ''] || 400;
    res.status(httpStatus).json({
      success: false,
      code: inspection.errorCode || 'FILE_VALIDATION_FAILED',
      error: inspection.errorMessage || 'Berkas tidak lolos validasi keamanan server.',
    });
    return;
  }

  // Generate random cryptographic object key (NEVER use user filename as storage path)
  const randomObjectId = crypto.randomUUID();
  const objectFileName = `obj_${randomObjectId}.${inspection.verifiedExtension}`;

  // Sanitize display filename for UI metadata only
  const sanitizedDisplayName = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._\-\s()]/g, '_')
    .slice(0, 120);

  try {
    const receipt = await storageProvider.putObject({
      schoolId: user.schoolId,
      objectFileName,
      buffer: fileBuffer,
      mimeType: inspection.verifiedMimeType!,
    });

    const fileRecord: FileObjectRecord = {
      id: `file-${randomObjectId}`,
      schoolId: user.schoolId,
      ownerId: user.id,
      ownerName: user.name,
      ownerRole: user.role,
      taskId: cleanTaskId || undefined,
      storageKey: receipt.storageKey,
      originalNameSanitized: sanitizedDisplayName,
      mimeType: inspection.verifiedMimeType!,
      sizeBytes: receipt.sizeBytes,
      sha256: receipt.sha256,
      createdAt: new Date().toISOString(),
    };

    runInTransaction(() => {
      db.fileObjects.unshift(fileRecord);
    });

    res.status(201).json({
      success: true,
      message: 'Berkas berhasil divalidasi (Magic Bytes & Anti-Script) dan disimpan di penyimpanan terisolasi.',
      file: {
        id: fileRecord.id,
        schoolId: fileRecord.schoolId,
        ownerId: fileRecord.ownerId,
        ownerName: fileRecord.ownerName,
        taskId: fileRecord.taskId,
        originalName: fileRecord.originalNameSanitized,
        mimeType: fileRecord.mimeType,
        sizeBytes: fileRecord.sizeBytes,
        sha256: fileRecord.sha256,
        createdAt: fileRecord.createdAt,
        downloadUrl: `/api/storage/files/${fileRecord.id}`,
      },
    });
  } catch (err: any) {
    console.error('[STORAGE UPLOAD ERROR]', err?.message || err);
    res.status(500).json({
      success: false,
      code: 'STORAGE_WRITE_ERROR',
      error: 'Gagal menyimpan berkas ke media penyimpanan.',
    });
  }
});

// Read / Download Stored File with Strict RBAC, Ownership & Cross-Tenant Isolation
router.get('/files/:fileId', authenticateToken, enforceSchoolIsolation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const fileId = sanitizeString(req.params.fileId, 100);

  const fileRecord = db.fileObjects.find((f) => f.id === fileId);
  if (!fileRecord) {
    res.status(404).json({
      success: false,
      code: 'FILE_NOT_FOUND',
      error: 'Berkas tidak ditemukan di server.',
    });
    return;
  }

  // 1. Multi-Tenant School Isolation Check
  if (fileRecord.schoolId !== user.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Pelanggaran batas sekolah: Berkas ini milik sekolah [${fileRecord.schoolId}], akun Anda terdaftar di [${user.schoolId}].`,
      userSchoolId: user.schoolId,
      targetSchoolId: fileRecord.schoolId,
    });
    return;
  }

  // 2. Role & Ownership Authorization Check:
  // Students ('siswa') can ONLY read files they uploaded themselves!
  // Teachers ('guru') and Principals ('kepala_sekolah') in the same school can inspect student submissions.
  if (user.role === 'siswa' && fileRecord.ownerId !== user.id) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_FILE_ACCESS',
      error: 'Akses ditolak: Siswa tidak diizinkan membaca atau mengunduh berkas tugas milik pengguna lain.',
      requesterId: user.id,
      fileOwnerId: fileRecord.ownerId,
    });
    return;
  }

  const buffer = await storageProvider.getObjectBuffer(fileRecord.storageKey);
  if (!buffer) {
    res.status(404).json({
      success: false,
      code: 'STORAGE_OBJECT_MISSING',
      error: 'Objek fisik berkas tidak ditemukan pada storage provider.',
    });
    return;
  }

  // Set strict security headers for file delivery
  res.setHeader('Content-Type', fileRecord.mimeType);
  res.setHeader('Content-Length', String(buffer.length));
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileRecord.originalNameSanitized.replace(/"/g, '')}"`
  );
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  res.status(200).send(buffer);
});

export default router;
