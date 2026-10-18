import { User, ClassRoom, Subject, LearningMaterial, Task, TaskSubmission, Exam, QuestionBankItem, StudentAchievement, StudyGroup, DailyAttendanceRecord, MonthlyAttendanceSummary } from '../types/lms';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-ks-1',
    username: '087695_diva',
    name: 'Mr. DIVA, M.Pd.',
    role: 'kepala_sekolah',
    nisOrNip: '19790514 200312 1 002',
    email: 'mr.diva@smartschool.sch.id',
    phone: '0812-8899-7711',
    status: 'active',
  },
  {
    id: 'user-guru-1',
    username: 'guru_rahma',
    name: 'Ibu Rahmawati, S.Pd.',
    role: 'guru',
    className: 'Kelas 5A',
    subjectSpecialty: 'Tematik & Bahasa Indonesia',
    nisOrNip: '19850320 200801 2 014',
    email: 'rahmawati@smartschool.sch.id',
    phone: '0813-4455-6677',
    status: 'active',
  },
  {
    id: 'user-guru-2',
    username: 'guru_hendra',
    name: 'Pak Hendra Saputra, M.Pd.',
    role: 'guru',
    className: 'Kelas 5B & 6A',
    subjectSpecialty: 'Matematika & IPA',
    nisOrNip: '19871115 201001 1 008',
    email: 'hendra.s@smartschool.sch.id',
    phone: '0812-9988-3322',
    status: 'active',
  },
  {
    id: 'user-siswa-1',
    username: 'siswa_fauzan',
    name: 'Ahmad Fauzan',
    role: 'siswa',
    className: 'Kelas 5A',
    nisOrNip: 'NISN-0091827364',
    email: 'fauzan.ahmad@siswa.smartschool.sch.id',
    phone: '0857-1122-3344',
    status: 'active',
  },
  {
    id: 'user-siswa-2',
    username: 'siswa_annisa',
    name: 'Siti Annisa Putri',
    role: 'siswa',
    className: 'Kelas 5A',
    nisOrNip: 'NISN-0091827365',
    email: 'annisa.putri@siswa.smartschool.sch.id',
    phone: '0857-3344-5566',
    status: 'active',
  },
  {
    id: 'user-siswa-3',
    username: 'siswa_budi',
    name: 'Budi Kurniawan Pratama',
    role: 'siswa',
    className: 'Kelas 5B',
    nisOrNip: 'NISN-0091827366',
    email: 'budi.kurnia@siswa.smartschool.sch.id',
    phone: '0857-7788-9900',
    status: 'active',
  },
];

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'c-1a', name: 'Kelas 1A', level: 1, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Farida, S.Pd.', totalStudents: 28, academicYear: '2026/2027' },
  { id: 'c-1b', name: 'Kelas 1B', level: 1, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Nurul, S.Pd.', totalStudents: 27, academicYear: '2026/2027' },
  { id: 'c-2a', name: 'Kelas 2A', level: 2, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Pak Dimas, S.Pd.', totalStudents: 29, academicYear: '2026/2027' },
  { id: 'c-2b', name: 'Kelas 2B', level: 2, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Dewi, S.Pd.', totalStudents: 28, academicYear: '2026/2027' },
  { id: 'c-3a', name: 'Kelas 3A', level: 3, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Sri, S.Pd.', totalStudents: 30, academicYear: '2026/2027' },
  { id: 'c-4a', name: 'Kelas 4A', level: 4, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Pak Agus, M.Pd.', totalStudents: 31, academicYear: '2026/2027' },
  { id: 'c-4b', name: 'Kelas 4B', level: 4, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Rina, S.Pd.', totalStudents: 30, academicYear: '2026/2027' },
  { id: 'c-5a', name: 'Kelas 5A', level: 5, homeroomTeacherId: 'user-guru-1', homeroomTeacherName: 'Ibu Rahmawati, S.Pd.', totalStudents: 32, academicYear: '2026/2027' },
  { id: 'c-5b', name: 'Kelas 5B', level: 5, homeroomTeacherId: 'user-guru-2', homeroomTeacherName: 'Pak Hendra Saputra, M.Pd.', totalStudents: 31, academicYear: '2026/2027' },
  { id: 'c-6a', name: 'Kelas 6A', level: 6, homeroomTeacherId: 'user-guru-2', homeroomTeacherName: 'Pak Bambang, M.Pd.', totalStudents: 32, academicYear: '2026/2027' },
  { id: 'c-6b', name: 'Kelas 6B', level: 6, homeroomTeacherId: 'user-guru-2', homeroomTeacherName: 'Ibu Ratna, S.Pd.', totalStudents: 30, academicYear: '2026/2027' },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: 'TEM-5', name: 'Tematik Terpadu', gradeLevel: 'Kelas 5', teacherName: 'Ibu Rahmawati, S.Pd.', iconName: 'Layers', color: '#3d6053' },
  { id: 'sub-2', code: 'MTK-5', name: 'Matematika Terapan', gradeLevel: 'Kelas 5', teacherName: 'Pak Hendra Saputra, M.Pd.', iconName: 'Calculator', color: '#2563eb' },
  { id: 'sub-3', code: 'IPA-5', name: 'Ilmu Pengetahuan Alam', gradeLevel: 'Kelas 5', teacherName: 'Pak Hendra Saputra, M.Pd.', iconName: 'FlaskConical', color: '#059669' },
  { id: 'sub-4', code: 'BIN-5', name: 'Bahasa Indonesia', gradeLevel: 'Kelas 5', teacherName: 'Ibu Rahmawati, S.Pd.', iconName: 'BookOpen', color: '#d97706' },
  { id: 'sub-5', code: 'PAI-5', name: 'Pendidikan Agama Islam', gradeLevel: 'Kelas 5', teacherName: 'Ustadz Mansyur, S.Pd.I.', iconName: 'Sparkles', color: '#0284c7' },
  { id: 'sub-6', code: 'BIG-5', name: 'Bahasa Inggris Dasar', gradeLevel: 'Kelas 5', teacherName: 'Miss Sarah Johnson', iconName: 'Languages', color: '#7c3aed' },
];

export const INITIAL_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat-1',
    title: 'Siklus Air dan Manfaatnya bagi Kehidupan di Bumi',
    subjectId: 'sub-3',
    subjectName: 'Ilmu Pengetahuan Alam',
    classLevel: 'Kelas 5A',
    authorId: 'user-guru-2',
    authorName: 'Pak Hendra Saputra, M.Pd.',
    createdAt: '2026-10-15',
    description: 'Pelajari proses evaporasi, kondensasi, presipitasi, dan infiltrasi dalam siklus hidrologi bumi.',
    content: `## Pengertian Siklus Air
Siklus air (hidrologi) adalah perputaran air yang terjadi secara terus-menerus dari bumi ke atmosfer dan kembali lagi ke bumi.

### 4 Tahapan Utama:
1. **Evaporasi (Penguapan)**: Air di permukaan bumi (laut, danau, sungai) menguap karena panas sinar matahari.
2. **Kondensasi (Pengembunan)**: Uap air di atmosfer naik dan mendingin membentuk awan tebal.
3. **Presipitasi (Hujan)**: Titik-titik air di awan turun menjadi hujan saat sudah jenuh.
4. **Infiltrasi (Penyerapan)**: Sebagian air hujan meresap ke dalam tanah menjadi cadangan air tanah.

> *Catatan Guru:* Jagalah kelestarian hutan agar daya resap air di bumi tetap terjaga!`,
    type: 'article',
    fileSize: '1.4 MB',
    readTime: '7 menit',
    viewsCount: 48,
  },
  {
    id: 'mat-2',
    title: 'Konsep Dasar Pecahan Senilai dan Operasi Hitung',
    subjectId: 'sub-2',
    subjectName: 'Matematika Terapan',
    classLevel: 'Kelas 5A',
    authorId: 'user-guru-2',
    authorName: 'Pak Hendra Saputra, M.Pd.',
    createdAt: '2026-10-16',
    description: 'Visualisasi membagi kue menjadi pecahan setara 1/2 = 2/4 = 4/8 beserta latihan terarah.',
    content: `## Memahami Pecahan Senilai
Dua pecahan dikatakan senilai apabila mempunyai nilai yang sama meskipun pembilang dan penyebutnya berbeda.

### Contoh Sederhana:
- Jika sebuah pizza dipotong menjadi 2 bagian yang sama, satu potongan adalah **1/2**.
- Jika pizza yang sama dipotong menjadi 4 bagian, dua potongan adalah **2/4**.
- Besar potongan **1/2** sama persis dengan **2/4**!

### Cara Menentukan Pecahan Senilai:
Kalikan atau bagikan pembilang dan penyebut dengan angka bilangan bulat yang sama (selain 0).`,
    type: 'video',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    fileSize: '3.8 MB',
    readTime: '10 menit',
    viewsCount: 65,
  },
  {
    id: 'mat-3',
    title: 'Menulis Ringkasan Berdasarkan Ide Pokok Paragraf',
    subjectId: 'sub-4',
    subjectName: 'Bahasa Indonesia',
    classLevel: 'Kelas 5A',
    authorId: 'user-guru-1',
    authorName: 'Ibu Rahmawati, S.Pd.',
    createdAt: '2026-10-17',
    description: 'Panduan langkah demi langkah menyaring kalimat utama menjadi kesimpulan paragraf efektif.',
    content: `## Menemukan Ide Pokok
Ide pokok merupakan inti atau topik utama yang dibahas dalam suatu paragraf. Biasanya terletak di awal (deduktif), akhir (induktif), atau campuran.

### Langkah Praktis Menulis Ringkasan:
1. Bacalah teks secara menyeluruh dengan konsentrasi.
2. Tandai kalimat penting atau ide pokok di setiap alinea.
3. Tulis ulang dengan bahasa sendiri yang ringkas dan padat.`,
    type: 'pdf',
    fileSize: '2.1 MB',
    readTime: '5 menit',
    viewsCount: 32,
  },
];

// Helper to get formatted relative ISO dates
const now = new Date();
const todayEvening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
const tomorrowNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
const twoDaysLater = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 23, 59, 0);

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Tugas Harian: Buat Diagram Siklus Air & Jelaskan Tahap Evaporasi',
    subjectId: 'sub-3',
    subjectName: 'Ilmu Pengetahuan Alam',
    className: 'Kelas 5A',
    teacherId: 'user-guru-2',
    teacherName: 'Pak Hendra Saputra, M.Pd.',
    description: 'Gambarlah bagan siklus air di buku tulis gambar atau kertas HVS, lalu berikan penjelasan singkat tentang proses evaporasi dan presipitasi.',
    instructions: [
      'Gambarkan 4 tahapan siklus air dengan warna menarik.',
      'Beri label: Evaporasi, Kondensasi, Presipitasi, dan Infiltrasi.',
      'Tuliskan kesimpulan 3 kalimat tentang mengapa air di bumi tidak pernah habis.',
      'Foto hasil karyamu dan unggah di form penyerahan tugas ini.',
    ],
    dueDate: todayEvening.toISOString(),
    priority: 'tinggi',
    points: 100,
    allowFileUpload: true,
    createdAt: '2026-10-17T08:00:00Z',
    reminder: {
      enabled: true,
      remindMinutesBefore: 120, // 2 jam sebelumnya
      notifySound: true,
      customMessage: 'Pengingat Pintar: Tugas Diagram IPA harus dikumpulkan sore ini sebelum pukul 17.00!',
    },
  },
  {
    id: 'task-2',
    title: 'Latihan Pecahan Senilai & Soal Cerita Halaman 42',
    subjectId: 'sub-2',
    subjectName: 'Matematika Terapan',
    className: 'Kelas 5A',
    teacherId: 'user-guru-2',
    teacherName: 'Pak Hendra Saputra, M.Pd.',
    description: 'Selesaikan 5 soal cerita mengenai pembagian kue dan luas taman menggunakan penyederhanaan pecahan senilai.',
    instructions: [
      'Buka modul matematika halaman 42 latihan 2.',
      'Kerjakan nomor 1 sampai 5 lengkap dengan cara penyelesaian.',
      'Ketikkan jawaban ringkas di kolom teks atau lampirkan foto lembar kerja.',
    ],
    dueDate: tomorrowNoon.toISOString(),
    priority: 'sedang',
    points: 100,
    allowFileUpload: true,
    createdAt: '2026-10-18T07:30:00Z',
    reminder: {
      enabled: true,
      remindMinutesBefore: 60,
      notifySound: true,
      customMessage: 'Pengingat Pintar: Latihan Matematika batas akhir besok siang jam 12.00.',
    },
  },
  {
    id: 'task-3',
    title: 'Menulis Paragraf Deskripsi: Keindahan Lingkungan Rumahku',
    subjectId: 'sub-4',
    subjectName: 'Bahasa Indonesia',
    className: 'Kelas 5A',
    teacherId: 'user-guru-1',
    teacherName: 'Ibu Rahmawati, S.Pd.',
    description: 'Tuliskan satu paragraf deskripsi (minimal 6 kalimat) yang menceritakan lingkungan tempat tinggalmu dalam menyambut musim hujan.',
    instructions: [
      'Gunakan ejaan bahasa Indonesia yang baik dan benar (EYD/PUEBI).',
      'Sertakan setidaknya dua kata serapan indera (melihat, mendengar, atau mencium aroma).',
      'Periksa kembali tanda baca titik dan koma sebelum mengirim.',
    ],
    dueDate: twoDaysLater.toISOString(),
    priority: 'rendah',
    points: 100,
    allowFileUpload: false,
    createdAt: '2026-10-18T09:00:00Z',
    reminder: {
      enabled: true,
      remindMinutesBefore: 1440,
      notifySound: false,
      customMessage: 'Pengingat: Tugas menulis paragraf masih ada waktu 2 hari lagi.',
    },
  },
];

