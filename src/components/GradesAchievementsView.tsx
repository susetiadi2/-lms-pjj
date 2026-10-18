import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import {
  BarChart3,
  Award,
  Trophy,
  Zap,
  BookOpenCheck,
  Star,
  Plus,
  Search,
  CheckCircle,
  TrendingUp,
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  User,
  Download,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import confetti from 'canvas-confetti';
import { generateStudentProgressPdf } from '../utils/pdfGenerator';

// Academic growth progression data over the semester for students
interface SemesterDataPoint {
  month: string;
  milestone: string;
  studentScore: number;
  classAverage: number;
  kkm: number;
}

interface SubjectMasteryPoint {
  subject: string;
  score: number;
  classAvg: number;
  target: number;
}

export const GradesAchievementsView: React.FC = () => {
  const { achievements, addAchievement, submissions, examResults, users, currentUser } = useLms();
  const [activeTab, setActiveTab] = useState<'perkembangan' | 'prestasi' | 'nilai'>('perkembangan');
  const [chartType, setChartType] = useState<'trend' | 'subject'>('trend');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Student selection for progress tracker
  const studentsList = users.filter((u) => u.role === 'siswa');
  const initialStudentId =
    currentUser?.role === 'siswa' ? currentUser.id : studentsList[0]?.id || 'user-siswa-1';
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);

  // New Achievement state
  const [awardStudentId, setAwardStudentId] = useState(studentsList[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Akademik' | 'Kedisiplinan' | 'Kreativitas' | 'Ketepatan Waktu'>('Ketepatan Waktu');
  const [description, setDescription] = useState('');
  const [stars, setStars] = useState(5);

  const [isTeacherOrPrincipal] = useState(
    currentUser?.role === 'guru' || currentUser?.role === 'kepala_sekolah'
  );
  const currentSelectedStudent = studentsList.find((s) => s.id === selectedStudentId) || studentsList[0];

  // PDF Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Specific student trajectory data based on student ID
  const getStudentSemesterData = (studId: string): SemesterDataPoint[] => {
    if (studId === 'user-siswa-2') {
      // Siti Annisa Putri (Top performer in Science & Humanities)
      return [
        { month: 'Juli', milestone: 'Asesmen Awal', studentScore: 88, classAverage: 80, kkm: 75 },
        { month: 'Agustus', milestone: 'PH 1 Siklus Air', studentScore: 92, classAverage: 82, kkm: 75 },
        { month: 'September', milestone: 'PTS Ganjil', studentScore: 94, classAverage: 84, kkm: 75 },
        { month: 'Oktober', milestone: 'PH 2 Pecahan', studentScore: 96, classAverage: 85, kkm: 75 },
        { month: 'November', milestone: 'Projek PJJ Terpadu', studentScore: 95, classAverage: 86, kkm: 75 },
        { month: 'Desember', milestone: 'Simulasi PAS', studentScore: 98, classAverage: 87, kkm: 75 },
      ];
    } else if (studId === 'user-siswa-3') {
      // Budi Pratama (Steady growth)
      return [
        { month: 'Juli', milestone: 'Asesmen Awal', studentScore: 74, classAverage: 80, kkm: 75 },
        { month: 'Agustus', milestone: 'PH 1', studentScore: 78, classAverage: 82, kkm: 75 },
        { month: 'September', milestone: 'PTS Ganjil', studentScore: 82, classAverage: 84, kkm: 75 },
        { month: 'Oktober', milestone: 'PH 2', studentScore: 85, classAverage: 85, kkm: 75 },
        { month: 'November', milestone: 'Projek PJJ', studentScore: 88, classAverage: 86, kkm: 75 },
        { month: 'Desember', milestone: 'Simulasi PAS', studentScore: 90, classAverage: 87, kkm: 75 },
      ];
    }

    // Default Ahmad Fauzan (Rapid upward acceleration)
    return [
      { month: 'Juli', milestone: 'Asesmen Diagnostik', studentScore: 81, classAverage: 80, kkm: 75 },
      { month: 'Agustus', milestone: 'PH 1 Siklus Alam', studentScore: 85, classAverage: 82, kkm: 75 },
      { month: 'September', milestone: 'Penilaian Tengah Semester (PTS)', studentScore: 88, classAverage: 84, kkm: 75 },
      { month: 'Oktober', milestone: 'PH 2 & Tugas Harian', studentScore: 93, classAverage: 85, kkm: 75 },
      { month: 'November', milestone: 'Projek Literasi Digital', studentScore: 94, classAverage: 86, kkm: 75 },
      { month: 'Desember', milestone: 'Prediksi Akhir Semester (PAS)', studentScore: 96, classAverage: 87, kkm: 75 },
    ];
  };

  const getSubjectMasteryData = (studId: string): SubjectMasteryPoint[] => {
    if (studId === 'user-siswa-2') {
      return [
        { subject: 'IPA', score: 98, classAvg: 85, target: 80 },
        { subject: 'Matematika', score: 92, classAvg: 81, target: 80 },
        { subject: 'B. Indonesia', score: 96, classAvg: 84, target: 80 },
        { subject: 'Tematik', score: 95, classAvg: 86, target: 80 },
        { subject: 'PAI', score: 94, classAvg: 88, target: 80 },
        { subject: 'B. Inggris', score: 90, classAvg: 82, target: 80 },
      ];
    } else if (studId === 'user-siswa-3') {
      return [
        { subject: 'IPA', score: 86, classAvg: 85, target: 80 },
        { subject: 'Matematika', score: 82, classAvg: 81, target: 80 },
        { subject: 'B. Indonesia', score: 88, classAvg: 84, target: 80 },
        { subject: 'Tematik', score: 89, classAvg: 86, target: 80 },
        { subject: 'PAI', score: 92, classAvg: 88, target: 80 },
        { subject: 'B. Inggris', score: 84, classAvg: 82, target: 80 },
      ];
    }

    return [
      { subject: 'IPA', score: 95, classAvg: 85, target: 80 },
      { subject: 'Matematika', score: 90, classAvg: 81, target: 80 },
      { subject: 'B. Indonesia', score: 92, classAvg: 84, target: 80 },
      { subject: 'Tematik', score: 94, classAvg: 86, target: 80 },
      { subject: 'PAI', score: 91, classAvg: 88, target: 80 },
      { subject: 'B. Inggris', score: 88, classAvg: 82, target: 80 },
    ];
  };

  const semesterData = getStudentSemesterData(selectedStudentId);
  const subjectData = getSubjectMasteryData(selectedStudentId);

  // Compute metrics
  const firstScore = semesterData[0].studentScore;
  const latestScore = semesterData[semesterData.length - 1].studentScore;
  const growthDelta = latestScore - firstScore;
  const averageSemesterScore = Math.round(
    semesterData.reduce((acc, curr) => acc + curr.studentScore, 0) / semesterData.length
  );

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      generateStudentProgressPdf({
        student: currentSelectedStudent,
        homeroomTeacher: 'Ibu Rahmawati, S.Pd.',
        principalName: 'Mr. DIVA, M.Pd.',
        semesterData,
        subjectData,
        averageScore: averageSemesterScore,
        growthDelta,
        achievementsCount: achievements.filter((a) => a.studentId === currentSelectedStudent.id).length,
      });
      setPdfSuccessToast(true);
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
      setTimeout(() => setPdfSuccessToast(false), 4500);
    } catch (err) {
      console.error('Gagal mengekspor PDF rapor:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCreateAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const matchedStudent = users.find((u) => u.id === awardStudentId);
    addAchievement({
      studentId: awardStudentId,
      studentName: matchedStudent?.name || 'Ahmad Fauzan',
      className: matchedStudent?.className || 'Kelas 5A',
      title,
      category,
      badgeIcon: category === 'Akademik' ? 'Trophy' : category === 'Ketepatan Waktu' ? 'Zap' : 'Star',
      description,
      stars,
    });
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return Trophy;
      case 'Zap':
        return Zap;
      case 'BookOpenCheck':
        return BookOpenCheck;
      default:
        return Award;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Laporan Nilai, Prestasi & Pelacak Perkembangan Siswa
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi analitik akademik berbasis Recharts untuk memantau kemajuan belajar murid sepanjang semester PJJ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            title="Ekspor laporan perkembangan akademik ke format PDF resmi"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh Rapor PDF'}</span>
          </button>

          <button
            onClick={() => setShowPdfPreviewModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lihat format cetak rapor"
          >
            <FileText className="w-4 h-4 text-[#3d6053]" />
            <span>Pratinjau Rapor</span>
          </button>

          {isTeacherOrPrincipal && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Beri Penghargaan</span>
            </button>
          )}
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('perkembangan')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'perkembangan'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Grafik Perkembangan Semester (Recharts)</span>
        </button>

        <button
          onClick={() => setActiveTab('prestasi')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'prestasi'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Prestasi & Lencana Siswa ({achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('nilai')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'nilai'
              ? 'bg-[#3d6053] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Buku Nilai & Rekapitulasi</span>
        </button>
      </div>

      {/* Tab 1: RECHARTS PROGRESS TRACKER */}
      {activeTab === 'perkembangan' && (
        <div className="space-y-6">
          {/* Top Controls: Student Selector & Chart Type Switcher */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <User className="w-4 h-4 text-[#3d6053]" />
                <span>Pilih Siswa yang Dipantau:</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
              >
                {studentsList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.className || 'Kelas 5A'}) - {st.nisOrNip}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setChartType('trend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  chartType === 'trend'
                    ? 'bg-[#3d6053] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tren Pertumbuhan
              </button>
              <button
                onClick={() => setChartType('subject')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  chartType === 'subject'
                    ? 'bg-[#3d6053] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Penguasaan Mapel
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Unduh laporan rapor PDF untuk siswa terpilih"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* Metric Insight KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Rata-rata Semester Ini
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#3d6053]">
                {averageSemesterScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
                Predikat: A (Sangat Memuaskan)
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Pertumbuhan Nilai
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-1">
                <span>+{growthDelta} Poin</span>
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dari Juli ({firstScore}) ke Desember ({latestScore})
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Status Ketuntasan (KKM 75)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                100%
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                Semua evaluasi di atas batas KKM
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Mata Pelajaran Unggulan
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 truncate">
                IPA (95)
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Diikuti Tematik Terpadu (94)
              </span>
            </div>
          </div>

          {/* Main Recharts Visualization Canvas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  {chartType === 'trend'
                    ? `Kurva Perkembangan Nilai: ${currentSelectedStudent?.name}`
                    : `Analisis Penguasaan per Mata Pelajaran: ${currentSelectedStudent?.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {chartType === 'trend'
                    ? 'Memvisualisasikan skor siswa dibanding rata-rata kelas dan ambang batas kelulusan minimal (KKM).'
                    : 'Perbandingan nilai siswa dengan rata-rata kelas di setiap mata pelajaran.'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#3d6053]">
                  <span className="w-3 h-3 rounded-full bg-[#3d6053]" />
                  <span>Nilai Siswa</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                  <span className="w-3 h-3 rounded-full bg-[#e5a838]" />
                  <span>Rata-rata Kelas</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                  <span className="w-3 h-1 bg-rose-500" />
                  <span>Garis KKM (75)</span>
                </span>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="h-80 sm:h-96 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'trend' ? (
                  <AreaChart data={semesterData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                    <defs>
                      <linearGradient id="studentGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3d6053" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3d6053" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="classAverageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e5a838" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e5a838" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[60, 100]}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as SemesterDataPoint;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-amber-400">
                                {label} - {item.milestone}
                              </p>
                              <p className="text-emerald-300 font-semibold">
                                Nilai {currentSelectedStudent.name}: {item.studentScore}
                              </p>
                              <p className="text-amber-200">
                                Rata-rata Kelas 5A: {item.classAverage}
                              </p>
                              <p className="text-rose-300 text-[11px]">
                                Batas KKM: {item.kkm} (Lulus Tuntas)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Batas KKM (75)', fill: '#ef4444', fontSize: 11, position: 'insideBottomRight' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="classAverage"
                      stroke="#e5a838"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#classAverageGradient)"
                      name="Rata-rata Kelas"
                    />
                    <Area
                      type="monotone"
                      dataKey="studentScore"
                      stroke="#3d6053"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#studentGrowthGradient)"
                      name="Nilai Siswa"
                      activeDot={{ r: 6, fill: '#3d6053', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={subjectData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as SubjectMasteryPoint;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-[#f5cf7b]">{label}</p>
                              <p className="text-emerald-300 font-semibold">
                                Nilai Siswa: {item.score}
                              </p>
                              <p className="text-amber-200">
                                Rata-rata Kelas: {item.classAvg}
                              </p>
                              <p className="text-slate-300 text-[11px]">
                                Target Kurikulum: {item.target}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'KKM 75', fill: '#ef4444', fontSize: 11 }}
                    />
                    <Bar
                      dataKey="score"
                      name="Nilai Siswa"
                      fill="#3d6053"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="classAvg"
                      name="Rata-rata Kelas"
                      fill="#e5a838"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Timeline Milestones Legend Details */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {semesterData.map((pt, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{pt.month}</span>
                  <span className="font-bold text-sm text-[#3d6053] block">{pt.studentScore}</span>
                  <span className="text-[10px] text-slate-500 truncate block">{pt.milestone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prestasi Siswa */}
      {activeTab === 'prestasi' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = getBadgeIcon(ach.badgeIcon);
            return (
              <div
                key={ach.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {ach.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{ach.dateAwarded}</span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#eef5f1] text-[#3d6053] flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-snug">{ach.title}</h3>
                      <p className="text-xs text-[#3d6053] font-semibold mt-0.5">
                        {ach.studentName} ({ach.className})
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{ach.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(ach.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span className="text-[11px] font-bold text-slate-600">
                    {ach.stars} Bintang Emas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Rekapitulasi Nilai */}
      {activeTab === 'nilai' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Buku Nilai & Rekap Capaian Tugas / Ujian
            </h3>
            <span className="text-xs font-semibold text-[#3d6053] bg-[#eef5f1] px-2.5 py-1 rounded-lg">
              Rata-rata Sekolah: 88.5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Tugas Selesai</th>
                  <th className="py-3 px-4">Ujian Selesai</th>
                  <th className="py-3 px-4">Nilai Rata-rata</th>
                  <th className="py-3 px-4">Status Kelulusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentsList.map((st) => {
                  const studentSubs = submissions.filter((s) => s.studentId === st.id && s.status === 'dinilai');
                  const studentExams = examResults.filter((e) => e.studentId === st.id);
                  const avgScore =
                    studentSubs.length > 0
                      ? Math.round(
                          studentSubs.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                            studentSubs.length
                        )
                      : 92;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-800">{st.name}</td>
                      <td className="py-3 px-4">{st.className || 'Kelas 5A'}</td>
                      <td className="py-3 px-4">{studentSubs.length || 1} Tugas Terkumpul</td>
                      <td className="py-3 px-4">{studentExams.length || 1} Evaluasi</td>
                      <td className="py-3 px-4 font-bold text-[#3d6053] text-sm">{avgScore} / 100</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Tuntas (A)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Award Badge */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Beri Penghargaan & Prestasi Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apresiasi kerja keras dan kedisiplinan murid PJJ dengan bintang penghargaan.
            </p>

            <form onSubmit={handleCreateAchievement} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Siswa</label>
                <select
                  value={awardStudentId}
                  onChange={(e) => setAwardStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Piagam / Lencana</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Juara Ketepatan Waktu Kumpul Tugas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Ketepatan Waktu">Ketepatan Waktu</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Kreativitas">Kreativitas</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah Bintang</label>
                  <select
                    value={stars}
                    onChange={(e) => setStars(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-amber-600"
                  >
                    <option value={5}>5 Bintang Emas ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 Bintang Emas ⭐⭐⭐⭐</option>
                    <option value={3}>3 Bintang Emas ⭐⭐⭐</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Keterangan Apresiasi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Alasan pemberian bintang penghargaan ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Sematkan Penghargaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: PDF Report Preview */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Top Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3d6053]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Pratinjau Rapor Perkembangan Siswa PJJ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Format resmi siap cetak dan unduh untuk siswa & orang tua
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-3 py-1.5 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Document Body (Paper Sheet Look) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs bg-slate-100/50">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 space-y-5">
                {/* School Letterhead / Kop Surat */}
                <div className="flex items-center gap-3.5 pb-4 border-b-2 border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-[#e5a838] flex items-center justify-center font-bold text-slate-900 text-xl shadow-xs">
                    D
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-extrabold text-[#3d6053] tracking-tight">
                      MR. DIVA SMART LEARNING SCHOOL
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Sistem Pembelajaran Jarak Jauh (PJJ) Terpadu Berbasis Digital
                    </p>
                    <p className="text-[10px] text-slate-400">
                      NPSN: 10829102 • Akreditasi A • Jl. Edukasi Digital Cendekia No. 88
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                    Laporan Perkembangan Akademik & Belajar Siswa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Semester Ganjil • Tahun Ajaran 2026/2027
                  </p>
                </div>

                {/* Student Info Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nama Lengkap Siswa</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {currentSelectedStudent?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NISN / ID Siswa</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {currentSelectedStudent?.nisOrNip}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rombel / Kelas</span>
                    <span className="font-semibold text-slate-700">
                      {currentSelectedStudent?.className || 'Kelas 5A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rata-rata & Pertumbuhan</span>
                    <span className="font-bold text-[#3d6053]">
                      {averageSemesterScore} / 100 (+{growthDelta} Poin)
                    </span>
                  </div>
                </div>

                {/* Milestone Progression Table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">
                    A. Rekap Pertumbuhan Nilai Bulanan & Evaluasi
                  </h4>
                  <table className="w-full text-left border border-slate-200 text-[11px]">
                    <thead className="bg-[#3d6053] text-white">
                      <tr>
                        <th className="p-2">Bulan</th>
                        <th className="p-2">Tahap / Evaluasi Belajar</th>
                        <th className="p-2 text-center">Nilai Siswa</th>
                        <th className="p-2 text-center">Rata-rata Kelas</th>
                        <th className="p-2 text-center">KKM</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {semesterData.map((pt, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold">{pt.month}</td>
                          <td className="p-2">{pt.milestone}</td>
                          <td className="p-2 text-center font-bold text-[#3d6053]">{pt.studentScore}</td>
                          <td className="p-2 text-center">{pt.classAverage}</td>
                          <td className="p-2 text-center">{pt.kkm}</td>
                          <td className="p-2 text-center font-semibold text-emerald-700">
                            Tuntas (Lulus KKM)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subject Mastery Table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">
                    B. Capaian Penguasaan per Mata Pelajaran
                  </h4>
                  <table className="w-full text-left border border-slate-200 text-[11px]">
                    <thead className="bg-[#3d6053] text-white">
                      <tr>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2 text-center">Nilai Siswa</th>
                        <th className="p-2 text-center">Rata-rata Kelas</th>
                        <th className="p-2 text-center">KKM</th>
                        <th className="p-2 text-center">Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {subjectData.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold">{sub.subject}</td>
                          <td className="p-2 text-center font-bold text-[#3d6053]">{sub.score}</td>
                          <td className="p-2 text-center">{sub.classAvg}</td>
                          <td className="p-2 text-center">75</td>
                          <td className="p-2 text-center font-bold text-emerald-700">
                            {sub.score >= 90 ? 'A (Sangat Baik)' : 'B (Baik)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Teacher Note Box */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900 block text-xs mb-1">
                    Catatan Wali Kelas & Apresiasi PJJ:
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Ananda {currentSelectedStudent?.name} sangat aktif dalam mengikuti sesi pembelajaran daring,
                    mengumpulkan tugas harian tepat waktu sebelum batas akhir, dan menunjukkan pemahaman konsep yang sangat memuaskan.
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <span className="block text-slate-500">Mengetahui,</span>
                    <span className="block text-slate-500">Orang Tua / Wali</span>
                    <div className="h-12" />
                    <span className="border-t border-slate-400 block pt-1 font-medium">
                      ( .................................... )
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500">Wali Kelas 5A,</span>
                    <span className="block text-slate-500">Guru Pengajar</span>
                    <div className="h-12" />
                    <span className="border-t border-slate-400 block pt-1 font-bold text-slate-800">
                      Ibu Rahmawati, S.Pd.
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500">Kepala Sekolah,</span>
                    <span className="block text-slate-500">Mr. DIVA Smart School</span>
                    <div className="h-12" />
                    <span className="border-t border-slate-400 block pt-1 font-bold text-slate-800">
                      Mr. DIVA, M.Pd.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast: PDF Success Notification */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2d4c41] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-[#3d6053]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs">Rapor PDF Berhasil Diunduh!</p>
            <p className="text-[11px] text-emerald-200/90">
              File laporan perkembangan untuk {currentSelectedStudent?.name} telah tersimpan di gawai Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
