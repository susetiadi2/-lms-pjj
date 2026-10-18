import { Router, Response } from 'express';
import { db, runInTransaction, ExamResultRecord } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRoles,
  enforceSchoolIsolation,
  sanitizeString,
} from '../auth';

const router = Router();

// List exams & persistent examResults for the user's school
router.get('/', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const schoolId = user.schoolId;

  let exams = db.exams.filter((e) => e.schoolId === schoolId);
  if (user.role === 'siswa') {
    exams = exams.filter((e) => e.isPublished);
  }

  const summary = exams.map((e) => ({
    id: e.id,
    title: e.title,
    subjectId: e.subjectId,
    subjectName: e.subjectName,
    className: e.className,
    durationMinutes: e.durationMinutes,
    startDate: e.startDate,
    endDate: e.endDate,
    questionsCount: e.questionsCount,
    isPublished: e.isPublished,
    createdBy: e.createdBy,
    questions: e.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    })),
  }));

  // Filter examResults by schoolId and (if student) by studentId
  const results = db.examResults.filter((r) => {
    if (r.schoolId !== schoolId) return false;
    if (user.role === 'siswa') return r.studentId === user.id;
    return true;
  });

  res.json({ success: true, exams: summary, examResults: results });
});

// Get single exam details - STRICT REDACTION FOR STUDENTS & CROSS-TENANT CHECK
router.get('/:id', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const examId = sanitizeString(req.params.id, 80);
  const targetExam = db.exams.find((e) => e.id === examId);

  if (!targetExam) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Ujian tidak ditemukan.' });
    return;
  }

  // Multi-tenant check (P0 requirement)
  if (targetExam.schoolId !== req.user?.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Pelanggaran batas sekolah: Ujian ini milik sekolah [${targetExam.schoolId}]. Akun Anda terdaftar di [${req.user?.schoolId}].`,
      userSchoolId: req.user?.schoolId,
      targetSchoolId: targetExam.schoolId,
    });
    return;
  }

  const isTeacherOrPrincipal = req.user?.role === 'guru' || req.user?.role === 'kepala_sekolah';

  if (isTeacherOrPrincipal) {
    const masterKeys = db.examMasterKeys.get(examId) || [];
    const fullQuestions = targetExam.questions.map((q) => {
      const keyInfo = masterKeys.find((k) => k.questionId === q.id);
      return {
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        points: q.points,
        correctAnswer: keyInfo?.correctAnswer || '',
        explanation: keyInfo?.explanation || '',
      };
    });

    res.json({
      success: true,
      exam: {
        ...targetExam,
        questions: fullQuestions,
      },
      securityNotice: 'Akses Guru/Kepala Sekolah: Kunci jawaban lengkap ditampilkan dari vault server.',
    });
    return;
  }

  // Student check: must be published
  if (!targetExam.isPublished) {
    res.status(403).json({
      success: false,
      code: 'EXAM_NOT_PUBLISHED',
      error: 'Ujian ini belum dipublikasikan untuk siswa.',
    });
    return;
  }

  // FOR STUDENTS: SANITIZE AND REDACT COMPLETELY!
  const sanitizedQuestions = targetExam.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    points: q.points,
  }));

  const existingSubmission = db.examResults.find(
    (r) => r.examId === examId && r.studentId === req.user!.id
  );

  res.json({
    success: true,
    alreadySubmitted: !!existingSubmission,
    previousResult: existingSubmission
      ? {
          id: existingSubmission.id,
          score: existingSubmission.score,
          completedAt: existingSubmission.completedAt,
          serverAuditHash: existingSubmission.serverAuditHash,
        }
      : undefined,
    exam: {
      id: targetExam.id,
      title: targetExam.title,
      subjectId: targetExam.subjectId,
      subjectName: targetExam.subjectName,
      className: targetExam.className,
      durationMinutes: targetExam.durationMinutes,
      startDate: targetExam.startDate,
      endDate: targetExam.endDate,
      questionsCount: targetExam.questionsCount,
      isPublished: targetExam.isPublished,
      createdBy: targetExam.createdBy,
      questions: sanitizedQuestions,
    },
    securityNotice: 'Akses Siswa: Kunci jawaban dan penjelasan telah diisolasi dan dirahasiakan di sisi server.',
  });
});

// SUBMIT EXAM & SERVER-SIDE EVALUATION
router.post('/:id/submit', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const examId = sanitizeString(req.params.id, 80);
  const user = req.user!;
  const targetExam = db.exams.find((e) => e.id === examId);

  if (!targetExam) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Ujian tidak ditemukan.' });
    return;
  }

  // Cross-tenant protection (P0)
  if (targetExam.schoolId !== user.schoolId) {
    res.status(403).json({
      success: false,
      code: 'CROSS_TENANT_VIOLATION',
      error: `Akses ditolak: Ujian milik sekolah lain [${targetExam.schoolId}].`,
    });
    return;
  }

  if (!targetExam.isPublished) {
    res.status(403).json({
      success: false,
      code: 'EXAM_NOT_PUBLISHED',
      error: 'Ujian belum dibuka untuk pengumpulan jawaban.',
    });
    return;
  }

  // Check deadline (P1: Prevent submission after deadline)
  if (targetExam.endDate) {
    const endTimestamp = new Date(targetExam.endDate).getTime();
    if (!isNaN(endTimestamp) && Date.now() > endTimestamp) {
      res.status(400).json({
        success: false,
        code: 'EXAM_DEADLINE_EXCEEDED',
        error: `Tenggat waktu pengerjaan ujian telah berakhir pada ${targetExam.endDate}. Pengumpulan jawaban ditolak oleh sistem.`,
      });
      return;
    }
  }

  const { answers, timeSpentSeconds, clientProvidedScore, score: injectedScore } = req.body || {};

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    res.status(400).json({ success: false, code: 'INVALID_INPUT', error: 'Format jawaban tidak valid.' });
    return;
  }

  // Fetch secret server-side master key from isolated vault
  const masterKeys = db.examMasterKeys.get(examId);
  if (!masterKeys || masterKeys.length === 0) {
    res.status(500).json({ success: false, code: 'MASTER_KEY_MISSING', error: 'Kunci jawaban master server tidak ditemukan.' });
    return;
  }

  // Check duplicate submission BEFORE and INSIDE atomic transaction (P1)
  const preExistingResult = db.examResults.find((r) => r.examId === examId && r.studentId === user.id);
  if (preExistingResult) {
    res.status(409).json({
      success: false,
      code: 'DUPLICATE_SUBMISSION',
      error: 'Ujian ini sudah pernah Anda kumpulkan sebelumnya. Pengumpulan ganda tidak diizinkan demi integritas akademik.',
      previousResult: {
        id: preExistingResult.id,
        score: preExistingResult.score,
        completedAt: preExistingResult.completedAt,
      },
    });
    return;
  }

  // Evaluate answers strictly on server using vault master keys
  let totalPointsEarned = 0;
  let maxPoints = 0;
  let correctCount = 0;
  const itemEvaluations: any[] = [];

  for (const key of masterKeys) {
    maxPoints += key.points;
    const rawChoice = answers[key.questionId];
    const studentChoice = typeof rawChoice === 'string' ? rawChoice.trim().slice(0, 10) : null;
    const isCorrect = studentChoice === key.correctAnswer;

    if (isCorrect) {
      totalPointsEarned += key.points;
      correctCount += 1;
    }

    itemEvaluations.push({
      questionId: key.questionId,
      studentChoice,
      isCorrect,
      earnedPoints: isCorrect ? key.points : 0,
      maxPoints: key.points,
      correctAnswer: key.correctAnswer,
      explanation: key.explanation,
    });
  }

  const normalizedScore = maxPoints > 0 ? Math.round((totalPointsEarned / maxPoints) * 100) : 0;
  const isPassed = normalizedScore >= 75;
  const claimedScore = clientProvidedScore !== undefined ? clientProvidedScore : injectedScore;

  const resultRecord: ExamResultRecord = {
    id: `res-${Date.now()}-${user.id}`,
    examId,
    examTitle: targetExam.title,
    schoolId: user.schoolId,
    studentId: user.id,
    studentName: user.name,
    className: user.className || targetExam.className,
    score: normalizedScore,
    correctCount,
    totalQuestions: masterKeys.length,
    isPassed,
    completedAt: new Date().toISOString(),
    timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
    evaluatedByServer: true,
    serverAuditHash: `SRV_VERIFIED_${normalizedScore}_PTS_${Date.now()}`,
    itemEvaluations,
  };

  // Atomic database transaction with rollback protection
  runInTransaction(() => {
    const doubleCheck = db.examResults.find((r) => r.examId === examId && r.studentId === user.id);
    if (doubleCheck) {
      const conflictErr: any = new Error('Duplicate submission detected inside transaction.');
      conflictErr.status = 409;
      conflictErr.code = 'DUPLICATE_SUBMISSION';
      throw conflictErr;
    }
    db.examResults.push(resultRecord);
  });

  res.json({
    success: true,
    evaluatedOnServer: true,
    tamperingDetected: claimedScore !== undefined && Number(claimedScore) !== normalizedScore,
    clientScoreIgnored: claimedScore !== undefined,
    result: {
      id: resultRecord.id,
      examId: resultRecord.examId,
      examTitle: resultRecord.examTitle,
      studentId: resultRecord.studentId,
      studentName: resultRecord.studentName,
      className: resultRecord.className,
      score: normalizedScore,
      correctCount,
      totalQuestions: masterKeys.length,
      isPassed,
      completedAt: resultRecord.completedAt,
      serverAuditHash: resultRecord.serverAuditHash,
      itemEvaluations,
    },
  });
});

// CREATE EXAM - ONLY TEACHERS AND PRINCIPALS
router.post('/', authenticateToken, requireRoles(['kepala_sekolah', 'guru']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const { title, subjectId, subjectName, className, durationMinutes, questions, startDate, endDate } = req.body || {};
  const cleanTitle = sanitizeString(title, 200);

  if (!cleanTitle || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      error: 'Data ujian tidak lengkap (judul dan minimal 1 butir soal wajib ada).',
    });
    return;
  }

  const examId = `exam-${Date.now()}`;
  const sanitizedQuestions: any[] = [];
  const masterKeys: any[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qId = sanitizeString(q.id, 60) || `q-${examId}-${i + 1}`;
    sanitizedQuestions.push({
      id: qId,
      questionText: sanitizeString(q.questionText, 1000),
      options: Array.isArray(q.options) ? q.options : [],
      points: Math.max(1, Number(q.points) || 20),
    });

    masterKeys.push({
      questionId: qId,
      correctAnswer: sanitizeString(q.correctAnswer, 10) || 'A',
      explanation: sanitizeString(q.explanation, 1000),
      points: Math.max(1, Number(q.points) || 20),
    });
  }

  const newExam = {
    id: examId,
    schoolId: req.user!.schoolId,
    title: cleanTitle,
    subjectId: sanitizeString(subjectId, 60) || 'sub-1',
    subjectName: sanitizeString(subjectName, 100) || 'Umum',
    className: sanitizeString(className, 60) || 'Kelas 5A',
    durationMinutes: Math.max(5, Math.min(300, Number(durationMinutes) || 60)),
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    questionsCount: sanitizedQuestions.length,
    questions: sanitizedQuestions,
    isPublished: true,
    createdBy: req.user!.name,
  };

  runInTransaction(() => {
    db.exams.push(newExam);
    db.examMasterKeys.set(examId, masterKeys);
  });

  res.status(201).json({
    success: true,
    message: 'Ujian berhasil dibuat dengan pemisahan kunci jawaban master di vault server.',
    exam: newExam,
  });
});

export default router;