export const INITIAL_SUBMISSIONS: TaskSubmission[] = [
  {
    id: 'subm-1',
    taskId: 'task-1',
    studentId: 'user-siswa-2',
    studentName: 'Siti Annisa Putri',
    className: 'Kelas 5A',
    submittedAt: '2026-10-18T02:15:00Z',
    submissionText: 'Sudah saya gambar di kertas A4 dan diwarnai rapi menggunakan krayon. Gambar siklus air meliputi penguapan air danau dan pembentukan awan kumulus.',
    fileAttachment: 'diagram_siklus_air_annisa.jpg',
    score: 95,
    feedback: 'Luar biasa Annisa! Gambarnya sangat detail dan penjelasannya runtut.',
    gradedAt: '2026-10-18T03:00:00Z',
    status: 'dinilai',
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Penilaian Harian (PH) 1: IPA Siklus Alam & Lingkungan',
    subjectId: 'sub-3',
    subjectName: 'Ilmu Pengetahuan Alam',
    className: 'Kelas 5A',
    durationMinutes: 30,
    startDate: '2026-10-18T00:00:00Z',
    endDate: '2026-10-25T23:59:00Z',
    questionsCount: 5,
    isPublished: true,
    createdBy: 'Pak Hendra Saputra, M.Pd.',
    questions: [
      {
        id: 'q1',
        questionText: 'Peristiwa penguapan air permukaan bumi akibat pemanasan sinar matahari disebut dengan istilah...',
        options: [
          { key: 'A', text: 'Presipitasi' },
          { key: 'B', text: 'Evaporasi' },
          { key: 'C', text: 'Kondensasi' },
          { key: 'D', text: 'Infiltrasi' },
        ],
        points: 20,
      },
      {
        id: 'q2',
        questionText: 'Awan yang terbentuk dari kumpulan titik-titik air di atmosfer merupakan hasil dari tahapan...',
        options: [
          { key: 'A', text: 'Kondensasi (Pengembunan)' },
          { key: 'B', text: 'Transpirasi' },
          { key: 'C', text: 'Evaporasi' },
          { key: 'D', text: 'Sublimasi' },
        ],
        points: 20,
      },
      {
        id: 'q3',
        questionText: 'Apa dampak berkurangnya daerah resapan air di wilayah perkotaan terhadap siklus air?',
        options: [
          { key: 'A', text: 'Hujan akan turun lebih sering' },
          { key: 'B', text: 'Cadangan air tanah meningkat pesat' },
          { key: 'C', text: 'Aliran permukaan memicu banjir dan berkurangnya air tanah' },
          { key: 'D', text: 'Penguapan air laut terhenti total' },
        ],
        points: 20,
      },
      {
        id: 'q4',
        questionText: 'Bentuk air yang turun dari langit ke bumi dalam siklus hidrologi dinamakan...',
        options: [
          { key: 'A', text: 'Presipitasi' },
          { key: 'B', text: 'Asimilasi' },
          { key: 'C', text: 'Kondensasi' },
          { key: 'D', text: 'Erosi' },
        ],
        points: 20,
      },
      {
        id: 'q5',
        questionText: 'Peran tumbuhan dalam siklus air yang melepaskan uap air melalui pori-pori daun disebut...',
        options: [
          { key: 'A', text: 'Fotosintesis' },
          { key: 'B', text: 'Transpirasi' },
          { key: 'C', text: 'Respirasi' },
          { key: 'D', text: 'Fermentasi' },
        ],
        points: 20,
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'Kuis Kilat Matematika: Pecahan Senilai & Sederhana',
    subjectId: 'sub-2',
    subjectName: 'Matematika Terapan',
    className: 'Kelas 5A',
    durationMinutes: 20,
    startDate: '2026-10-18T00:00:00Z',
    endDate: '2026-10-24T23:59:00Z',
    questionsCount: 3,
    isPublished: true,
    createdBy: 'Pak Hendra Saputra, M.Pd.',
    questions: [
      {
        id: 'qm1',
        questionText: 'Pecahan yang senilai dengan 2/3 jika dikalikan dengan 4 adalah...',
        options: [
          { key: 'A', text: '6/9' },
          { key: 'B', text: '8/12' },
          { key: 'C', text: '8/15' },
          { key: 'D', text: '4/6' },
        ],
        points: 33,
      },
      {
        id: 'qm2',
        questionText: 'Bentuk paling sederhana dari pecahan 15/25 adalah...',
        options: [
          { key: 'A', text: '3/5' },
          { key: 'B', text: '5/7' },
          { key: 'C', text: '1/2' },
          { key: 'D', text: '2/5' },
        ],
        points: 33,
      },
      {
        id: 'qm3',
        questionText: 'Ibu memotong semangka menjadi 8 bagian sama besar. Rian memakan 2 bagian. Berapa bagian semangka yang dimakan Rian dalam pecahan sederhana?',
        options: [
          { key: 'A', text: '1/4' },
          { key: 'B', text: '1/2' },
          { key: 'C', text: '3/8' },
          { key: 'D', text: '2/6' },
        ],
        points: 34,
      },
    ],
  },
];

export const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'qb-1',
    subjectId: 'sub-3',
    subjectName: 'Ilmu Pengetahuan Alam',
    classLevel: 'Kelas 5',
    difficulty: 'Mudah',
    topic: 'Siklus Air',
    questionText: 'Sinar matahari berperan dalam siklus air sebagai...',
    options: [
      { key: 'A', text: 'Pemicu proses penguapan air di bumi' },
      { key: 'B', text: 'Pembeku butiran air di awan' },
      { key: 'C', text: 'Penyerap air ke dalam tanah' },
      { key: 'D', text: 'Penghembus angin' },
    ],
    correctAnswer: 'A',
    authorName: 'Pak Hendra Saputra, M.Pd.',
  },
  {
    id: 'qb-2',
    subjectId: 'sub-2',
    subjectName: 'Matematika Terapan',
    classLevel: 'Kelas 5',
    difficulty: 'Sedang',
    topic: 'Pecahan',
    questionText: 'Hasil dari 1/2 + 1/4 adalah...',
    options: [
      { key: 'A', text: '2/6' },
      { key: 'B', text: '3/4' },
      { key: 'C', text: '2/4' },
      { key: 'D', text: '4/4' },
    ],
    correctAnswer: 'B',
    authorName: 'Pak Hendra Saputra, M.Pd.',
  },
  {
    id: 'qb-3',
    subjectId: 'sub-4',
    subjectName: 'Bahasa Indonesia',
    classLevel: 'Kelas 5',
    difficulty: 'Mudah',
    topic: 'Teks Deskripsi',
    questionText: 'Ciri utama dari teks deskripsi adalah...',
    options: [
      { key: 'A', text: 'Berisi langkah-langkah membuat sesuatu' },
      { key: 'B', text: 'Menggambarkan objek secara terperinci sehingga pembaca seolah merasakan' },
      { key: 'C', text: 'Berisi perdebatan dua pendapat berlawanan' },
      { key: 'D', text: 'Menyajikan dongeng fiksi masa lalu' },
    ],
    correctAnswer: 'B',
    authorName: 'Ibu Rahmawati, S.Pd.',
  },
  {
    id: 'qb-4',
    subjectId: 'sub-3',
    subjectName: 'Ilmu Pengetahuan Alam',
    classLevel: 'Kelas 5',
    difficulty: 'Sulit',
    topic: 'Ekosistem',
    questionText: 'Dalam rantai makanan di sawah, posisi ular sawah adalah sebagai konsumen...',
    options: [
      { key: 'A', text: 'Konsumen Primer (I)' },
      { key: 'B', text: 'Konsumen Sekunder (II)' },
      { key: 'C', text: 'Produsen' },
      { key: 'D', text: 'Dekomposer' },
    ],
    correctAnswer: 'B',
    authorName: 'Pak Hendra Saputra, M.Pd.',
  },
];

