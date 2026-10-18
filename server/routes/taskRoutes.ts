import { Router, Response } from 'express';
import { db, runInTransaction } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRoles,
  enforceSchoolIsolation,
  sanitizeString,
} from '../auth';

const router = Router();

// Get tasks & submissions for the current user's school (and student isolation)
router.get('/', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const schoolId = user.schoolId;

  let tasks = db.tasks.filter((t) => t.schoolId === schoolId);
  if (user.role === 'siswa' && user.className) {
    tasks = tasks.filter((t) => t.className === user.className);
  }

  // Submissions: Teachers/Principals see all in school; Students only see their own
  const submissions = db.submissions.filter((s) => {
    if (s.schoolId !== schoolId) return false;
    if (user.role === 'siswa') return s.studentId === user.id;
    return true;
  });

  res.json({ success: true, tasks, submissions });
});

// Create task - RESTRICTED TO TEACHER AND PRINCIPAL
router.post('/', authenticateToken, requireRoles(['kepala_sekolah', 'guru']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const { title, subjectId, subjectName, className, description, instructions, dueDate, priority, points, reminder } = req.body || {};
  const cleanTitle = sanitizeString(title, 200);
  const cleanSubjectName = sanitizeString(subjectName, 100);
  const cleanClassName = sanitizeString(className, 60);

  if (!cleanTitle || !cleanSubjectName || !cleanClassName || !dueDate) {
    res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      error: 'Data tugas tidak lengkap (Judul, Mapel, Kelas, dan Tenggat wajib diisi).',
    });
    return;
  }

  const newTask = {
    id: `task-${Date.now()}`,
    schoolId: req.user!.schoolId,
    title: cleanTitle,
    subjectId: sanitizeString(subjectId, 60) || 'sub-1',
    subjectName: cleanSubjectName,
    className: cleanClassName,
    teacherId: req.user!.id,
    teacherName: req.user!.name,
    description: sanitizeString(description, 1500),
    instructions: Array.isArray(instructions)
      ? instructions.map((ins: any) => sanitizeString(ins, 300)).filter(Boolean)
      : ['Ikuti petunjuk pengerjaan dengan cermat.'],
    dueDate,
    priority: ['tinggi', 'sedang', 'rendah'].includes(priority) ? priority : 'sedang',
    points: Math.max(1, Math.min(100, Number(points) || 100)),
    allowFileUpload: true,
    createdAt: new Date().toISOString(),
    reminder: reminder || {
      enabled: true,
      remindMinutesBefore: 120,
      notifySound: true,
      customMessage: `Pengingat tugas: ${cleanTitle}`,
    },
  };

  runInTransaction(() => {
    db.tasks.unshift(newTask);
  });

  res.status(201).json({
    success: true,
    task: newTask,
    message: 'Tugas berhasil dipublikasikan dan disimpan di database server.',
  });
});

