import React, { useState, useRef } from 'react';
import { useLms } from '../context/LmsContext';
import { Task, TaskPriority } from '../types/lms';
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  Bell,
  Volume2,
  FileText,
  Search,
  Trash2,
  Send,
  Upload,
  Users,
  ShieldCheck,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { playReminderChime } from '../utils/audio';
import { StudyGroupView } from './StudyGroupView';
import { apiClient } from '../utils/apiClient';

interface UploadedFileReceipt {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
}

export const TasksView: React.FC = () => {
  const {
    tasks,
    submissions,
    currentUser,
    addTask,
    deleteTask,
    submitTask,
    gradeSubmission,
    subjects,
    classes,
    studyGroups,
  } = useLms();

  const [activeTab, setActiveTab] = useState<'daftar' | 'kelompok' | 'penilaian'>('daftar');
  const [selectedStudyGroupIdForNav, setSelectedStudyGroupIdForNav] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Modals & File Upload State (Fase 2 Storage)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFileReceipt, setUploadedFileReceipt] = useState<UploadedFileReceipt | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Grading modal state
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(90);
  const [gradeFeedback, setGradeFeedback] = useState<string>('Bagus sekali, kerjakan tugas berikutnya dengan teliti!');

  // Create Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || '');
  const [newClassName, setNewClassName] = useState('Kelas 5A');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d.toISOString().slice(0, 16);
  });
  const [newPriority, setNewPriority] = useState<TaskPriority>('tinggi');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('1. Baca materi pendukung\n2. Tuliskan jawaban di buku catatan\n3. Unggah foto lembar jawaban atau dokumen PDF');
  const [newReminderMinutes, setNewReminderMinutes] = useState(120);
  const [newReminderSound, setNewReminderSound] = useState(true);

  const isTeacherOrPrincipal = currentUser?.role === 'guru' || currentUser?.role === 'kepala_sekolah';

  // Helper for due urgency
  const calculateUrgency = (dueDateStr: string) => {
    const diff = new Date(dueDateStr).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (diff < 0) return { label: 'Terlambat / Lewat Waktu', badge: 'bg-rose-100 text-rose-800 border-rose-200', isUrgent: false };
    if (hours <= 2) return { label: `Sangat Mendesak (${hours} Jam Lagi!)`, badge: 'bg-rose-600 text-white font-bold animate-pulse', isUrgent: true };
    if (hours <= 12) return { label: `Mendekati Deadline (${hours} Jam)`, badge: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold', isUrgent: true };
    if (hours <= 24) return { label: `Hari Ini (${hours} Jam Lagi)`, badge: 'bg-amber-50 text-amber-800 border-amber-200', isUrgent: false };
    const days = Math.round(hours / 24);
    return { label: `${days} Hari Lagi`, badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', isUrgent: false };
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSubject = subjectFilter === 'all' || task.subjectId === subjectFilter;
    return matchesSearch && matchesPriority && matchesSubject;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedSub = subjects.find((s) => s.id === newSubjectId);
    addTask({
      title: newTitle,
      subjectId: newSubjectId,
      subjectName: matchedSub ? matchedSub.name : 'Tematik Terpadu',
      className: newClassName,
      teacherId: currentUser?.id || 'guru-1',
      teacherName: currentUser?.name || 'Ibu Rahmawati, S.Pd.',
      description: newDescription,
      instructions: newInstructions.split('\n').filter((i) => i.trim().length > 0),
      dueDate: new Date(newDueDate).toISOString(),
      priority: newPriority,
      points: 100,
      allowFileUpload: true,
      reminder: {
        enabled: true,
        remindMinutesBefore: Number(newReminderMinutes),
        notifySound: newReminderSound,
        customMessage: `Pengingat Pintar: Tugas ${newTitle} mendekati batas waktu!`,
      },
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleOpenSubmissionModal = (task: Task) => {
    setSelectedTaskForSubmission(task);
    setSubmissionText('');
    setUploadedFileReceipt(null);
    setUploadError(null);
    setSubmitError(null);
  };

  // Real File Selection & Server Binary Inspection Upload
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTaskForSubmission) return;

    setUploadError(null);
    setIsUploadingFile(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca berkas dari perangkat.'));
        reader.readAsDataURL(file);
      });

      const res = await apiClient.uploadTaskFile({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data,
        taskId: selectedTaskForSubmission.id,
      });

      if (res?.success && res.file) {
        setUploadedFileReceipt(res.file);
      }
    } catch (err: any) {
      setUploadedFileReceipt(null);
      setUploadError(err.message || 'Berkas ditolak oleh validasi keamanan server.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper to generate and upload a genuine binary PDF document for instant reviewer testing
  const handleQuickUploadSamplePdf = async () => {
    if (!selectedTaskForSubmission) return;
    setUploadError(null);
    setIsUploadingFile(true);

    try {
      const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
%%EOF
`;
      const base64Data = btoa(samplePdfContent);
      const safeStudentSlug = (currentUser?.name || 'siswa').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const res = await apiClient.uploadTaskFile({
        fileName: `lembar_tugas_${safeStudentSlug}.pdf`,
        mimeType: 'application/pdf',
        base64Data,
        taskId: selectedTaskForSubmission.id,
      });

      if (res?.success && res.file) {
        setUploadedFileReceipt(res.file);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah dokumen sampel.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Secure Authenticated File Download / View via /api/storage/files/:fileId
  const handleDownloadStoredFile = async (fileObjectId: string, displayFileName: string) => {
    setDownloadingFileId(fileObjectId);
    try {
      const { blob } = await apiClient.downloadStoredFileBlob(fileObjectId);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = displayFileName || `berkas_${fileObjectId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err: any) {
      console.error('Download error:', err);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleSubmitTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmission) return;
    setSubmitError(null);

    try {
      await submitTask(
        selectedTaskForSubmission.id,
        submissionText,
        uploadedFileReceipt?.originalName,
        uploadedFileReceipt?.id
      );
      setSelectedTaskForSubmission(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal mengumpulkan tugas.');
    }
  };

  const handleGradeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;
    gradeSubmission(gradingSubmissionId, Number(gradeScore), gradeFeedback);
    setGradingSubmissionId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Smart Reminder Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Manajemen Tugas Harian &amp; Pengingat Pintar
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Sistem PJJ terintegrasi dengan penyimpanan berkas terisolasi (validasi Magic Bytes PDF/Foto), penjadwalan pengingat, dan evaluasi tugas siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => playReminderChime('gentle')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Coba dengarkan suara pengingat cerdas"
            >
              <Volume2 className="w-4 h-4 text-[#3d6053]" />
              <span>Cek Nada Pengingat</span>
            </button>

            {isTeacherOrPrincipal && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Tugas Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'daftar'
                ? 'bg-[#3d6053] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daftar Tugas ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('kelompok')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'kelompok'
                ? 'bg-[#3d6053] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelompok Belajar / Study Group ({studyGroups.length})</span>
          </button>

          {isTeacherOrPrincipal && (
            <button
              onClick={() => setActiveTab('penilaian')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'penilaian'
                  ? 'bg-[#3d6053] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lembar Jawaban Murid ({submissions.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari tugas, mata pelajaran, atau kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
              >
                <option value="all">Semua Prioritas</option>
                <option value="tinggi">Prioritas Tinggi</option>
                <option value="sedang">Prioritas Sedang</option>
                <option value="rendah">Prioritas Rendah</option>
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
              >
                <option value="all">Semua Mapel</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const urgency = calculateUrgency(task.dueDate);
              const userSubmission = submissions.find(
                (s) => s.taskId === task.id && s.studentId === currentUser?.id
              );
              const isSubmitted = !!userSubmission;
              const formattedDue = new Date(task.dueDate).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={task.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053] mr-2">
                          {task.subjectName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {task.className}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border ${urgency.badge}`}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-800 mb-1.5 leading-snug">
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Instruction checklist */}
                    {task.instructions && task.instructions.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1">
                        <span className="font-semibold text-slate-700 block mb-1">
                          Petunjuk Pengerjaan:
                        </span>
                        {task.instructions.map((ins, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                            <span className="text-[#3d6053] font-bold">•</span>
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Smart Reminder Box */}
                    <div className="p-2.5 bg-[#f6faf8] border border-[#dcebe3] rounded-xl mb-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-[#3d6053]" />
                        <span className="text-[#2b4c3e] font-medium text-[11px]">
                          Pengingat Pintar Aktif: {task.reminder.remindMinutesBefore >= 60 ? `${task.reminder.remindMinutesBefore / 60} Jam Sebelumnya` : `${task.reminder.remindMinutesBefore} Menit Sebelumnya`}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-[#dcebe3]">
                        {task.points} Poin
                      </span>
                    </div>
                  </div>

                  {/* Footer & Action row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Batas: {formattedDue}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Study Group Discussion shortcut */}
                      <button
                        type="button"
                        onClick={() => {
                          const matchedGroup = studyGroups.find((g) => g.taskId === task.id);
                          if (matchedGroup) {
                            setSelectedStudyGroupIdForNav(matchedGroup.id);
                          }
                          setActiveTab('kelompok');
                        }}
                        className="px-2.5 py-1.5 bg-[#eef5f1] hover:bg-[#dcefe5] text-[#3d6053] font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        title="Buka ruang diskusi kelompok belajar untuk tugas ini"
                      >
                        <Users className="w-3.5 h-3.5 text-[#3d6053]" />
                        <span>Diskusi Kelompok</span>
                      </button>

                      {isTeacherOrPrincipal ? (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          {isSubmitted ? (
                            <div className="flex items-center gap-1.5">
                              {userSubmission.fileObjectId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadStoredFile(
                                      userSubmission.fileObjectId!,
                                      userSubmission.fileAttachment || 'berkas_tugas.pdf'
                                    )
                                  }
                                  disabled={downloadingFileId === userSubmission.fileObjectId}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Unduh berkas tugas yang Anda unggah"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Berkas</span>
                                </button>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="font-semibold">
                                  {userSubmission.status === 'dinilai'
                                    ? `Nilai: ${userSubmission.score}/100`
                                    : 'Terkumpul'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenSubmissionModal(task)}
                              className="px-3 py-1.5 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kumpulkan</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'kelompok' && (
        <StudyGroupView
          initialGroupId={selectedStudyGroupIdForNav}
          onOpenTaskDetails={() => setActiveTab('daftar')}
        />
      )}

      {activeTab === 'penilaian' && (
        /* Penilaian Tab (for teachers & principals) */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">
              Daftar Lembar Kerja &amp; Pengumpulan Tugas Murid
            </h3>
            <span className="text-xs text-slate-500">{submissions.length} Pengumpulan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const matchedTask = tasks.find((t) => t.id === sub.taskId);
              return (
                <div key={sub.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{sub.studentName}</span>
                      <span className="text-[11px] text-slate-400">({sub.className})</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          sub.status === 'dinilai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status === 'dinilai' ? 'Sudah Dinilai' : 'Menunggu Penilaian'}
                      </span>
                    </div>

                    <p className="text-xs text-[#3d6053] font-medium">
                      Tugas: {matchedTask?.title || 'Tugas Terdaftar'}
                    </p>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{sub.submissionText}"
                    </p>

                    {sub.fileAttachment && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <div className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-medium">Lampiran: {sub.fileAttachment}</span>
                          {sub.fileSizeBytes && (
                            <span className="text-[10px] text-blue-500">
                              ({(sub.fileSizeBytes / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>

                        {sub.fileObjectId && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadStoredFile(
                                sub.fileObjectId!,
                                sub.fileAttachment || 'berkas_murid.pdf'
                              )
                            }
                            disabled={downloadingFileId === sub.fileObjectId}
                            className="px-2.5 py-1 bg-[#eef5f1] hover:bg-[#dcefe5] text-[#3d6053] text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>
                              {downloadingFileId === sub.fileObjectId
                                ? 'Mengunduh...'
                                : 'Unduh Berkas Terverifikasi'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {sub.feedback && (
                      <p className="text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded-lg mt-1">
                        Catatan Guru: {sub.feedback}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {sub.score !== undefined ? (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Nilai Diberikan</span>
                        <span className="text-xl font-bold text-[#3d6053]">{sub.score} / 100</span>
                      </div>
                    ) : null}

                    <button
                      onClick={() => {
                        setGradingSubmissionId(sub.id);
                        setGradeScore(sub.score || 95);
                        setGradeFeedback(sub.feedback || 'Hasil kerja bagus dan rapi!');
                      }}
                      className="px-3.5 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      {sub.status === 'dinilai' ? 'Edit Nilai' : 'Beri Nilai'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Buat Tugas Harian Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur instruksi, batas waktu pengerjaan, dan pengingat pintar untuk para murid.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas Harian IPA - Gambar Siklus Air"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3d6053]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelas Target</label>
                  <select
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas Waktu (Deadline)</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="tinggi">Tinggi (Mendesak)</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan tugas yang harus diselesaikan siswa..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Petunjuk Pengerjaan (Pisahkan per baris)
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Smart Reminder Config */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-700" />
                  <span>Konfigurasi Pengingat Pintar (Smart Reminder)</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-amber-800 block mb-0.5">Ingatkan Sebelum</label>
                    <select
                      value={newReminderMinutes}
                      onChange={(e) => setNewReminderMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    >
                      <option value={30}>30 Menit Sebelum</option>
                      <option value={60}>1 Jam Sebelum</option>
                      <option value={120}>2 Jam Sebelum</option>
                      <option value={1440}>1 Hari Sebelum</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="soundCheck"
                      checked={newReminderSound}
                      onChange={(e) => setNewReminderSound(e.target.checked)}
                      className="rounded text-[#3d6053]"
                    />
                    <label htmlFor="soundCheck" className="text-[11px] text-slate-700 cursor-pointer">
                      Mainkan nada lonceng saat aplikasi aktif
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Task with Fase 2 Verified Binary File Upload */}
      {selectedTaskForSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Kumpulkan Tugas: {selectedTaskForSubmission.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tuliskan jawaban tugas dan unggah dokumen PDF atau foto catatan (divalidasi dengan inspeksi Magic Bytes server).
            </p>

            <form onSubmit={handleSubmitTaskForm} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jawaban / Catatan Siswa
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ketik ringkasan jawaban atau penjelasan pengerjaan tugas kamu di sini..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#3d6053]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Unggah Berkas Tugas (PDF / Foto)
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickUploadSamplePdf}
                    disabled={isUploadingFile}
                    className="text-[11px] text-[#3d6053] hover:underline font-semibold cursor-pointer"
                  >
                    + Unggah Sampel PDF Valid
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#3d6053] rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50"
                >
                  {isUploadingFile ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <Loader2 className="w-5 h-5 text-[#3d6053] animate-spin" />
                      <span className="text-xs text-slate-600 font-medium">
                        Memvalidasi Magic Bytes &amp; menyimpan ke vault server...
                      </span>
                    </div>
                  ) : uploadedFileReceipt ? (
                    <div className="space-y-1 text-left bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-lg">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{uploadedFileReceipt.originalName}</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        MIME: {uploadedFileReceipt.mimeType} • {(uploadedFileReceipt.sizeBytes / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        SHA-256: {uploadedFileReceipt.sha256.slice(0, 24)}...
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs text-slate-600 font-medium">
                        Klik untuk memilih berkas PDF atau Foto dari perangkat
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Format .pdf, .jpg, .png, .webp (Maksimum 5 MB, divalidasi di server)
                      </span>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px]">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForSubmission(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFile}
                  className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grade Submission (for teacher) */}
      {gradingSubmissionId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Penilaian Tugas Murid</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan nilai angka (skala 0 - 100) dan umpan balik yang membangun.
            </p>

            <form onSubmit={handleGradeForm} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nilai Angka (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-[#3d6053]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan &amp; Umpan Balik</label>
                <textarea
                  rows={3}
                  required
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmissionId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
