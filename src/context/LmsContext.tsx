import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  ClassRoom,
  Subject,
  LearningMaterial,
  Task,
  TaskSubmission,
  Exam,
  ExamResult,
  QuestionBankItem,
  StudentAchievement,
  MonitoringStats,
  StudyGroup,
  StudyGroupMessage,
  StudyGroupChecklistItem,
  DailyAttendanceRecord,
  MonthlyAttendanceSummary,
} from '../types/lms';
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
} from '../data/initialData';
import { playReminderChime } from '../utils/audio';
import { apiClient } from '../utils/apiClient';

export type ActiveTab =
  | 'ringkasan'
  | 'akun'
  | 'kelas'
  | 'mapel'
  | 'materi'
  | 'tugas'
  | 'ujian'
  | 'bank_soal'
  | 'nilai'
  | 'profil';

interface SmartAlert {
  id: string;
  taskId: string;
  title: string;
  message: string;
  urgency: 'high' | 'medium' | 'info';
  timestamp: string;
}

interface LmsContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  // Data
  users: User[];
  classes: ClassRoom[];
  subjects: Subject[];
  materials: LearningMaterial[];
  tasks: Task[];
  submissions: TaskSubmission[];
  exams: Exam[];
  examResults: ExamResult[];
  questionBank: QuestionBankItem[];
  achievements: StudentAchievement[];
  studyGroups: StudyGroup[];
  attendanceRecords: DailyAttendanceRecord[];
  monthlyAttendance: MonthlyAttendanceSummary[];

  // Smart Reminder Alerts
  smartAlerts: SmartAlert[];
  dismissAlert: (id: string) => void;
  triggerSmartCheck: () => void;

  // Actions
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAs: (role: UserRole, specificUserId?: string) => Promise<void>;
  logout: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  submitTask: (taskId: string, submissionText: string, fileAttachment?: string, fileObjectId?: string) => Promise<void>;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  addMaterial: (material: Omit<LearningMaterial, 'id' | 'createdAt' | 'viewsCount'>) => void;
  incrementMaterialViews: (materialId: string) => void;
  addQuestionBankItem: (item: Omit<QuestionBankItem, 'id'>) => void;
  createExam: (exam: Omit<Exam, 'id'>) => void;
  recordExamResult: (result: Omit<ExamResult, 'id' | 'completedAt'>) => void;
  addAchievement: (achievement: Omit<StudentAchievement, 'id' | 'dateAwarded'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  addClass: (classroom: Omit<ClassRoom, 'id'>) => void;

  // Study Group actions
  sendStudyGroupMessage: (groupId: string, text: string, attachmentName?: string) => void;
  toggleStudyGroupChecklist: (groupId: string, checklistId: string) => void;
  addStudyGroupChecklistItem: (groupId: string, title: string, assignedToName: string) => void;
  createStudyGroup: (group: Omit<StudyGroup, 'id' | 'createdAt' | 'messages' | 'checklist'>) => void;

  // Attendance actions
  saveDailyAttendance: (records: Omit<DailyAttendanceRecord, 'id'>[]) => void;

  // Security & Enterprise Phase 1.1
  isSecurityModalOpen: boolean;
  setIsSecurityModalOpen: (open: boolean) => void;
  isRoleTampered: boolean;
  serverVerifiedRole: UserRole | null;
  checkServerRoleIntegrity: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  // Stats
  monitoringStats: MonitoringStats;
}

const LmsContext = createContext<LmsContextType | undefined>(undefined);