// Delete task - RESTRICTED TO TEACHER AND PRINCIPAL
router.delete('/:id', authenticateToken, requireRoles(['kepala_sekolah', 'guru']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const taskId = sanitizeString(req.params.id, 80);
  const targetTask = db.tasks.find((t) => t.id === taskId);

  if (!targetTask) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Tugas tidak ditemukan.' });
    return;
  }

  if (targetTask.schoolId !== req.user!.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Akses ditolak: Tugas ini milik sekolah lain [${targetTask.schoolId}].`,
    });
    return;
  }

  runInTransaction(() => {
    db.tasks = db.tasks.filter((t) => t.id !== taskId);
    db.submissions = db.submissions.filter((s) => s.taskId !== taskId);
  });

  res.json({ success: true, message: 'Tugas berhasil dihapus secara permanen dari server.' });
});

// Submit task by student - Enforces deadline, prevents duplicate submission, and verifies file ownership
router.post('/:id/submit', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const taskId = sanitizeString(req.params.id, 80);
  const { submissionText, fileAttachment, fileObjectId } = req.body || {};
  const user = req.user!;

  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Tugas tidak ditemukan.' });
    return;
  }

  // Cross-tenant protection (P0)
  if (task.schoolId !== user.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Akses ditolak: Tugas ini milik sekolah lain [${task.schoolId}].`,
    });
    return;
  }

  // Check deadline (P1: Prevent submission after deadline)
  if (task.dueDate) {
    const dueTimestamp = new Date(task.dueDate).getTime();
    if (!isNaN(dueTimestamp) && Date.now() > dueTimestamp) {
      res.status(400).json({
        success: false,
        code: 'TASK_DEADLINE_EXCEEDED',
        error: `Tenggat waktu pengumpulan tugas telah berakhir pada ${task.dueDate}. Pengiriman jawaban setelah tenggat waktu ditolak.`,
      });
      return;
    }
  }

  // Check duplicate submission (P1: Prevent duplicate submissions)
  const existingSubmission = db.submissions.find(
    (s) => s.taskId === taskId && s.studentId === user.id
  );
  if (existingSubmission) {
    res.status(409).json({
      success: false,
      code: 'DUPLICATE_SUBMISSION',
      error: 'Tugas ini sudah pernah Anda kumpulkan sebelumnya. Pengumpulan ganda tidak diizinkan.',
      previousSubmission: existingSubmission,
    });
    return;
  }

  const cleanText = sanitizeString(submissionText, 3000);
  let cleanAttachment = sanitizeString(fileAttachment, 300);
  const cleanFileObjectId = sanitizeString(fileObjectId, 100);

  let linkedFileMeta: {
    fileObjectId: string;
    fileMimeType: string;
    fileSizeBytes: number;
    fileSha256: string;
    fileDownloadUrl: string;
  } | null = null;

  // If a stored FileObject ID is referenced, strictly verify existence, school isolation, and ownership
  if (cleanFileObjectId) {
    const fileRecord = db.fileObjects.find((f) => f.id === cleanFileObjectId);
    if (!fileRecord) {
      res.status(404).json({
        success: false,
        code: 'FILE_NOT_FOUND',
        error: 'Berkas lampiran tidak ditemukan pada penyimpanan server.',
      });
      return;
    }
    if (fileRecord.schoolId !== user.schoolId) {
      res.status(403).json({
        success: false,
        code: 'CROSS_TENANT_VIOLATION',
        error: 'Pelanggaran isolasi sekolah: Tidak dapat melampirkan berkas dari sekolah lain.',
      });
      return;
    }
    if (fileRecord.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_FILE_OWNERSHIP',
        error: 'Akses ditolak: Anda hanya dapat melampirkan berkas tugas yang diunggah oleh akun Anda sendiri.',
      });
      return;
    }

    cleanAttachment = fileRecord.originalNameSanitized;
    linkedFileMeta = {
      fileObjectId: fileRecord.id,
      fileMimeType: fileRecord.mimeType,
      fileSizeBytes: fileRecord.sizeBytes,
      fileSha256: fileRecord.sha256,
      fileDownloadUrl: `/api/storage/files/${fileRecord.id}`,
    };
  }

  if (!cleanText && !cleanAttachment) {
    res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      error: 'Jawaban teks atau berkas lampiran wajib diisi.',
    });
    return;
  }

  const newSubmission = {
    id: `sub-${Date.now()}-${user.id}`,
    schoolId: user.schoolId,
    taskId,
    studentId: user.id,
    studentName: user.name,
    className: user.className || task.className,
    submittedAt: new Date().toISOString(),
    submissionText: cleanText,
    fileAttachment: cleanAttachment || undefined,
    ...(linkedFileMeta || {}),
    status: 'diserahkan' as const,
    isLate: false,
  };

  runInTransaction(() => {
    const doubleCheck = db.submissions.find(
      (s) => s.taskId === taskId && s.studentId === user.id
    );
    if (doubleCheck) {
      const conflictErr: any = new Error('Duplicate task submission inside transaction.');
      conflictErr.status = 409;
      conflictErr.code = 'DUPLICATE_SUBMISSION';
      throw conflictErr;
    }
    if (cleanFileObjectId) {
      const fileRec = db.fileObjects.find((f) => f.id === cleanFileObjectId);
      if (fileRec && !fileRec.taskId) {
        fileRec.taskId = taskId;
      }
    }
    db.submissions.unshift(newSubmission);
  });

  res.status(201).json({
    success: true,
    submission: newSubmission,
    message: 'Tugas dan berkas terverifikasi berhasil dikumpulkan tepat waktu.',
  });
});

// Grade task submission - RESTRICTED TO TEACHER AND PRINCIPAL
router.post('/submissions/:id/grade', authenticateToken, requireRoles(['kepala_sekolah', 'guru']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const submissionId = sanitizeString(req.params.id, 80);
  const { score, feedback } = req.body || {};

  const submission = db.submissions.find((s) => s.id === submissionId);
  if (!submission) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Pengumpulan tugas tidak ditemukan.' });
    return;
  }

  // Cross-tenant protection
  if (submission.schoolId !== req.user!.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Akses ditolak: Pengumpulan tugas ini milik sekolah lain [${submission.schoolId}].`,
    });
    return;
  }

  const numericScore = Math.min(100, Math.max(0, Number(score) || 0));
  const cleanFeedback = sanitizeString(feedback, 1000) || 'Sudah diperiksa.';

  runInTransaction(() => {
    submission.score = numericScore;
    submission.feedback = cleanFeedback;
    submission.gradedAt = new Date().toISOString();
    submission.status = 'dinilai';
  });

  res.json({
    success: true,
    submission,
    message: 'Nilai dan umpan balik berhasil disimpan secara permanen di server.',
  });
});

export default router;