export const INITIAL_ACHIEVEMENTS: StudentAchievement[] = [
  {
    id: 'ach-1',
    studentId: 'user-siswa-1',
    studentName: 'Ahmad Fauzan',
    className: 'Kelas 5A',
    title: 'Rajin Kumpul Tugas (Star Pupil)',
    category: 'Ketepatan Waktu',
    badgeIcon: 'Zap',
    dateAwarded: '2026-10-17',
    description: 'Menyelesaikan 5 tugas berturut-turut sebelum tenggat waktu berakhir.',
    stars: 5,
  },
  {
    id: 'ach-2',
    studentId: 'user-siswa-2',
    studentName: 'Siti Annisa Putri',
    className: 'Kelas 5A',
    title: 'Nilai Sempurna IPA (Master of Science)',
    category: 'Akademik',
    badgeIcon: 'Trophy',
    dateAwarded: '2026-10-18',
    description: 'Memperoleh nilai 95 pada tugas proyek diagram siklus air.',
    stars: 5,
  },
  {
    id: 'ach-3',
    studentId: 'user-siswa-1',
    studentName: 'Ahmad Fauzan',
    className: 'Kelas 5A',
    title: 'Pembaca Aktif Modul PJJ',
    category: 'Kedisiplinan',
    badgeIcon: 'BookOpenCheck',
    dateAwarded: '2026-10-16',
    description: 'Telah membaca dan menelaah seluruh modul tematik dan IPA.',
    stars: 4,
  },
];

