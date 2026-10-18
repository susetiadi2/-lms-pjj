export type UserRole = 'kepala_sekolah' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  nisOrNip: string;
  className?: string; // For siswa/guru
  subjectSpecialty?: string; // For guru
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface ClassRoom {
  id: string;
  name: string;
  level: number; // 1-6
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  totalStudents: number;
  academicYear: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevel: string;
  teacherName: string;
  iconName: string;
  color: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classLevel: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  description: string;
  content: string;
  type: 'video' | 'pdf' | 'article' | 'slide';
  embedUrl?: string;
  fileSize?: string;
  readTime: string;
  viewsCount: number;
}

export type TaskPriority = 'tinggi' | 'sedang' | 'rendah';
export type TaskStatus = 'belum_selesai' | 'diserahkan' | 'dinilai' | 'terlambat';

export interface TaskReminder {
  enabled: boolean;
  remindMinutesBefore: number; // e.g. 60 min, 120 min, 1440 min
  notifySound: boolean;
  customMessage?: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  className: string;
  teacherId: string;
  teacherName: string;
  description: string;
  instructions: string[];
  dueDate: string; // ISO string
  priority: TaskPriority;
  points: number;
  allowFileUpload: boolean;
  createdAt: string;
  reminder: TaskReminder;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  className: string;
  submittedAt: string;
  submissionText: string;
  fileAttachment?: string;
  fileObjectId?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  fileSha256?: string;
  fileDownloadUrl?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  status: 'diserahkan' | 'dinilai' | 'terlambat';
  isLate?: boolean;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer?: string; // Redacted for student clients
  explanation?: string;   // Redacted for student clients
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  className: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  questionsCount: number;
  questions: ExamQuestion[];
  isPublished: boolean;
  createdBy: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  className: string;
  score: number;
  maxScore: number;
  completedAt: string;
  answers: Record<string, string>;
}

export interface QuestionBankItem {
  id: string;
  subjectId: string;
  subjectName: string;
  classLevel: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  topic: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  authorName: string;
}

export interface StudentAchievement {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  title: string;
  category: 'Akademik' | 'Kedisiplinan' | 'Kreativitas' | 'Ketepatan Waktu';
  badgeIcon: string;
  dateAwarded: string;
  description: string;
  stars: number;
}

export interface MonitoringStats {
  activeAccounts: number;
  totalClasses: number;
  materialsCount: number;
  tasksCount: number;
  submissionRate: number;
  averageGrade: number;
}

export interface StudyGroupMember {
  userId: string;
  name: string;
  role: UserRole;
  isLeader?: boolean;
}

export interface StudyGroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  messageText: string;
  timestamp: string;
  attachmentName?: string;
}

export interface StudyGroupChecklistItem {
  id: string;
  title: string;
  assignedToName: string;
  isCompleted: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  taskId: string;
  taskTitle: string;
  subjectName: string;
  description: string;
  createdAt: string;
  members: StudyGroupMember[];
  messages: StudyGroupMessage[];
  checklist: StudyGroupChecklistItem[];
  pinnedNote?: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa';

export interface DailyAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  checkedByTeacher: string;
}

export interface MonthlyAttendanceSummary {
  className: string;
  level: number;
  totalStudents: number;
  effectiveDays: number;
  hadirRate: number; // percentage e.g. 96.5%
  totalHadir: number;
  totalSakit: number;
  totalIzin: number;
  totalAlpa: number;
  month: string;
}


