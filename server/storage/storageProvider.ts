import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface StoredObjectReceipt {
  storageKey: string;
  sizeBytes: number;
  sha256: string;
  provider: 'local_disk' | 'cloud_object_storage';
}

export interface StorageProviderMetadata {
  providerName: string;
  mode: 'local_disk_secure' | 'gcs_production' | 's3_compatible';
  isExternalCloudConfigured: boolean;
  rootDirectoryOrBucket: string;
  maxUploadBytes: number;
  allowedMimeTypes: string[];
}

export interface IStorageProvider {
  putObject(params: {
    schoolId: string;
    objectFileName: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredObjectReceipt>;
  getObjectBuffer(storageKey: string): Promise<Buffer | null>;
  deleteObject(storageKey: string): Promise<boolean>;
  getProviderMetadata(): StorageProviderMetadata;
}

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB strict limit
export const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);
export const ALLOWED_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export interface FileInspectionResult {
  valid: boolean;
  errorCode?:
    | 'FILE_EMPTY'
    | 'FILE_TOO_LARGE'
    | 'INVALID_EXTENSION'
    | 'MALICIOUS_CONTENT_DETECTED'
    | 'MAGIC_BYTES_MISMATCH'
    | 'UNSUPPORTED_MEDIA_TYPE';
  errorMessage?: string;
  verifiedMimeType?: string;
  verifiedExtension?: string;
  sha256?: string;
  sizeBytes?: number;
}

/**
 * Inspects binary Magic Bytes, file size, extension, and embedded script patterns.
 * NEVER trusts browser-supplied Content-Type header alone.
 */
export function validateAndInspectFileBuffer(
  buffer: Buffer,
  originalFileName: string,
  claimedMimeType?: string
): FileInspectionResult {
  if (!buffer || buffer.length < 8) {
    return {
      valid: false,
      errorCode: 'FILE_EMPTY',
      errorMessage: 'Berkas kosong atau korup (ukuran di bawah batas minimum).',
    };
  }

  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      errorMessage: `Ukuran berkas (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 5 MB.`,
    };
  }

  // Extract extension safely
  const cleanOriginal = path.basename(originalFileName || '').toLowerCase();
  const extMatch = cleanOriginal.match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';

  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      errorCode: 'INVALID_EXTENSION',
      errorMessage: `Ekstensi berkas ".${ext || 'unknown'}" tidak diizinkan. Hanya mendukung .pdf, .jpg, .jpeg, .png, dan .webp.`,
    };
  }

  // 1. Check for executable / script / polyglot signatures in header
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 4096));
  const headerAscii = headerSlice.toString('latin1');

  // Reject Windows PE (MZ) or ELF binaries immediately
  if (
    (buffer[0] === 0x4d && buffer[1] === 0x5a) || // MZ
    (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) // \x7fELF
  ) {
    return {
      valid: false,
      errorCode: 'MALICIOUS_CONTENT_DETECTED',
      errorMessage: 'Berkas ditolak: Terdeteksi signature berkas eksekusi biner (EXE/ELF).',
    };
  }

  // Reject HTML / SVG / PHP / JS script disguised as image or PDF
  const lowerHeader = headerAscii.toLowerCase();
  if (
    lowerHeader.includes('<script') ||
    lowerHeader.includes('<?php') ||
    lowerHeader.includes('<html') ||
    lowerHeader.includes('<!doctype html') ||
    lowerHeader.includes('<svg') ||
    lowerHeader.includes('onload=') ||
    lowerHeader.includes('onerror=')
  ) {
    return {
      valid: false,
      errorCode: 'MALICIOUS_CONTENT_DETECTED',
      errorMessage: 'Berkas ditolak: Terdeteksi injeksi skrip aktif (HTML/SVG/JS/PHP) di dalam konten berkas.',
    };
  }

  // 2. Determine real MIME type strictly from Magic Bytes (File Signature)
  let detectedMime: string | null = null;
  let canonicalExt: string | null = null;

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    detectedMime = 'application/pdf';
    canonicalExt = 'pdf';

    // Additional PDF security scan: block embedded JavaScript or Launch actions
    const fullAscii = buffer.toString('latin1');
    if (
      fullAscii.includes('/JavaScript') ||
      fullAscii.includes('/JS ') ||
      fullAscii.includes('/JS(') ||
      fullAscii.includes('/Launch')
    ) {
      return {
        valid: false,
        errorCode: 'MALICIOUS_CONTENT_DETECTED',
        errorMessage: 'Berkas PDF ditolak: Mengandung objek aktif berbahaya (/JavaScript atau /Launch).',
      };
    }
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = 'image/png';
    canonicalExt = 'png';
  }
  // JPEG: FF D8 FF
  else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedMime = 'image/jpeg';
    canonicalExt = 'jpg';
  }
  // WebP: RIFF....WEBP
  else if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    detectedMime = 'image/webp';
    canonicalExt = 'webp';
  }

  if (!detectedMime || !canonicalExt) {
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_MEDIA_TYPE',
      errorMessage:
        'Konten biner berkas tidak sesuai dengan format PDF, PNG, JPEG, atau WebP yang sah (Magic Bytes tidak valid).',
    };
  }

  // 3. Verify that extension matches the detected binary magic bytes
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  if (normalizedExt !== canonicalExt) {
    return {
      valid: false,
      errorCode: 'MAGIC_BYTES_MISMATCH',
      errorMessage: `Manipulasi berkas terdeteksi: Ekstensi berkas (.${ext}) tidak cocok dengan isi biner asli (${detectedMime}).`,
    };
  }

  // 4. If browser supplied a specific MIME type (other than application/octet-stream), verify consistency
  if (
    claimedMimeType &&
    claimedMimeType !== 'application/octet-stream' &&
    claimedMimeType.toLowerCase() !== detectedMime
  ) {
    return {
      valid: false,
      errorCode: 'MAGIC_BYTES_MISMATCH',
      errorMessage: `Header MIME klaim klien (${claimedMimeType}) tidak sesuai dengan signature biner berkas (${detectedMime}).`,
    };
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    valid: true,
    verifiedMimeType: detectedMime,
    verifiedExtension: canonicalExt,
    sha256,
    sizeBytes: buffer.length,
  };
}