export const INITIAL_STUDY_GROUPS: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'Kelompok 1: Proyek Miniatur Siklus Air',
    taskId: 'task-1',
    taskTitle: 'Tugas Harian: Buat Diagram Siklus Air & Jelaskan Tahap Evaporasi',
    subjectName: 'Ilmu Pengetahuan Alam',
    description: 'Ruang kolaborasi siswa untuk merancang gambar bagan hidrologi, pembagian tahapan evaporasi, presipitasi, dan penyusunan kesimpulan bersama.',
    createdAt: '2026-10-18T08:00:00Z',
    pinnedNote: '📌 Catatan Guru (Ibu Rahma): Pastikan bagian infiltrasi dan peresapan air tanah diberi keterangan jelas ya anak-anak!',
    members: [
      { userId: 'user-siswa-1', name: 'Ahmad Fauzan', role: 'siswa', isLeader: true },
      { userId: 'user-siswa-2', name: 'Siti Annisa Putri', role: 'siswa' },
      { userId: 'user-siswa-3', name: 'Budi Kurniawan Pratama', role: 'siswa' },
      { userId: 'user-guru-1', name: 'Ibu Rahmawati, S.Pd.', role: 'guru' },
    ],
    checklist: [
      { id: 'chk-1', title: 'Membuat sketsa danau dan penguapan (evaporasi)', assignedToName: 'Ahmad Fauzan', isCompleted: true },
      { id: 'chk-2', title: 'Mewarnai pembentukan awan (kondensasi) & hujan', assignedToName: 'Siti Annisa Putri', isCompleted: true },
      { id: 'chk-3', title: 'Menyusun kesimpulan 3 kalimat siklus air bumi', assignedToName: 'Budi Kurniawan', isCompleted: false },
      { id: 'chk-4', title: 'Review bersama & upload lembar kerja kelompok', assignedToName: 'Semua Anggota', isCompleted: false },
    ],
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-guru-1',
        senderName: 'Ibu Rahmawati, S.Pd.',
        senderRole: 'guru',
        messageText: 'Halo Kelompok 1! Selamat berdiskusi ya. Bagi tugas kalian agar tugas diagram IPA ini selesai sebelum pukul 17.00.',
        timestamp: '08:15',
      },
      {
        id: 'msg-2',
        senderId: 'user-siswa-1',
        senderName: 'Ahmad Fauzan',
        senderRole: 'siswa',
        messageText: 'Baik Bu Rahma! Teman-teman, saya sudah buat sketsa permukaan laut dan penguapannya di kertas A4.',
        timestamp: '08:22',
      },
      {
        id: 'msg-3',
        senderId: 'user-siswa-2',
        senderName: 'Siti Annisa Putri',
        senderRole: 'siswa',
        messageText: 'Keren Fauzan! Nanti bagian awan dan hujan presipitasi aku warnai pakai pensil warna gradasi biru ya.',
        timestamp: '08:25',
      },
      {
        id: 'msg-4',
        senderId: 'user-siswa-3',
        senderName: 'Budi Kurniawan Pratama',
        senderRole: 'siswa',
        messageText: 'Aku yang ketik kesimpulannya ya: "Air di bumi tidak pernah habis karena selalu berputar melalui siklus evaporasi dan presipitasi."',
        timestamp: '08:30',
      },
    ],
  },
  {
    id: 'group-2',
    name: 'Kelompok 2: Kolaborasi Pecahan & Soal Cerita',
    taskId: 'task-2',
    taskTitle: 'Latihan Pecahan Senilai & Soal Cerita Halaman 42',
    subjectName: 'Matematika Terapan',
    description: 'Diskusi pemecahan soal cerita matematika dan penyederhanaan pecahan senilai modul hal 42.',
    createdAt: '2026-10-18T09:30:00Z',
    pinnedNote: '📌 Catatan: Gunakan FPB (Faktor Persekutuan Terbesar) untuk menyederhanakan pecahan ke bentuk paling kecil.',
    members: [
      { userId: 'user-siswa-1', name: 'Ahmad Fauzan', role: 'siswa' },
      { userId: 'user-siswa-2', name: 'Siti Annisa Putri', role: 'siswa', isLeader: true },
      { userId: 'user-guru-2', name: 'Pak Hendra Saputra, M.Pd.', role: 'guru' },
    ],
    checklist: [
      { id: 'chk-21', title: 'Selesaikan soal cerita pembagian kue nomer 1 & 2', assignedToName: 'Siti Annisa Putri', isCompleted: true },
      { id: 'chk-22', title: 'Kerjakan soal perbandingan luas taman nomer 3 & 4', assignedToName: 'Ahmad Fauzan', isCompleted: false },
      { id: 'chk-23', title: 'Kroscek jawaban akhir bersama Pak Hendra', assignedToName: 'Semua Anggota', isCompleted: false },
    ],
    messages: [
      {
        id: 'msg-201',
        senderId: 'user-guru-2',
        senderName: 'Pak Hendra Saputra, M.Pd.',
        senderRole: 'guru',
        messageText: 'Anak-anak, jika ada soal pecahan senilai yang membingungkan, tanyakan langsung di ruang obrolan kelompok ini ya.',
        timestamp: '09:35',
      },
      {
        id: 'msg-202',
        senderId: 'user-siswa-2',
        senderName: 'Siti Annisa Putri',
        senderRole: 'siswa',
        messageText: 'Pak Hendra, nomor 3 itu pecahan 15/25 sama-sama dibagi 5 jadi 3/5 kan ya?',
        timestamp: '09:40',
      },
      {
        id: 'msg-203',
        senderId: 'user-guru-2',
        senderName: 'Pak Hendra Saputra, M.Pd.',
        senderRole: 'guru',
        messageText: 'Tepat sekali Annisa! 100 untuk ketelitianmu. Lanjutkan ke nomor 4 ya.',
        timestamp: '09:42',
      },
    ],
  },
];

