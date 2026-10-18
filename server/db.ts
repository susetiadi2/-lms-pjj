import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_MATERIALS,
  INITIAL_TASKS,
  INITIAL_SUBMISSIONS,
  INITIAL_EXAMS,
  INITIAL_QUESTION_BANK,
  INITIAL_ACHIEVEMENTS,
  INITIAL_STUDY_GROUPS,
  INITIAL_ATTENDANCE,
  INITIAL_MONTHLY_ATTENDANCE,
} from '../src/data/initialData';
import { INITIAL_EXAM_MASTER_KEYS } from './data/examMasterKeysSeed';

export interface SchoolRecord {
  id: string;
  name: string;
  code: string;
  city: string;
  subscriptionPlan: 'enterprise' | 'standard';
}

export interface UserRecord {
  id: string;
  schoolId: string;
  username: string;
  passwordHash: string; // Strictly Bcrypt ($2a$ or $2b$)
  name: string;
  role: 'kepala_sekolah' | 'guru' | 'siswa';
  nisOrNip: string;
  className?: string;
  subjectSpecialty?: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface SessionRecord {
  token: string;
  csrfToken: string;
  userId: string;
  schoolId: string;
  role: 'kepala_sekolah' | 'guru' | 'siswa';
  createdAt: number;
  expiresAt: number;
}

export interface ExamMasterKey {
  questionId: string;
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface ServerExamRecord {
  id: string;
  schoolId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  className: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  questionsCount: number;
  questions: Array<{
    id: string;
    questionText: string;
    options: { key: string; text: string }[];
    points: number;
  }>;
  isPublished: boolean;
  createdBy: string;
}

export interface ExamResultRecord {
  id: string;
  examId: string;
  examTitle: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  completedAt: string;
  timeSpentSeconds: number;
  evaluatedByServer: boolean;
  serverAuditHash: string;
  itemEvaluations: Array<{
    questionId: string;
    studentChoice: string | null;
    isCorrect: boolean;
    earnedPoints: number;
    maxPoints: number;
    correctAnswer?: string;
    explanation?: string;
  }>;
}

export interface FileObjectRecord {
  id: string;
  schoolId: string;
  ownerId: string;
  ownerName: string;
  ownerRole: 'kepala_sekolah' | 'guru' | 'siswa';
  taskId?: string;
  storageKey: string; // Random UUID path in storage provider (never user filename)
  originalNameSanitized: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  schoolId: string;
  role: 'kepala_sekolah' | 'guru' | 'siswa';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

export interface ServerDatabase {
  schemaVersion: number;
  lastUpdated: string;
  schools: SchoolRecord[];
  users: UserRecord[];
  sessions: Map<string, SessionRecord>;
  classes: any[];
  subjects: any[];
  materials: any[];
  tasks: any[];
  submissions: any[];
  exams: ServerExamRecord[];
  examMasterKeys: Map<string, ExamMasterKey[]>;
  examResults: ExamResultRecord[];
  questionBank: any[];
  achievements: any[];
  studyGroups: any[];
  attendanceRecords: any[];
  monthlyAttendance: any[];
  fileObjects: FileObjectRecord[];
  pushSubscriptions: PushSubscriptionRecord[];
}

export interface SerializableDatabase {
  schemaVersion: number;
  lastUpdated: string;
  schools: SchoolRecord[];
  users: UserRecord[];
  sessions: [string, SessionRecord][];
  classes: any[];
  subjects: any[];
  materials: any[];
  tasks: any[];
  submissions: any[];
  exams: ServerExamRecord[];
  examMasterKeys?: [string, ExamMasterKey[]][];
  examResults: ExamResultRecord[];
  questionBank: any[];
  achievements: any[];
  studyGroups: any[];
  attendanceRecords: any[];
  monthlyAttendance: any[];
  fileObjects?: FileObjectRecord[];
  pushSubscriptions?: PushSubscriptionRecord[];
}

export interface SerializableVault {
  vaultVersion: number;
  lastUpdated: string;
  examMasterKeys: [string, ExamMasterKey[]][];
}

// Persistent storage paths
const DATA_DIR = path.resolve(process.cwd(), '.data');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');
const DB_FILE = path.resolve(DATA_DIR, 'lms_database.json');
const VAULT_FILE = path.resolve(DATA_DIR, 'exam_master_keys.vault.json');
export const CURRENT_SCHEMA_VERSION = 4;

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  }
}

// Strictly Bcrypt password hashing (P0 Requirement: 10 salt rounds)
export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

// Strict Bcrypt password verification (P0 Requirement: no plain SHA-256 allowed)
export function verifyPassword(plain: string, hash: string): boolean {
  if (!plain || !hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compareSync(plain, hash);
  }
  return false;
}

// Backup snapshot helper for safe migrations & disaster recovery
export function createBackupSnapshot(note: string = 'auto'): string {
  ensureDirectories();
  const safeNote = note.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_${timestamp}_${safeNote}.json`;
  const backupPath = path.resolve(BACKUP_DIR, backupFileName);

  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, backupPath);
    if (fs.existsSync(VAULT_FILE)) {
      fs.copyFileSync(VAULT_FILE, `${backupPath}.vault.json`);
    }
    return backupPath;
  }
  return '';
}

function serializeDatabaseState(targetDb: ServerDatabase): {
  dbPayload: SerializableDatabase;
  vaultPayload: SerializableVault;
} {
  const nowIso = new Date().toISOString();
  const dbPayload: SerializableDatabase = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: nowIso,
    schools: targetDb.schools,
    users: targetDb.users,
    sessions: Array.from(targetDb.sessions.entries()),
    classes: targetDb.classes,
    subjects: targetDb.subjects,
    materials: targetDb.materials,
    tasks: targetDb.tasks,
    submissions: targetDb.submissions,
    exams: targetDb.exams,
    examResults: targetDb.examResults,
    questionBank: targetDb.questionBank,
    achievements: targetDb.achievements,
    studyGroups: targetDb.studyGroups,
    attendanceRecords: targetDb.attendanceRecords,
    monthlyAttendance: targetDb.monthlyAttendance,
    fileObjects: targetDb.fileObjects,
    pushSubscriptions: targetDb.pushSubscriptions,
  };

  const vaultPayload: SerializableVault = {
    vaultVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: nowIso,
    examMasterKeys: Array.from(targetDb.examMasterKeys.entries()),
  };

  return { dbPayload, vaultPayload };
}

// Atomic file save to prevent partial writes and isolate examMasterKeys in restricted vault
export function atomicSaveDatabase(targetDb: ServerDatabase = db): void {
  ensureDirectories();
  const suffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const tempDbFile = `${DB_FILE}.tmp.${suffix}`;
  const tempVaultFile = `${VAULT_FILE}.tmp.${suffix}`;

  const { dbPayload, vaultPayload } = serializeDatabaseState(targetDb);

  try {
    fs.writeFileSync(tempVaultFile, JSON.stringify(vaultPayload, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tempVaultFile, VAULT_FILE);
    try {
      fs.chmodSync(VAULT_FILE, 0o600);
    } catch {}

    fs.writeFileSync(tempDbFile, JSON.stringify(dbPayload, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tempDbFile, DB_FILE);
    targetDb.lastUpdated = dbPayload.lastUpdated;
    targetDb.schemaVersion = CURRENT_SCHEMA_VERSION;
  } catch (err) {
    if (fs.existsSync(tempDbFile)) {
      try {
        fs.unlinkSync(tempDbFile);
      } catch {}
    }
    if (fs.existsSync(tempVaultFile)) {
      try {
        fs.unlinkSync(tempVaultFile);
      } catch {}
    }
    console.error('[DATABASE PERSISTENCE ERROR] Failed to save database to disk:', err);
    throw err;
  }
}

// True Atomic Transaction with In-Memory Snapshot Rollback (P1 Requirement)
export function runInTransaction<T>(operation: () => T): T {
  const preTransactionSnapshot = serializeDatabaseState(db);
  const snapshotJson = JSON.stringify(preTransactionSnapshot);

  try {
    const result = operation();
    atomicSaveDatabase(db);
    return result;
  } catch (err) {
    // Rollback in-memory state to exact pre-transaction snapshot
    try {
      const restored = JSON.parse(snapshotJson) as {
        dbPayload: SerializableDatabase;
        vaultPayload: SerializableVault;
      };
      db.schools = restored.dbPayload.schools;
      db.users = restored.dbPayload.users;
      db.sessions = new Map<string, SessionRecord>(restored.dbPayload.sessions);
      db.classes = restored.dbPayload.classes;
      db.subjects = restored.dbPayload.subjects;
      db.materials = restored.dbPayload.materials;
      db.tasks = restored.dbPayload.tasks;
      db.submissions = restored.dbPayload.submissions;
      db.exams = restored.dbPayload.exams;
      db.examResults = restored.dbPayload.examResults;
      db.questionBank = restored.dbPayload.questionBank;
      db.achievements = restored.dbPayload.achievements;
      db.studyGroups = restored.dbPayload.studyGroups;
      db.attendanceRecords = restored.dbPayload.attendanceRecords;
      db.monthlyAttendance = restored.dbPayload.monthlyAttendance;
      db.fileObjects = restored.dbPayload.fileObjects || [];
      db.pushSubscriptions = restored.dbPayload.pushSubscriptions || [];
      db.examMasterKeys = new Map<string, ExamMasterKey[]>(restored.vaultPayload.examMasterKeys);
    } catch (restoreErr) {
      console.error('[DATABASE CRITICAL] Rollback recovery failed:', restoreErr);
    }
    console.error('[DATABASE TRANSACTION ERROR] Transaction rolled back safely:', err);
    throw err;
  }
}

function buildInitialDefaultData(): ServerDatabase {
  const defaultSchools: SchoolRecord[] = [
    {
      id: 'SCH-DIVA-001',
      name: 'SD Smart Learning Mr. DIVA',
      code: 'MRDIVA-JKT',
      city: 'Jakarta Selatan',
      subscriptionPlan: 'enterprise',
    },
    {
      id: 'SCH-ISOLATED-002',
      name: 'SD Perintis Nusantara (Sekolah Lain)',
      code: 'PERINTIS-BDG',
      city: 'Bandung',
      subscriptionPlan: 'standard',
    },
  ];

  const defaultUsers: UserRecord[] = [
    ...INITIAL_USERS.map((u) => ({
      ...u,
      schoolId: 'SCH-DIVA-001',
      passwordHash: hashPassword('123456'),
    })),
    {
      id: 'user-isolated-guru-99',
      schoolId: 'SCH-ISOLATED-002',
      username: 'guru_perintis',
      passwordHash: hashPassword('123456'),
      name: 'Pak Budi Hartono (Sekolah Perintis)',
      role: 'guru',
      nisOrNip: '19880101999999',
      className: 'Kelas 4A',
      subjectSpecialty: 'IPA',
      email: 'budi@perintis.sch.id',
      phone: '08129999999',
      status: 'active',
    },
    {
      id: 'user-isolated-siswa-99',
      schoolId: 'SCH-ISOLATED-002',
      username: 'siswa_perintis',
      passwordHash: hashPassword('123456'),
      name: 'Rian Saputra (Siswa Perintis)',
      role: 'siswa',
      nisOrNip: '20240099',
      className: 'Kelas 4A',
      subjectSpecialty: undefined,
      email: 'rian@perintis.sch.id',
      phone: '08128888888',
      status: 'active',
    },
  ];

  const serverExams: ServerExamRecord[] = [];
  const examMasterKeys = new Map<string, ExamMasterKey[]>();

  for (const exam of INITIAL_EXAMS) {
    const sanitizedQuestions = exam.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    }));

    const seedKeys = INITIAL_EXAM_MASTER_KEYS[exam.id] || [];
    const masterKeys: ExamMasterKey[] = exam.questions.map((q) => {
      const matchedSeed = seedKeys.find((k) => k.questionId === q.id);
      return {
        questionId: q.id,
        correctAnswer: matchedSeed?.correctAnswer || q.correctAnswer || 'A',
        explanation: matchedSeed?.explanation || q.explanation || '',
        points: q.points,
      };
    });

    serverExams.push({
      id: exam.id,
      schoolId: 'SCH-DIVA-001',
      title: exam.title,
      subjectId: exam.subjectId,
      subjectName: exam.subjectName,
      className: exam.className,
      durationMinutes: exam.durationMinutes,
      startDate: exam.startDate,
      endDate: exam.endDate,
      questionsCount: exam.questionsCount,
      questions: sanitizedQuestions,
      isPublished: exam.isPublished,
      createdBy: exam.createdBy,
    });

    examMasterKeys.set(exam.id, masterKeys);
  }

  const isolatedExamId = 'exam-isolated-002';
  serverExams.push({
    id: isolatedExamId,
    schoolId: 'SCH-ISOLATED-002',
    title: 'Ujian IPA Khusus SD Perintis Nusantara',
    subjectId: 'sub-ipa-perintis',
    subjectName: 'IPA Terpadu',
    className: 'Kelas 4A',
    durationMinutes: 45,
    startDate: '2026-03-01T08:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    questionsCount: 2,
    questions: [
      {
        id: 'q-iso-1',
        questionText: 'Bagian tumbuhan yang berfungsi menyerap air dari dalam tanah adalah?',
        options: [
          { key: 'A', text: 'Akar' },
          { key: 'B', text: 'Daun' },
          { key: 'C', text: 'Batang' },
          { key: 'D', text: 'Bunga' },
        ],
        points: 50,
      },
      {
        id: 'q-iso-2',
        questionText: 'Gas yang dibutuhkan tumbuhan untuk fotosintesis adalah?',
        options: [
          { key: 'A', text: 'Oksigen' },
          { key: 'B', text: 'Karbondioksida' },
          { key: 'C', text: 'Nitrogen' },
          { key: 'D', text: 'Hidrogen' },
        ],
        points: 50,
      },
    ],
    isPublished: true,
    createdBy: 'Pak Budi Hartono (Sekolah Perintis)',
  });
  examMasterKeys.set(isolatedExamId, INITIAL_EXAM_MASTER_KEYS[isolatedExamId]);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    schools: defaultSchools,
    users: defaultUsers,
    sessions: new Map<string, SessionRecord>(),
    classes: INITIAL_CLASSES.map((c) => ({ ...c, schoolId: 'SCH-DIVA-001' })),
    subjects: INITIAL_SUBJECTS.map((s) => ({ ...s, schoolId: 'SCH-DIVA-001' })),
    materials: INITIAL_MATERIALS.map((m) => ({ ...m, schoolId: 'SCH-DIVA-001' })),
    tasks: INITIAL_TASKS.map((t) => ({ ...t, schoolId: 'SCH-DIVA-001' })),
    submissions: INITIAL_SUBMISSIONS.map((s) => ({ ...s, schoolId: 'SCH-DIVA-001' })),
    exams: serverExams,
    examMasterKeys,
    examResults: [],
    questionBank: INITIAL_QUESTION_BANK.map((q) => ({ ...q, schoolId: 'SCH-DIVA-001' })),
    achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a, schoolId: 'SCH-DIVA-001' })),
    studyGroups: INITIAL_STUDY_GROUPS.map((g) => ({ ...g, schoolId: 'SCH-DIVA-001' })),
    attendanceRecords: INITIAL_ATTENDANCE.map((att) => ({ ...att, schoolId: 'SCH-DIVA-001' })),
    monthlyAttendance: INITIAL_MONTHLY_ATTENDANCE.map((m) => ({ ...m, schoolId: 'SCH-DIVA-001' })),
    fileObjects: [],
    pushSubscriptions: [],
  };
}

function loadDatabaseFromDisk(): ServerDatabase {
  ensureDirectories();

  if (!fs.existsSync(DB_FILE)) {
    console.log('[DATABASE INIT] Initializing fresh persistent database & restricted master key vault...');
    const freshDb = buildInitialDefaultData();
    atomicSaveDatabase(freshDb);
    return freshDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: SerializableDatabase = JSON.parse(raw);

    let examMasterKeysEntries: [string, ExamMasterKey[]][] = [];
    if (fs.existsSync(VAULT_FILE)) {
      const rawVault = fs.readFileSync(VAULT_FILE, 'utf-8');
      const parsedVault: SerializableVault = JSON.parse(rawVault);
      examMasterKeysEntries = parsedVault.examMasterKeys || [];
    } else if (parsed.examMasterKeys) {
      examMasterKeysEntries = parsed.examMasterKeys;
    }

    const examMasterKeysMap = new Map<string, ExamMasterKey[]>(examMasterKeysEntries);

    for (const [examId, seedKeys] of Object.entries(INITIAL_EXAM_MASTER_KEYS)) {
      const existing = examMasterKeysMap.get(examId);
      if (!existing || existing.length === 0 || existing.some((k) => !k.correctAnswer)) {
        examMasterKeysMap.set(examId, seedKeys);
      }
    }

    let migrated = false;
    if (!parsed.schemaVersion || parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
      console.log(`[DATABASE MIGRATION] Upgrading database from v${parsed.schemaVersion || 1} to v${CURRENT_SCHEMA_VERSION}...`);
      createBackupSnapshot(`premigration_v${parsed.schemaVersion || 1}`);

      if (parsed.users) {
        for (const user of parsed.users) {
          if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
            user.passwordHash = hashPassword('123456');
          }
        }
      }

      if (parsed.exams) {
        for (const ex of parsed.exams) {
          ex.questions = (ex.questions || []).map((q: any) => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            points: q.points,
          }));
        }
      }

      migrated = true;
    }

    const now = Date.now();
    const sessionsMap = new Map<string, SessionRecord>();
    for (const [token, sess] of parsed.sessions || []) {
      if (sess && sess.expiresAt > now) {
        if (!sess.csrfToken) {
          sess.csrfToken = crypto.randomBytes(24).toString('hex');
          migrated = true;
        }
        sessionsMap.set(token, sess);
      } else {
        migrated = true;
      }
    }

    const loadedDb: ServerDatabase = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      schools: parsed.schools || [],
      users: parsed.users || [],
      sessions: sessionsMap,
      classes: parsed.classes || [],
      subjects: parsed.subjects || [],
      materials: parsed.materials || [],
      tasks: parsed.tasks || [],
      submissions: parsed.submissions || [],
      exams: parsed.exams || [],
      examMasterKeys: examMasterKeysMap,
      examResults: parsed.examResults || [],
      questionBank: parsed.questionBank || [],
      achievements: parsed.achievements || [],
      studyGroups: parsed.studyGroups || [],
      attendanceRecords: parsed.attendanceRecords || [],
      monthlyAttendance: parsed.monthlyAttendance || [],
      fileObjects: parsed.fileObjects || [],
      pushSubscriptions: parsed.pushSubscriptions || [],
    };

    if (migrated || !fs.existsSync(VAULT_FILE)) {
      atomicSaveDatabase(loadedDb);
      console.log(`[DATABASE MIGRATION] Schema v${CURRENT_SCHEMA_VERSION} persisted with fileObjects & pushSubscriptions.`);
    }

    console.log(
      `[DATABASE RESTORE] Hydrated Schema v${loadedDb.schemaVersion}: ${loadedDb.users.length} users, ${loadedDb.fileObjects.length} stored files.`
    );
    return loadedDb;
  } catch (err) {
    console.error('[DATABASE RECOVERY] Failed to parse database file. Creating recovery backup...', err);
    createBackupSnapshot('corrupted_recovery');
    const freshDb = buildInitialDefaultData();
    atomicSaveDatabase(freshDb);
    return freshDb;
  }
}

export const db: ServerDatabase = loadDatabaseFromDisk();

export function createSession(user: UserRecord, ttlMs: number = 7 * 24 * 60 * 60 * 1000): SessionRecord {
  const token = `mrd_sess_${crypto.randomBytes(32).toString('hex')}`;
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const session: SessionRecord = {
    token,
    csrfToken,
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    createdAt: now,
    expiresAt: now + ttlMs,
  };

  db.sessions.set(token, session);
  atomicSaveDatabase(db);
  return session;
}

export function getSession(token: string): SessionRecord | undefined {
  if (!token) return undefined;
  const session = db.sessions.get(token);
  if (!session) return undefined;

  if (Date.now() > session.expiresAt) {
    db.sessions.delete(token);
    atomicSaveDatabase(db);
    return undefined;
  }
  return session;
}

export function revokeSession(token: string): boolean {
  if (!token) return false;
  const existed = db.sessions.delete(token);
  if (existed) {
    atomicSaveDatabase(db);
  }
  return existed;
}