function sanitizeExamListForStorage(examList: Exam[]): Exam[] {
  return examList.map((e) => ({
    ...e,
    questions: (e.questions || []).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    })),
  }));
}

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mrdiva_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mrdiva_cur_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('ringkasan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('mrdiva_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);

  const [materials, setMaterials] = useState<LearningMaterial[]>(() => {
    const saved = localStorage.getItem('mrdiva_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('mrdiva_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [submissions, setSubmissions] = useState<TaskSubmission[]>(() => {
    const saved = localStorage.getItem('mrdiva_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('mrdiva_exams');
    const parsed = saved ? JSON.parse(saved) : INITIAL_EXAMS;
    return sanitizeExamListForStorage(parsed);
  });

  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    const saved = localStorage.getItem('mrdiva_exam_results');
    return saved ? JSON.parse(saved) : [];
  });

  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => {
    const saved = localStorage.getItem('mrdiva_qbank');
    return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANK;
  });

  const [achievements, setAchievements] = useState<StudentAchievement[]>(() => {
    const saved = localStorage.getItem('mrdiva_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => {
    const saved = localStorage.getItem('mrdiva_studygroups');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_GROUPS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('mrdiva_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceSummary[]>(() => {
    const saved = localStorage.getItem('mrdiva_monthly_att');
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_ATTENDANCE;
  });

  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);

  // Phase 1.1 Enterprise Security & RBAC State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isRoleTampered, setIsRoleTampered] = useState(false);
  const [serverVerifiedRole, setServerVerifiedRole] = useState<UserRole | null>('kepala_sekolah');

  // Hydrate persistent state from server APIs
  const syncWithServer = useCallback(async () => {
    const token = apiClient.getToken();
    if (!token) return;

    try {
      const [examsResp, tasksResp, attResp, classesResp] = await Promise.all([
        apiClient.getExams().catch(() => null),
        apiClient.getTasks().catch(() => null),
        apiClient.getAttendance().catch(() => null),
        apiClient.getClasses().catch(() => null),
      ]);

      if (examsResp?.exams) {
        setExams(sanitizeExamListForStorage(examsResp.exams));
      }
      if (Array.isArray(examsResp?.examResults)) {
        setExamResults(
          examsResp.examResults.map((r: any) => ({
            id: r.id,
            examId: r.examId,
            studentId: r.studentId,
            studentName: r.studentName,
            className: r.className,
            score: r.score,
            maxScore: 100,
            completedAt: r.completedAt,
            answers: {},
          }))
        );
      }

      if (Array.isArray(tasksResp?.tasks)) {
        setTasks(tasksResp.tasks);
      }
      if (Array.isArray(tasksResp?.submissions)) {
        setSubmissions(tasksResp.submissions);
      }

      if (Array.isArray(attResp?.attendanceRecords)) {
        setAttendanceRecords(attResp.attendanceRecords);
      }
      if (Array.isArray(attResp?.monthlySummary) && attResp.monthlySummary.length > 0) {
        setMonthlyAttendance(attResp.monthlySummary);
      }

      if (Array.isArray(classesResp?.classes) && classesResp.classes.length > 0) {
        setClasses(classesResp.classes);
      }

      // If principal, also sync users list
      const me = await apiClient.getMe().catch(() => null);
      if (me?.user?.role === 'kepala_sekolah') {
        const usersResp = await apiClient.getUsers().catch(() => null);
        if (Array.isArray(usersResp?.users)) {
          setUsers(usersResp.users);
        }
      }
    } catch {
      // Offline / initial boot fallback
    }
  }, []);

  // Verify server role integrity: ensures LocalStorage manipulation cannot elevate privileges
  const checkServerRoleIntegrity = async () => {
    try {
      const me = await apiClient.getMe();
      if (me && me.user) {
        setServerVerifiedRole(me.user.role);
        const saved = localStorage.getItem('mrdiva_cur_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.role !== me.user.role) {
            setIsRoleTampered(true);
            setCurrentUser(me.user);
            return;
          }
        }
        setIsRoleTampered(false);
      }
    } catch {
      // Backend might still be spinning up or session expired
    }
  };

  // Sync token, role, and persistent database state on mount
  useEffect(() => {
    const initBackendSession = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          const res = await apiClient.login(undefined, undefined, currentUser?.role || 'kepala_sekolah', currentUser?.id);
          if (res && res.user) {
            setCurrentUser(res.user);
            setServerVerifiedRole(res.user.role);
            setIsRoleTampered(false);
          }
        } else {
          await checkServerRoleIntegrity();
        }
        await syncWithServer();
      } catch (err) {
        console.warn('Backend session init:', err);
      }
    };

    initBackendSession();
    const verifyInterval = setInterval(checkServerRoleIntegrity, 15000);
    return () => clearInterval(verifyInterval);
  }, [syncWithServer]);

  useEffect(() => {
    localStorage.setItem('mrdiva_studygroups', JSON.stringify(studyGroups));
  }, [studyGroups]);

  useEffect(() => {
    localStorage.setItem('mrdiva_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('mrdiva_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mrdiva_cur_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mrdiva_cur_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('mrdiva_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('mrdiva_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('mrdiva_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('mrdiva_exams', JSON.stringify(sanitizeExamListForStorage(exams)));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('mrdiva_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('mrdiva_qbank', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('mrdiva_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('mrdiva_exam_results', JSON.stringify(examResults));
  }, [examResults]);

  // Smart Reminder Trigger & Deadline calculation
  const triggerSmartCheck = () => {
    if (!currentUser) return;
    const now = Date.now();
    const newAlerts: SmartAlert[] = [];

    tasks.forEach((task) => {
      const isSubmitted = submissions.some(
        (s) => s.taskId === task.id && s.studentId === currentUser.id
      );

      const due = new Date(task.dueDate).getTime();
      const diffMs = due - now;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (!isSubmitted && diffMs > 0 && diffHours <= 12) {
        newAlerts.push({
          id: `alert-${task.id}-${Date.now()}`,
          taskId: task.id,
          title: `Pengingat Tugas: ${task.subjectName}`,
          message: `Tugas "${task.title}" tersisa ${Math.max(1, Math.round(diffHours))} jam lagi!`,
          urgency: diffHours <= 3 ? 'high' : 'medium',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });

    if (newAlerts.length > 0) {
      setSmartAlerts((prev) => {
        const existingTaskIds = new Set(prev.map((a) => a.taskId));
        const filtered = newAlerts.filter((a) => !existingTaskIds.has(a.taskId));
        if (filtered.length > 0) {
          playReminderChime('gentle');
          return [...filtered, ...prev];
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    triggerSmartCheck();
    const interval = setInterval(triggerSmartCheck, 60000);
    return () => clearInterval(interval);
  }, [currentUser, tasks, submissions]);

  const dismissAlert = (id: string) => {
    setSmartAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const loginWithCredentials = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.login(username, password);
      if (res && res.user) {
        setCurrentUser(res.user);
        setServerVerifiedRole(res.user.role);
        setIsRoleTampered(false);
        await syncWithServer();
        return { success: true };
      }
      return { success: false, error: 'Gagal memverifikasi sesi dari server.' };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Username atau kata sandi tidak sesuai.',
      };
    }
  };

  const loginAs = async (role: UserRole, specificUserId?: string) => {
    try {
      const res = await apiClient.login(undefined, undefined, role, specificUserId);
      if (res && res.user) {
        setCurrentUser(res.user);
        setServerVerifiedRole(res.user.role);
        setIsRoleTampered(false);
        await syncWithServer();
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback to local:', err);
    }

    if (specificUserId) {
      const match = users.find((u) => u.id === specificUserId);
      if (match) {
        setCurrentUser(match);
        setServerVerifiedRole(match.role);
        setIsRoleTampered(false);
        return;
      }
    }
    const match = users.find((u) => u.role === role);
    if (match) {
      setCurrentUser(match);
      setServerVerifiedRole(match.role);
      setIsRoleTampered(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setCurrentUser(null);
    setServerVerifiedRole(null);
    setIsRoleTampered(false);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const res = await apiClient.createTask(taskData);
      if (res?.task) {
        setTasks((prev) => [res.task, ...prev.filter((t) => t.id !== res.task.id)]);
        playReminderChime('alert');
        return;
      }
    } catch (err) {
      console.warn('Server createTask fallback:', err);
    }

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    playReminderChime('alert');
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId);
    } catch (err) {
      console.warn('Server deleteTask warning:', err);
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSubmissions((prev) => prev.filter((s) => s.taskId !== taskId));
  };

  const submitTask = async (taskId: string, submissionText: string, fileAttachment?: string, fileObjectId?: string) => {
    if (!currentUser) return;
    const attachmentToSend = fileAttachment || (submissionText ? undefined : 'tugas_lampiran.pdf');
    try {
      const res = await apiClient.submitTask(taskId, submissionText, attachmentToSend, fileObjectId);
      if (res?.submission) {
        setSubmissions((prev) => [
          res.submission,
          ...prev.filter((s) => !(s.taskId === taskId && s.studentId === currentUser.id)),
        ]);
        playReminderChime('success');
        return;
      }
    } catch (err) {
      console.warn('Server submitTask error:', err);
      throw err;
    }

    const newSubm: TaskSubmission = {
      id: `subm-${Date.now()}`,
      taskId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      className: currentUser.className || 'Kelas 5A',
      submittedAt: new Date().toISOString(),
      submissionText,
      fileAttachment: attachmentToSend,
      fileObjectId,
      status: 'diserahkan',
    };
    setSubmissions((prev) => [newSubm, ...prev]);
    playReminderChime('success');
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      const res = await apiClient.gradeTask(submissionId, score, feedback);
      if (res?.submission) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? res.submission : s))
        );
        playReminderChime('success');
        return;
      }
    } catch (err) {
      console.warn('Server gradeTask fallback:', err);
    }

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              score,
              feedback,
              gradedAt: new Date().toISOString(),
              status: 'dinilai',
            }
          : s
      )
    );
    playReminderChime('success');
  };

  const addMaterial = (matData: Omit<LearningMaterial, 'id' | 'createdAt' | 'viewsCount'>) => {
    const newMat: LearningMaterial = {
      ...matData,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      viewsCount: 1,
    };
    setMaterials((prev) => [newMat, ...prev]);
    playReminderChime('gentle');
  };

  const incrementMaterialViews = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, viewsCount: m.viewsCount + 1 } : m))
    );
  };

  const addQuestionBankItem = (itemData: Omit<QuestionBankItem, 'id'>) => {
    const newItem: QuestionBankItem = {
      ...itemData,
      id: `qb-${Date.now()}`,
    };
    setQuestionBank((prev) => [newItem, ...prev]);
  };

  const createExam = async (examData: Omit<Exam, 'id'>) => {
    try {
      const res = await apiClient.createExam(examData);
      if (res?.exam) {
        setExams((prev) => [res.exam, ...prev]);
        playReminderChime('gentle');
        return;
      }
    } catch (err) {
      console.warn('Server createExam fallback:', err);
    }

    const newExam: Exam = {
      ...examData,
      id: `exam-${Date.now()}`,
    };
    setExams((prev) => [newExam, ...prev]);
    playReminderChime('gentle');
  };

  const recordExamResult = (resultData: Omit<ExamResult, 'id' | 'completedAt'>) => {
    const newResult: ExamResult = {
      ...resultData,
      id: `res-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    setExamResults((prev) => [
      newResult,
      ...prev.filter((r) => !(r.examId === resultData.examId && r.studentId === resultData.studentId)),
    ]);
    playReminderChime('success');
  };

  const addAchievement = (achData: Omit<StudentAchievement, 'id' | 'dateAwarded'>) => {
    const newAch: StudentAchievement = {
      ...achData,
      id: `ach-${Date.now()}`,
      dateAwarded: new Date().toISOString().split('T')[0],
    };
    setAchievements((prev) => [newAch, ...prev]);
    playReminderChime('success');
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const res = await apiClient.createUser(userData);
      if (res?.user) {
        setUsers((prev) => [...prev, res.user]);
        return;
      }
    } catch (err) {
      console.warn('Server createUser fallback:', err);
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const addClass = async (classData: Omit<ClassRoom, 'id'>) => {
    try {
      const res = await apiClient.createClass(classData);
      if (res?.classroom) {
        setClasses((prev) => [...prev, res.classroom]);
        return;
      }
    } catch (err) {
      console.warn('Server createClass fallback:', err);
    }

    const newClass: ClassRoom = {
      ...classData,
      id: `class-${Date.now()}`,
    };
    setClasses((prev) => [...prev, newClass]);
  };

  const sendStudyGroupMessage = (groupId: string, text: string, attachmentName?: string) => {
    if (!currentUser || !text.trim()) return;
    const newMsg: StudyGroupMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      messageText: text.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      attachmentName,
    };
    setStudyGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, messages: [...g.messages, newMsg] } : g))
    );
    playReminderChime('gentle');
  };

  const toggleStudyGroupChecklist = (groupId: string, checklistId: string) => {
    setStudyGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              checklist: g.checklist.map((c) =>
                c.id === checklistId ? { ...c, isCompleted: !c.isCompleted } : c
              ),
            }
          : g
      )
    );
  };

  const addStudyGroupChecklistItem = (groupId: string, title: string, assignedToName: string) => {
    if (!title.trim()) return;
    const newItem: StudyGroupChecklistItem = {
      id: `chk-${Date.now()}`,
      title: title.trim(),
      assignedToName: assignedToName || 'Semua Anggota',
      isCompleted: false,
    };
    setStudyGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, checklist: [...g.checklist, newItem] } : g))
    );
  };

  const createStudyGroup = (groupData: Omit<StudyGroup, 'id' | 'createdAt' | 'messages' | 'checklist'>) => {
    const newGroup: StudyGroup = {
      ...groupData,
      id: `group-${Date.now()}`,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          senderId: currentUser?.id || 'system',
          senderName: currentUser?.name || 'Sistem',
          senderRole: currentUser?.role || 'guru',
          messageText: `Ruang diskusi kelompok untuk tugas "${groupData.taskTitle}" telah dibuka. Selamat berkolaborasi!`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      checklist: [
        { id: `chk-1-${Date.now()}`, title: 'Diskusi ide utama & pembagian tugas proyek', assignedToName: 'Semua Anggota', isCompleted: false },
        { id: `chk-2-${Date.now()}`, title: 'Pengumpulan lembar kerja kelompok', assignedToName: 'Ketua Kelompok', isCompleted: false },
      ],
    };
    setStudyGroups((prev) => [newGroup, ...prev]);
    playReminderChime('success');
  };

  const saveDailyAttendance = async (records: Omit<DailyAttendanceRecord, 'id'>[]) => {
    try {
      const res = await apiClient.submitDailyAttendanceRecords(records);
      if (Array.isArray(res?.records) && res.records.length > 0) {
        setAttendanceRecords((prev) => {
          const keys = new Set(res.records.map((r: any) => `${r.date}_${r.studentId}`));
          const filteredPrev = prev.filter((r) => !keys.has(`${r.date}_${r.studentId}`));
          return [...res.records, ...filteredPrev];
        });
        playReminderChime('success');
        return;
      }
    } catch (err) {
      console.warn('Server saveDailyAttendance fallback:', err);
    }

    const newRecords: DailyAttendanceRecord[] = records.map((r, idx) => ({
      ...r,
      id: `att-${Date.now()}-${idx}`,
    }));

    setAttendanceRecords((prev) => {
      const keys = new Set(newRecords.map((r) => `${r.date}_${r.studentId}`));
      const filteredPrev = prev.filter((r) => !keys.has(`${r.date}_${r.studentId}`));
      return [...newRecords, ...filteredPrev];
    });

    playReminderChime('success');
  };

  // Stats calculation
  const monitoringStats: MonitoringStats = {
    activeAccounts: 86,
    totalClasses: classes.length,
    materialsCount: materials.length,
    tasksCount: tasks.length,
    submissionRate: 92,
    averageGrade: 88.5,
  };

  return (
    <LmsContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        users,
        classes,
        subjects,
        materials,
        tasks,
        submissions,
        exams,
        examResults,
        questionBank,
        achievements,
        studyGroups,
        attendanceRecords,
        monthlyAttendance,
        smartAlerts,
        dismissAlert,
        triggerSmartCheck,
        loginWithCredentials,
        loginAs,
        logout,
        addTask,
        updateTask,
        deleteTask,
        submitTask,
        gradeSubmission,
        addMaterial,
        incrementMaterialViews,
        addQuestionBankItem,
        createExam,
        recordExamResult,
        addAchievement,
        addUser,
        addClass,
        sendStudyGroupMessage,
        toggleStudyGroupChecklist,
        addStudyGroupChecklistItem,
        createStudyGroup,
        saveDailyAttendance,
        isSecurityModalOpen,
        setIsSecurityModalOpen,
        isRoleTampered,
        serverVerifiedRole,
        checkServerRoleIntegrity,
        syncWithServer,
        monitoringStats,
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export const useLms = () => {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error('useLms must be used within an LmsProvider');
  }
  return context;
};