export const INITIAL_ATTENDANCE: DailyAttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'user-siswa-1',
    studentName: 'Ahmad Fauzan',
    className: 'Kelas 5A',
    date: '2026-10-18',
    status: 'hadir',
    note: 'Hadir tepat waktu mengikuti sesi PJJ',
    checkedByTeacher: 'Ibu Rahmawati, S.Pd.',
  },
  {
    id: 'att-2',
    studentId: 'user-siswa-2',
    studentName: 'Siti Annisa Putri',
    className: 'Kelas 5A',
    date: '2026-10-18',
    status: 'hadir',
    note: 'Aktif merespon diskusi',
    checkedByTeacher: 'Ibu Rahmawati, S.Pd.',
  },
  {
    id: 'att-3',
    studentId: 'user-siswa-3',
    studentName: 'Budi Kurniawan Pratama',
    className: 'Kelas 5B',
    date: '2026-10-18',
    status: 'hadir',
    note: 'Presensi digital tuntas',
    checkedByTeacher: 'Pak Hendra Saputra, M.Pd.',
  },
];

export const INITIAL_MONTHLY_ATTENDANCE: MonthlyAttendanceSummary[] = [
  { className: 'Kelas 1A', level: 1, totalStudents: 28, effectiveDays: 22, hadirRate: 97.4, totalHadir: 600, totalSakit: 10, totalIzin: 5, totalAlpa: 1, month: 'Oktober 2026' },
  { className: 'Kelas 1B', level: 1, totalStudents: 27, effectiveDays: 22, hadirRate: 96.8, totalHadir: 575, totalSakit: 12, totalIzin: 6, totalAlpa: 1, month: 'Oktober 2026' },
  { className: 'Kelas 2A', level: 2, totalStudents: 29, effectiveDays: 22, hadirRate: 98.1, totalHadir: 626, totalSakit: 8, totalIzin: 3, totalAlpa: 1, month: 'Oktober 2026' },
  { className: 'Kelas 2B', level: 2, totalStudents: 28, effectiveDays: 22, hadirRate: 95.9, totalHadir: 591, totalSakit: 14, totalIzin: 9, totalAlpa: 2, month: 'Oktober 2026' },
  { className: 'Kelas 3A', level: 3, totalStudents: 30, effectiveDays: 22, hadirRate: 96.5, totalHadir: 637, totalSakit: 13, totalIzin: 8, totalAlpa: 2, month: 'Oktober 2026' },
  { className: 'Kelas 4A', level: 4, totalStudents: 31, effectiveDays: 22, hadirRate: 95.6, totalHadir: 652, totalSakit: 18, totalIzin: 10, totalAlpa: 2, month: 'Oktober 2026' },
  { className: 'Kelas 4B', level: 4, totalStudents: 30, effectiveDays: 22, hadirRate: 97.0, totalHadir: 640, totalSakit: 11, totalIzin: 7, totalAlpa: 2, month: 'Oktober 2026' },
  { className: 'Kelas 5A', level: 5, totalStudents: 32, effectiveDays: 22, hadirRate: 98.3, totalHadir: 692, totalSakit: 7, totalIzin: 4, totalAlpa: 1, month: 'Oktober 2026' },
  { className: 'Kelas 5B', level: 5, totalStudents: 31, effectiveDays: 22, hadirRate: 96.2, totalHadir: 656, totalSakit: 15, totalIzin: 9, totalAlpa: 2, month: 'Oktober 2026' },
  { className: 'Kelas 6A', level: 6, totalStudents: 32, effectiveDays: 22, hadirRate: 98.9, totalHadir: 696, totalSakit: 5, totalIzin: 2, totalAlpa: 1, month: 'Oktober 2026' },
  { className: 'Kelas 6B', level: 6, totalStudents: 30, effectiveDays: 22, hadirRate: 97.6, totalHadir: 644, totalSakit: 9, totalIzin: 5, totalAlpa: 2, month: 'Oktober 2026' },
];


