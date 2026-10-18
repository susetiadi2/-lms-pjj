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

// Get attendance records with strict school & student isolation
router.get('/', authenticateToken, enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const schoolId = user.schoolId;

  let records = db.attendanceRecords.filter((a) => a.schoolId === schoolId);
  if (user.role === 'siswa') {
    records = records.filter((a) => a.studentId === user.id || (a.students && Array.isArray(a.students) && a.students.some((s: any) => s.studentId === user.id)));
  }

  const monthly = user.role === 'siswa' ? [] : db.monthlyAttendance.filter((m) => m.schoolId === schoolId);

  res.json({
    success: true,
    attendanceRecords: records,
    monthlySummary: monthly,
  });
});

// Submit daily attendance - ONLY TEACHERS AND PRINCIPALS
router.post('/checkin', authenticateToken, requireRoles(['kepala_sekolah', 'guru']), enforceSchoolIsolation, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const schoolId = user.schoolId;
  const { classId, className, date, students, records } = req.body || {};

  // Support flat daily records array from ClassesView UI or structured class roster
  if (Array.isArray(records) && records.length > 0) {
    const savedRecords: any[] = [];

    runInTransaction(() => {
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const studentId = sanitizeString(r.studentId, 80);
        const recDate = sanitizeString(r.date, 20) || new Date().toISOString().split('T')[0];
        if (!studentId) continue;

        const newRec = {
          id: `att-${Date.now()}-${i}`,
          schoolId,
          studentId,
          studentName: sanitizeString(r.studentName, 120) || 'Siswa',
          className: sanitizeString(r.className, 60) || 'Kelas 5A',
          date: recDate,
          status: ['hadir', 'sakit', 'izin', 'alpa'].includes(r.status) ? r.status : 'hadir',
          note: sanitizeString(r.note, 300),
          checkedByTeacher: user.name,
        };

        const existingIdx = db.attendanceRecords.findIndex(
          (a) => a.schoolId === schoolId && a.studentId === studentId && a.date === recDate
        );

        if (existingIdx >= 0) {
          db.attendanceRecords[existingIdx] = newRec;
        } else {
          db.attendanceRecords.unshift(newRec);
        }
        savedRecords.push(newRec);
      }
    });

    res.json({
      success: true,
      message: 'Presensi harian siswa berhasil diverifikasi dan disimpan secara permanen di database server.',
      records: savedRecords,
    });
    return;
  }

  if (!classId || !students || !Array.isArray(students)) {
    res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      error: 'Data absensi tidak lengkap (classId/students atau records wajib diisi).',
    });
    return;
  }

  const cleanDate = sanitizeString(date, 20) || new Date().toISOString().split('T')[0];
  const cleanClassName = sanitizeString(className, 60) || 'Kelas 5A';
  const savedRecords: any[] = [];

  runInTransaction(() => {
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const studentId = sanitizeString(s.studentId || s.id, 80) || `st-${i}`;
      const newRec = {
        id: `att-${Date.now()}-${i}`,
        schoolId,
        classId: sanitizeString(classId, 60),
        studentId,
        studentName: sanitizeString(s.studentName || s.name, 120) || 'Siswa',
        className: cleanClassName,
        date: cleanDate,
        status: ['hadir', 'sakit', 'izin', 'alpa'].includes(s.status) ? s.status : 'hadir',
        note: sanitizeString(s.note, 300),
        checkedByTeacher: user.name,
      };

      const existingIdx = db.attendanceRecords.findIndex(
        (a) => a.schoolId === schoolId && a.studentId === studentId && a.date === cleanDate
      );
      if (existingIdx >= 0) {
        db.attendanceRecords[existingIdx] = newRec;
      } else {
        db.attendanceRecords.unshift(newRec);
      }
      savedRecords.push(newRec);
    }
  });

  res.json({
    success: true,
    message: 'Presensi kelas berhasil diverifikasi dan disimpan secara permanen di database server.',
    record: {
      classId,
      className: cleanClassName,
      date: cleanDate,
      recordedBy: user.name,
      students: savedRecords,
    },
    records: savedRecords,
  });
});

export default router;
