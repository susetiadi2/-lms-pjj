import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { AttendanceStatus, DailyAttendanceRecord } from '../types/lms';
import {
  GraduationCap,
  Users,
  Plus,
  Search,
  CheckCircle,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Download,
  Printer,
  Check,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateMonthlyAttendancePdf } from '../utils/pdfGenerator';

export const ClassesView: React.FC = () => {
  const {
    classes,
    addClass,
    currentUser,
    users,
    attendanceRecords,
    monthlyAttendance,
    saveDailyAttendance,
  } = useLms();

  const [activeTab, setActiveTab] = useState<'rombel' | 'presensi_harian' | 'laporan_bulanan'>('rombel');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Class Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState(5);
  const [teacherName, setTeacherName] = useState('Ibu Rahmawati, S.Pd.');
  const [totalStudents, setTotalStudents] = useState(30);

  // Teacher Daily Check-in State
  const todayStr = '2026-10-18';
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState('Kelas 5A');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Principal Monthly Report State
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2026');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);
  const [isSignedByPrincipal, setIsSignedByPrincipal] = useState(true);

  const isPrincipal = currentUser?.role === 'kepala_sekolah';
  const isTeacherOrPrincipal = currentUser?.role === 'guru' || currentUser?.role === 'kepala_sekolah';

  // Filter students belonging to selected class (or general students if demo list is small)
  const studentsInClass = users.filter((u) => u.role === 'siswa');

  // Local state for daily attendance sheet: studentId -> { status, note }
  const [dailySheet, setDailySheet] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => {
    const initialMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    studentsInClass.forEach((st) => {
      // Find previous record if exists
      const prev = attendanceRecords.find((r) => r.studentId === st.id && r.date === selectedDate);
      initialMap[st.id] = {
        status: prev ? prev.status : 'hadir',
        note: prev?.note || '',
      };
    });
    return initialMap;
  });

  // When class or date changes, re-sync dailySheet
  const handleDateOrClassChange = (newDate: string, newClass: string) => {
    setSelectedDate(newDate);
    setSelectedClassForAttendance(newClass);
    const newMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    studentsInClass.forEach((st) => {
      const prev = attendanceRecords.find((r) => r.studentId === st.id && r.date === newDate);
      newMap[st.id] = {
        status: prev ? prev.status : 'hadir',
        note: prev?.note || '',
      };
    });
    setDailySheet(newMap);
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setDailySheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSetStudentNote = (studentId: string, note: string) => {
    setDailySheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setDailySheet((prev) => {
      const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
      Object.keys(prev).forEach((stId) => {
        updated[stId] = {
          ...prev[stId],
          status: 'hadir',
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = () => {
    const recordsToSave: Omit<DailyAttendanceRecord, 'id'>[] = studentsInClass.map((st) => {
      const data = dailySheet[st.id] || { status: 'hadir', note: '' };
      return {
        studentId: st.id,
        studentName: st.name,
        className: selectedClassForAttendance,
        date: selectedDate,
        status: data.status,
        note: data.note,
        checkedByTeacher: currentUser?.name || 'Ibu Rahmawati, S.Pd.',
      };
    });

    saveDailyAttendance(recordsToSave);
    setSaveSuccessToast(true);
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
    setTimeout(() => setSaveSuccessToast(false), 3500);
  };

  const handleExportMonthlyPdf = () => {
    setIsExportingPdf(true);
    try {
      generateMonthlyAttendancePdf({
        month: selectedMonth,
        principalName: 'Mr. DIVA, M.Pd.',
        totalStudentsSchool: 331,
        overallAttendanceRate: 97.2,
        effectiveDays: 22,
        summaries: monthlyAttendance,
      });
      setPdfSuccessToast(true);
      confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
      setTimeout(() => setPdfSuccessToast(false), 4000);
    } catch (err) {
      console.error('Failed to export attendance PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addClass({
      name,
      level,
      homeroomTeacherId: 'guru-1',
      homeroomTeacherName: teacherName,
      totalStudents: Number(totalStudents),
      academicYear: '2026/2027',
    });
    setIsModalOpen(false);
    setName('');
  };

  const filteredClasses = classes.filter((cls) => {
    const matchSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.homeroomTeacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = selectedLevel === 'all' || cls.level.toString() === selectedLevel;
    return matchSearch && matchLevel;
  });

  // Calculate live daily stats for selected class
  const dailyCounts = {
    hadir: Object.values(dailySheet).filter((s) => s.status === 'hadir').length,
    sakit: Object.values(dailySheet).filter((s) => s.status === 'sakit').length,
    izin: Object.values(dailySheet).filter((s) => s.status === 'izin').length,
    alpa: Object.values(dailySheet).filter((s) => s.status === 'alpa').length,
  };
  const totalChecked = Object.keys(dailySheet).length || 1;
  const dailyRate = Math.round((dailyCounts.hadir / totalChecked) * 100);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Manajemen Kelas, Presensi & Laporan Kehadiran
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data rombel kelas, pencatatan presensi harian oleh guru, dan laporan rekapitulasi kehadiran bulanan untuk Kepala Sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'laporan_bulanan' && (
            <button
              onClick={handleExportMonthlyPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Unduh berkas PDF laporan bulanan untuk Kepala Sekolah"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Mengunduh...' : 'Unduh Rekap PDF'}</span>
            </button>
          )}

          {isPrincipal && activeTab === 'rombel' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rombel Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rombel')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rombel'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Daftar Rombel Kelas ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('presensi_harian')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'presensi_harian'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Presensi Harian Siswa (Guru)</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan_bulanan')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'laporan_bulanan'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Laporan Presensi Bulanan (Kepala Sekolah)</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR ROMBEL KELAS */}
      {activeTab === 'rombel' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama kelas atau wali kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
              />
            </div>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
            >
              <option value="all">Semua Tingkat (1 - 6)</option>
              <option value="1">Tingkat 1</option>
              <option value="2">Tingkat 2</option>
              <option value="3">Tingkat 3</option>
              <option value="4">Tingkat 4</option>
              <option value="5">Tingkat 5</option>
              <option value="6">Tingkat 6</option>
            </select>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-slate-800">{cls.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Tingkat {cls.level}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <p>
                      <span className="text-slate-400">Wali Kelas:</span>{' '}
                      <span className="font-semibold text-slate-700">{cls.homeroomTeacherName}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Tahun Ajaran:</span> {cls.academicYear}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700">{cls.totalStudents}</span> Murid
                  </span>

                  <button
                    onClick={() => {
                      setSelectedClassForAttendance(cls.name);
                      setActiveTab('presensi_harian');
                    }}
                    className="text-[#3d6053] font-semibold text-[11px] bg-[#eef5f1] hover:bg-[#dcefe5] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Buka Presensi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRESENSI HARIAN SISWA (TEACHER-FACING ATTENDANCE TRACKER) */}
      {activeTab === 'presensi_harian' && (
        <div className="space-y-5">
          {/* Controls Bar: Date, Class selector & Batch action */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Tanggal Presensi
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3d6053]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateOrClassChange(e.target.value, selectedClassForAttendance)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Pilih Rombel Kelas
                </label>
                <select
                  value={selectedClassForAttendance}
                  onChange={(e) => handleDateOrClassChange(selectedDate, e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name} ({cls.homeroomTeacherName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tandai semua siswa hadir sekaligus"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tandai Semua Hadir</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Simpan Presensi Hari Ini</span>
              </button>
            </div>
          </div>

          {/* Real-time Attendance Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tingkat Kehadiran
              </span>
              <span className="text-2xl font-extrabold text-[#3d6053] block mt-0.5">{dailyRate}%</span>
              <span className="text-[10px] text-emerald-600 font-medium">Memenuhi Target</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Hadir (H)
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">{dailyCounts.hadir}</span>
              <span className="text-[10px] text-emerald-600">Siswa Aktif</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Sakit (S)
              </span>
              <span className="text-2xl font-extrabold text-amber-700 block mt-0.5">{dailyCounts.sakit}</span>
              <span className="text-[10px] text-amber-600">Surat Dokter</span>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Izin (I)
              </span>
              <span className="text-2xl font-extrabold text-blue-700 block mt-0.5">{dailyCounts.izin}</span>
              <span className="text-[10px] text-blue-600">Pemberitahuan Wali</span>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Alpa (A)
              </span>
              <span className="text-2xl font-extrabold text-rose-700 block mt-0.5">{dailyCounts.alpa}</span>
              <span className="text-[10px] text-rose-600">Tanpa Keterangan</span>
            </div>
          </div>

          {/* Student Roster Table for Daily Check-in */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Daftar Presensi: {selectedClassForAttendance}
                </h3>
                <p className="text-xs text-slate-400">
                  Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Pencatat: {currentUser?.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4 text-center">Status Kehadiran</th>
                    <th className="py-3 px-4">Keterangan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {studentsInClass.map((st, idx) => {
                    const studentSheet = dailySheet[st.id] || { status: 'hadir', note: '' };

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#eef5f1] text-[#3d6053] font-bold flex items-center justify-center text-xs">
                              {st.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800">{st.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{st.nisOrNip}</td>
                        <td className="py-3 px-4">
                          {/* Segmented Button Controls */}
                          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl max-w-xs mx-auto">
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'hadir')}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                studentSheet.status === 'hadir'
                                  ? 'bg-[#3d6053] text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Hadir
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'sakit')}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                studentSheet.status === 'sakit'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Sakit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'izin')}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                studentSheet.status === 'izin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Izin
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, 'alpa')}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                studentSheet.status === 'alpa'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Alpa
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Tulis keterangan jika sakit/izin..."
                            value={studentSheet.note}
                            onChange={(e) => handleSetStudentNote(st.id, e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#3d6053]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Data presensi akan otomatis terakumulasi dalam laporan bulanan Kepala Sekolah.
              </span>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
              >
                Simpan Presensi Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN BULANAN KEPALA SEKOLAH (PRINCIPAL MONTHLY ATTENDANCE REPORT) */}
      {activeTab === 'laporan_bulanan' && (
        <div className="space-y-5">
          {/* Top Monthly Filter & Audit Verification */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-4 h-4 text-[#3d6053]" />
                <span>Pilih Periode Bulan Rekapitulasi:</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="Oktober 2026">Oktober 2026 (Bulan Berjalan)</option>
                <option value="September 2026">September 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar</span>
              </button>

              <button
                type="button"
                onClick={handleExportMonthlyPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 bg-[#3d6053] hover:bg-[#325045] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Mengunduh...' : 'Unduh Dokumen PDF'}</span>
              </button>
            </div>
          </div>

          {/* School-wide KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Rata-rata Kehadiran Sekolah
              </span>
              <div className="text-3xl font-extrabold text-[#3d6053] flex items-center gap-1">
                <span>97.2%</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                Target Kemenag/Kemdikbud: &gt;95%
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Hari Belajar Efektif
              </span>
              <div className="text-3xl font-extrabold text-slate-800">22 Hari</div>
              <span className="text-[11px] text-slate-400 mt-1 block">Periode {selectedMonth}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Total Siswa Terpantau
              </span>
              <div className="text-3xl font-extrabold text-slate-800">331 Siswa</div>
              <span className="text-[11px] text-slate-400 mt-1 block">11 Rombongan Belajar</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tingkat Kehadiran Terbaik
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 truncate">
                Kelas 6A (98.9%)
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Wali: Pak Bambang, M.Pd.</span>
            </div>
          </div>

          {/* Monthly Table for all 11 Classes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Rekapitulasi Kehadiran per Rombel Kelas ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-400">
                  Data akumulasi presensi siswa untuk monitoring pimpinan sekolah.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Disahkan oleh Mr. DIVA, M.Pd.</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3d6053] text-white">
                  <tr>
                    <th className="py-3 px-4">Rombel Kelas</th>
                    <th className="py-3 px-4 text-center">Tingkat</th>
                    <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                    <th className="py-3 px-4 text-center">Hari Efektif</th>
                    <th className="py-3 px-4 text-center">Hadir (H)</th>
                    <th className="py-3 px-4 text-center">Sakit (S)</th>
                    <th className="py-3 px-4 text-center">Izin (I)</th>
                    <th className="py-3 px-4 text-center">Alpa (A)</th>
                    <th className="py-3 px-4 text-center">% Kehadiran</th>
                    <th className="py-3 px-4 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyAttendance.map((m) => (
                    <tr key={m.className} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{m.className}</td>
                      <td className="py-3 px-4 text-center">Tingkat {m.level}</td>
                      <td className="py-3 px-4 text-center font-semibold">{m.totalStudents}</td>
                      <td className="py-3 px-4 text-center">{m.effectiveDays}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#3d6053]">{m.totalHadir}</td>
                      <td className="py-3 px-4 text-center text-amber-700">{m.totalSakit}</td>
                      <td className="py-3 px-4 text-center text-blue-700">{m.totalIzin}</td>
                      <td className="py-3 px-4 text-center text-rose-700 font-bold">{m.totalAlpa}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-extrabold text-[#3d6053]">{m.hadirRate}%</span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#3d6053] h-1.5 rounded-full"
                              style={{ width: `${m.hadirRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          Memenuhi Target
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Preview */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="border border-slate-200 bg-white p-4 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Koordinator Presensi & Kesiswaan:</span>
                <p className="font-bold text-slate-800 mt-1">Ibu Rahmawati, S.Pd.</p>
                <p className="text-[10px] text-slate-400">NIP. 19850320 200801 2 014</p>
                <span className="inline-block mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  ✓ Data diverifikasi tanggal 18 Oktober 2026
                </span>
              </div>

              <div className="border border-slate-200 bg-white p-4 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Disahkan oleh Kepala Sekolah:</span>
                <p className="font-bold text-slate-800 mt-1">Mr. DIVA, M.Pd.</p>
                <p className="text-[10px] text-slate-400">NIP. 19790514 200312 1 002</p>
                <span className="inline-block mt-2 text-[10px] text-[#3d6053] bg-[#eef5f1] px-2 py-0.5 rounded border border-[#dcebe3] font-bold">
                  ✓ Lembar Pengesahan Resmi Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Rombel Kelas Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Daftarkan kelas baru untuk monitoring dan distribusi kurikulum PJJ.
            </p>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 3C atau Kelas Unggulan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Kelas</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <option key={l} value={l}>
                        Tingkat {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah Siswa</label>
                  <input
                    type="number"
                    required
                    value={totalStudents}
                    onChange={(e) => setTotalStudents(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast: Save Daily Attendance Success */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2d4c41] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-[#3d6053]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs">Presensi Berhasil Disimpan!</p>
            <p className="text-[11px] text-emerald-200/90">
              Data kehadiran {selectedClassForAttendance} tanggal {selectedDate} telah diperbarui.
            </p>
          </div>
        </div>
      )}

      {/* Toast: Monthly PDF Success */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2d4c41] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-[#3d6053]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs">Dokumen Rekap Presensi Diunduh!</p>
            <p className="text-[11px] text-emerald-200/90">
              Laporan presensi bulanan ({selectedMonth}) siap ditandatangani Kepala Sekolah.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
