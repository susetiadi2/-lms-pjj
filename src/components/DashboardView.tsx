import React from 'react';
import { useLms } from '../context/LmsContext';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    classes,
    materials,
    tasks,
    submissions,
    exams,
    setActiveTab,
    monitoringStats,
    setIsSecurityModalOpen,
    isRoleTampered,
    serverVerifiedRole,
  } = useLms();

  // Helper for formatting time
  const getDueStatus = (dueDateStr: string) => {
    const diff = new Date(dueDateStr).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (diff < 0) return { text: 'Sudah Lewat', color: 'text-rose-600 bg-rose-50' };
    if (hours <= 3) return { text: `Sisa ${hours} Jam!`, color: 'text-rose-700 bg-rose-100 font-bold' };
    if (hours <= 24) return { text: `Hari Ini (${hours} jam)`, color: 'text-amber-700 bg-amber-100' };
    const days = Math.round(hours / 24);
    return { text: `${days} Hari Lagi`, color: 'text-emerald-700 bg-emerald-100' };
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner (Faithful to Screenshot 2) */}
      <div className="relative overflow-hidden bg-[#3d6053] rounded-2xl p-6 sm:p-8 md:p-10 text-white shadow-sm">
        {/* Subtle background decorative shapes */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-80 h-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-[#f5cf7b] mb-2">
            RINGKASAN HARI INI
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
            Ruang belajar yang rapi, langkah yang berarti.
          </h2>
          <p className="text-white/80 text-sm sm:text-base font-normal">
            Kelola aktivitas belajar tanpa terasa rumit.
          </p>
        </div>

        {/* Graduation cap illustration emblem on the right */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white/5 border border-white/10 items-center justify-center text-[#f5cf7b]">
          <GraduationCap className="w-14 h-14 opacity-80" />
        </div>
      </div>

      {/* 4 Metric Cards (Matching Screenshot 2 exact values: 86, 11, 2, 0 or dynamic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Akun aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all">
          <div className="text-xs font-medium text-slate-500 mb-1">Akun aktif</div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {monitoringStats.activeAccounts}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>diperbarui sekarang</span>
          </div>
        </div>

        {/* Card 2: Total kelas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all">
          <div className="text-xs font-medium text-slate-500 mb-1">Total kelas</div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {classes.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>diperbarui sekarang</span>
          </div>
        </div>

        {/* Card 3: Materi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all">
          <div className="text-xs font-medium text-slate-500 mb-1">Materi</div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {materials.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>diperbarui sekarang</span>
          </div>
        </div>

        {/* Card 4: Tugas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all">
          <div className="text-xs font-medium text-slate-500 mb-1">Tugas</div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {tasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>diperbarui sekarang</span>
          </div>
        </div>
      </div>

      {/* Enterprise Security & Backend Integrity Status (Fase 1) */}
      <div className="bg-gradient-to-r from-[#2d483e] to-[#3d6053] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#2d483e]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm">Keamanan & Backend Server (Fase 1 Aktif)</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                RBAC & Anti-Cheat
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Otoritas diverifikasi server • Kunci soal & penilaian diisolasi di backend • Isolasi multitenant antarsekolah aktif.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSecurityModalOpen(true)}
          className="self-start md:self-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
        >
          <ShieldCheck className="w-4 h-4 text-[#2d483e]" />
          <span>Audit Keamanan & Penetrasi</span>
        </button>
      </div>

      {/* Role-Specific Intelligent Panels */}

      {/* 1. KEPALA SEKOLAH VIEW: Global Monitoring Across All Classes */}
      {currentUser?.role === 'kepala_sekolah' && (
        <div className="space-y-6">
          {/* Monitoring Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    Pusat Monitoring Kepala Sekolah (Seluruh Kelas)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau kehadiran, distribusi materi PJJ, serta persentase pengumpulan tugas secara real-time.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-lg border border-emerald-100">
                  Tingkat Kepatuhan Tugas: 92%
                </span>
                <button
                  onClick={() => setActiveTab('kelas')}
                  className="px-3 py-1.5 bg-[#3d6053] text-white font-medium rounded-lg hover:bg-[#325045] flex items-center gap-1 cursor-pointer"
                >
                  <span>Kelola Kelas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Class Grid Status */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.slice(0, 6).map((cls) => {
                const classTasks = tasks.filter((t) => t.className === cls.name || t.className === 'Kelas 5A');
                return (
                  <div
                    key={cls.id}
                    className="p-3.5 bg-slate-50 hover:bg-[#f6f9f7] rounded-xl border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{cls.name}</span>
                      <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                        Aktif PJJ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">
                      Wali: {cls.homeroomTeacherName}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/50">
                      <span>{cls.totalStudents} Siswa</span>
                      <span className="text-[#3d6053] font-medium">{classTasks.length} Tugas Berjalan</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. SISWA VIEW: Smart Daily Task Manager & Quick Reminder */}
      {currentUser?.role === 'siswa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Today Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800">
                      Tugas Harian & Pengingat Pintar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Periksa batas waktu dan kumpulkan tugas tepat waktu untuk meraih poin prestasi.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('tugas')}
                  className="text-xs font-semibold text-[#3d6053] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Semua Tugas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => {
                  const isSubmitted = submissions.some(
                    (s) => s.taskId === task.id && s.studentId === currentUser.id
                  );
                  const status = getDueStatus(task.dueDate);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSubmitted
                          ? 'bg-slate-50/80 border-slate-200'
                          : 'bg-white border-slate-200 hover:border-[#3d6053]/50 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                            {task.subjectName}
                          </span>
                          <span className="text-[11px] text-slate-400">• {task.className}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-slate-800 mb-1">{task.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400">Guru: {task.teacherName}</span>
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Telah Dikirim</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveTab('tugas')}
                            className="px-3 py-1 bg-[#3d6053] text-white font-medium rounded-lg hover:bg-[#325045] cursor-pointer"
                          >
                            Buka & Kerjakan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Learning Shortcuts & Motivation */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#3d6053] to-[#2b463c] text-white p-5 rounded-2xl shadow-xs">
              <span className="text-[11px] font-semibold text-[#f5cf7b] uppercase">Prestasi Kamu</span>
              <h4 className="text-lg font-bold mt-1">Bintang Pelajar Aktif ⭐⭐⭐</h4>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Tetap semangat belajar di rumah. Selesaikan ujian dan baca materi hari ini!
              </p>
              <button
                onClick={() => setActiveTab('materi')}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Buka Materi Belajar</span>
              </button>
            </div>

            {/* Quick Exams Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ujian Tersedia
                </h4>
                <button
                  onClick={() => setActiveTab('ujian')}
                  className="text-xs text-[#3d6053] font-semibold hover:underline cursor-pointer"
                >
                  Lihat
                </button>
              </div>

              <div className="space-y-2">
                {exams.slice(0, 2).map((ex) => (
                  <div key={ex.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800 truncate">{ex.title}</p>
                    <div className="flex items-center justify-between text-slate-500 mt-1 text-[11px]">
                      <span>{ex.subjectName}</span>
                      <span>{ex.durationMinutes} Menit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GURU VIEW: Teaching quick controls */}
      {currentUser?.role === 'guru' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Pusat Tugas & Penilaian Guru ({currentUser.className || 'Kelas 5A'})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola materi pembelajaran, bagikan tugas harian dengan pengingat pintar, dan periksa lembar kerja murid.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tugas')}
                className="px-3.5 py-2 bg-[#3d6053] text-white text-xs font-medium rounded-xl hover:bg-[#325045] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Buat Tugas Baru</span>
              </button>
              <button
                onClick={() => setActiveTab('materi')}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tambah Materi</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#f8faf8] border border-[#e2ece5] rounded-xl">
              <span className="text-xs font-semibold text-[#3d6053]">Tugas Aktif</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{tasks.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Lengkap dengan jadwal pengingat pintar</p>
            </div>

            <div className="p-4 bg-[#fefbf6] border border-[#f3e7cf] rounded-xl">
              <span className="text-xs font-semibold text-amber-700">Tugas Terkumpul</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{submissions.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {submissions.filter((s) => s.status === 'dinilai').length} telah dinilai
              </p>
            </div>

            <div className="p-4 bg-[#f6f9fc] border border-[#dbe6f5] rounded-xl">
              <span className="text-xs font-semibold text-blue-700">Bank Soal Tersedia</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">4 Butir Soal</p>
              <p className="text-[11px] text-slate-500 mt-1">Siap dijadikan lembar ujian daring</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