/**
 * Local Disk Secure Storage Provider (Default for Single-Instance / Local Development)
 * Stores files outside public web root inside `.data/uploads/<schoolId>/<random_uuid>.<ext>` with 0600 permissions.
 */
export class LocalDiskStorageProvider implements IStorageProvider {
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), '.data', 'uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true, mode: 0o700 });
    }
  }

  private resolveSafePath(storageKey: string): string | null {
    // Prevent any path traversal attempt (../ or absolute paths)
    const normalizedKey = storageKey.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalizedKey.includes('..')) return null;

    const resolved = path.resolve(this.baseUploadDir, normalizedKey);
    if (!resolved.startsWith(this.baseUploadDir + path.sep)) {
      return null;
    }
    return resolved;
  }

  async putObject(params: {
    schoolId: string;
    objectFileName: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredObjectReceipt> {
    const safeSchoolDir = params.schoolId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = params.objectFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${safeSchoolDir}/${safeFileName}`;

    const fullPath = this.resolveSafePath(storageKey);
    if (!fullPath) {
      throw new Error('Invalid storage key path.');
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    const tempPath = `${fullPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, params.buffer, { mode: 0o600 });
    fs.renameSync(tempPath, fullPath);

    const sha256 = crypto.createHash('sha256').update(params.buffer).digest('hex');

    return {
      storageKey,
      sizeBytes: params.buffer.length,
      sha256,
      provider: 'local_disk',
    };
  }

  async getObjectBuffer(storageKey: string): Promise<Buffer | null> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath);
  }

  async deleteObject(storageKey: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return false;
    }
    fs.unlinkSync(fullPath);
    return true;
  }

  getProviderMetadata(): StorageProviderMetadata {
    const externalBucket = process.env.GCS_BUCKET_NAME || process.env.S3_BUCKET_NAME || '';
    const isCloudConfigured = Boolean(
      process.env.STORAGE_PROVIDER &&
        process.env.STORAGE_PROVIDER !== 'local' &&
        externalBucket
    );

    return {
      providerName: isCloudConfigured
        ? `Cloud Object Storage (${process.env.STORAGE_PROVIDER})`
        : 'LocalDiskStorageProvider (Isolated .data/uploads Vault)',
      mode: isCloudConfigured ? 'gcs_production' : 'local_disk_secure',
      isExternalCloudConfigured: isCloudConfigured,
      rootDirectoryOrBucket: isCloudConfigured ? externalBucket : '.data/uploads/<schoolId>/',
      maxUploadBytes: MAX_UPLOAD_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIMES,
    };
  }
}

export const storageProvider: IStorageProvider = new LocalDiskStorageProvider();
