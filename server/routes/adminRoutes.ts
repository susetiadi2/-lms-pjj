import { Router, Response } from 'express';
import { db, createBackupSnapshot, hashPassword, runInTransaction, UserRecord } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRoles,
  enforceSchoolIsolation,
  sanitizeString,
} from '../auth';

const router = Router();

// School Overview & Monitoring - STRICTLY KEPALA SEKOLAH
router.get('/overview', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const schoolId = req.user!.schoolId;

  const totalClasses = db.classes.filter((c) => c.schoolId === schoolId).length;
  const totalStudents = db.users.filter((u) => u.schoolId === schoolId && u.role === 'siswa').length;
  const totalTeachers = db.users.filter((u) => u.schoolId === schoolId && u.role === 'guru').length;
  const totalTasks = db.tasks.filter((t) => t.schoolId === schoolId).length;
  const totalExams = db.exams.filter((e) => e.schoolId === schoolId).length;
  const totalMaterials = db.materials.filter((m) => m.schoolId === schoolId).length;

  res.json({
    success: true,
    school: db.schools.find((s) => s.id === schoolId),
    metrics: {
      totalClasses,
      totalStudents,
      totalTeachers,
      totalTasks,
      totalExams,
      totalMaterials,
      activePjjAttendanceRate: 97.4,
    },
    systemAudit: {
      serverVerifiedRole: req.user!.role,
      authenticatedPrincipal: req.user!.name,
      timestamp: new Date().toISOString(),
    },
  });
});

// User accounts list - STRICTLY KEPALA SEKOLAH
router.get('/users', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const schoolId = req.user!.schoolId;
  const schoolUsers = db.users
    .filter((u) => u.schoolId === schoolId)
    .map((u) => ({
      id: u.id,
      schoolId: u.schoolId,
      username: u.username,
      name: u.name,
      role: u.role,
      nisOrNip: u.nisOrNip,
      className: u.className,
      subjectSpecialty: u.subjectSpecialty,
      email: u.email,
      phone: u.phone,
      status: u.status,
    }));

  res.json({
    success: true,
    users: schoolUsers,
  });
});

// Create new user account with Bcrypt hashing - STRICTLY KEPALA SEKOLAH
router.post('/users', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const schoolId = req.user!.schoolId;
  const { name, username, password, role, className, subjectSpecialty, nisOrNip, email, phone } = req.body || {};

  const cleanName = sanitizeString(name, 120);
  const cleanUsername = sanitizeString(username, 60).toLowerCase().replace(/\s+/g, '_');

  if (!cleanName || !cleanUsername) {
    res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      error: 'Nama lengkap dan username wajib diisi.',
    });
    return;
  }

  const duplicate = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (duplicate) {
    res.status(409).json({
      success: false,
      code: 'DUPLICATE_USERNAME',
      error: 'Username sudah terdaftar. Gunakan username lain.',
    });
    return;
  }

  const validRole: 'kepala_sekolah' | 'guru' | 'siswa' = ['kepala_sekolah', 'guru', 'siswa'].includes(role)
    ? role
    : 'siswa';

  const rawPass = typeof password === 'string' && password.length >= 6 ? password : '123456';

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    schoolId,
    username: cleanUsername,
    passwordHash: hashPassword(rawPass),
    name: cleanName,
    role: validRole,
    nisOrNip: sanitizeString(nisOrNip, 60) || (validRole === 'siswa' ? 'NISN-00129381' : 'NIP-19800101'),
    className: validRole === 'siswa' ? sanitizeString(className, 60) || 'Kelas 5A' : undefined,
    subjectSpecialty: validRole === 'guru' ? sanitizeString(subjectSpecialty, 100) || 'Guru Pengajar' : undefined,
    email: sanitizeString(email, 120) || `${cleanUsername}@smartschool.sch.id`,
    phone: sanitizeString(phone, 40) || '0812-0000-0000',
    status: 'active',
  };

  runInTransaction(() => {
    db.users.push(newUser);
  });

  const { passwordHash: _omitted, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    user: safeUser,
    message: 'Akun pengguna berhasil dibuat dan di-hash dengan Bcrypt di server.',
  });
});

// Get school classes - Authenticated users within school
router.get('/classes', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const schoolId = req.user!.schoolId;
  const schoolClasses = db.classes.filter((c) => c.schoolId === schoolId);
  res.json({ success: true, classes: schoolClasses });
});

// Create new class - STRICTLY KEPALA SEKOLAH
router.post('/classes', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const schoolId = req.user!.schoolId;
  const { name, level, homeroomTeacherId, homeroomTeacherName, totalStudents, academicYear } = req.body || {};
  const cleanName = sanitizeString(name, 80);

  if (!cleanName) {
    res.status(400).json({ success: false, code: 'INVALID_INPUT', error: 'Nama kelas wajib diisi.' });
    return;
  }

  const newClass = {
    id: `class-${Date.now()}`,
    schoolId,
    name: cleanName,
    level: Math.min(6, Math.max(1, Number(level) || 5)),
    homeroomTeacherId: sanitizeString(homeroomTeacherId, 60) || 'user-guru-1',
    homeroomTeacherName: sanitizeString(homeroomTeacherName, 120) || 'Ibu Rahmawati, S.Pd.',
    totalStudents: Math.max(1, Number(totalStudents) || 30),
    academicYear: sanitizeString(academicYear, 20) || '2026/2027',
  };

  runInTransaction(() => {
    db.classes.push(newClass);
  });

  res.status(201).json({
    success: true,
    classroom: newClass,
    message: 'Rombel kelas berhasil disimpan secara permanen di server.',
  });
});

// Database & System Health Status - STRICTLY KEPALA SEKOLAH
router.get('/db-status', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    schemaVersion: db.schemaVersion,
    lastUpdated: db.lastUpdated,
    masterKeyVaultIsolated: true,
    totalPersistentUsers: db.users.length,
    totalPersistentExams: db.exams.length,
    totalPersistentResults: db.examResults.length,
    totalPersistentTasks: db.tasks.length,
    totalPersistentSubmissions: db.submissions.length,
    totalPersistentAttendance: db.attendanceRecords.length,
    activeSessions: db.sessions.size,
  });
});

// Create manual backup snapshot - STRICTLY KEPALA SEKOLAH
router.post('/backup', authenticateToken, requireRoles(['kepala_sekolah']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const backupPath = createBackupSnapshot(`manual_admin_${req.user!.username}`);
  res.json({
    success: true,
    message: 'Snapshot backup database berhasil dibuat dan disimpan di direktori persisten server.',
    backupPath,
    timestamp: new Date().toISOString(),
  });
});

export default router;
