import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../types/lms';

interface ProgressPdfData {
  student: User;
  homeroomTeacher: string;
  principalName: string;
  semesterData: {
    month: string;
    milestone: string;
    studentScore: number;
    classAverage: number;
    kkm: number;
  }[];
  subjectData: {
    subject: string;
    score: number;
    classAvg: number;
    target: number;
  }[];
  averageScore: number;
  growthDelta: number;
  achievementsCount: number;
}

export function generateStudentProgressPdf(data: ProgressPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. School Header (Kop Surat Sekolah)
  // Background decorative top banner
  doc.setFillColor(61, 96, 83); // #3d6053 sage green
  doc.rect(0, 0, pageWidth, 5, 'F');

  // School Emblem / Logo text
  doc.setFillColor(229, 168, 56); // #e5a838 gold
  doc.roundedRect(14, 12, 12, 12, 2, 2, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('D', 18, 20.5);

  doc.setTextColor(61, 96, 83);
  doc.setFontSize(14);
  doc.text('MR. DIVA SMART LEARNING SCHOOL', 30, 17);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Sistem Manajemen Pembelajaran Jarak Jauh (PJJ) Terpadu', 30, 21.5);
  doc.text('NPSN: 10829102 • Akreditasi A • Jl. Edukasi Digital Cendekia No. 88, Indonesia', 30, 25.5);

  // Line divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(14, 29, pageWidth - 14, 29);

  // 2. Report Document Title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN PERKEMBANGAN AKADEMIK & BELAJAR SISWA', pageWidth / 2, 36, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Semester Ganjil • Tahun Ajaran 2026/2027', pageWidth / 2, 40.5, { align: 'center' });

  // 3. Student Identification Box
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Siswa', 18, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.student.name}`, 44, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('NISN / ID', 18, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.student.nisOrNip}`, 44, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Rombel / Kelas', 18, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.student.className || 'Kelas 5A'}`, 44, 60);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Wali Kelas', 115, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.homeroomTeacher}`, 145, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Rata-rata Semester', 115, 55);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 96, 83);
  doc.text(`: ${data.averageScore} / 100 (Predikat A)`, 145, 55);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Tren Pertumbuhan', 115, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`: +${data.growthDelta} Poin (Meningkat)`, 145, 60);

  // 4. Milestone Progression Table
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('A. Rekapitulasi Pertumbuhan Nilai Bulanan & Evaluasi', 14, 72);

  const milestoneRows = data.semesterData.map((pt) => [
    pt.month,
    pt.milestone,
    pt.studentScore.toString(),
    pt.classAverage.toString(),
    pt.kkm.toString(),
    pt.studentScore >= pt.kkm ? 'Tuntas (Lulus KKM)' : 'Perlu Bimbingan',
  ]);

  autoTable(doc, {
    startY: 75,
    margin: { left: 14, right: 14 },
    head: [['Bulan', 'Tahap / Evaluasi Belajar', 'Nilai Siswa', 'Rata-rata Kelas', 'KKM', 'Status']],
    body: milestoneRows,
    theme: 'grid',
    headStyles: {
      fillColor: [61, 96, 83],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { cellWidth: 68 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 22, textColor: [61, 96, 83] },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', fontStyle: 'bold', textColor: [22, 101, 52] },
    },
  });

  // 5. Subject Mastery Table
  const lastTableY = (doc as any).lastAutoTable.finalY || 135;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('B. Capaian Penguasaan per Mata Pelajaran', 14, lastTableY + 8);

  const subjectRows = data.subjectData.map((sub) => {
    const gradeLetter = sub.score >= 90 ? 'A (Sangat Baik)' : sub.score >= 80 ? 'B (Baik)' : 'C (Cukup)';
    return [
      sub.subject,
      sub.score.toString(),
      sub.classAvg.toString(),
      '75',
      gradeLetter,
      sub.score > sub.classAvg ? 'Di Atas Rata-rata Kelas' : 'Sesuai Standar',
    ];
  });

  autoTable(doc, {
    startY: lastTableY + 11,
    margin: { left: 14, right: 14 },
    head: [['Mata Pelajaran', 'Nilai Siswa', 'Rata-rata Kelas', 'KKM', 'Predikat', 'Keterangan']],
    body: subjectRows,
    theme: 'grid',
    headStyles: {
      fillColor: [61, 96, 83],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 22, textColor: [61, 96, 83] },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 32 },
      5: { halign: 'center', textColor: [71, 85, 105] },
    },
  });

  // 6. Notes & Feedback from Homeroom Teacher
  const lastTable2Y = (doc as any).lastAutoTable.finalY || 205;

  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, lastTable2Y + 6, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(61, 96, 83);
  doc.text('Catatan Wali Kelas & Motivasi Belajar:', 18, lastTable2Y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Ananda ${data.student.name} menunjukkan kedisiplinan tinggi dalam mengerjakan tugas harian PJJ tepat waktu serta meraih capaian belajar yang konsisten meningkat (+${data.growthDelta} poin). Pertahankan semangat belajar, eksplorasi materi, dan kepedulian terhadap teman sekelas.`,
    18,
    lastTable2Y + 16,
    { maxWidth: pageWidth - 36 }
  );

  // 7. Signatures / Pengesahan
  const signatureY = lastTable2Y + 34;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Date and place
  doc.text(`Diterbitkan secara digital pada: ${currentDate}`, pageWidth - 14, signatureY - 2, { align: 'right' });

  // Column: Orang Tua / Wali
  doc.text('Mengetahui,', 22, signatureY + 4);
  doc.text('Orang Tua / Wali Siswa', 22, signatureY + 8);
  doc.line(20, signatureY + 28, 65, signatureY + 28);
  doc.text('( ....................................... )', 22, signatureY + 32);

  // Column: Wali Kelas
  doc.text('Wali Kelas 5A,', 85, signatureY + 4);
  doc.text('Mr. DIVA Smart School', 85, signatureY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(data.homeroomTeacher, 85, signatureY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19850320 200801 2 014', 85, signatureY + 32);

  // Column: Kepala Sekolah
  doc.text('Kepala Sekolah,', 148, signatureY + 4);
  doc.text('Mr. DIVA Smart School', 148, signatureY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(data.principalName, 148, signatureY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19790514 200312 1 002', 148, signatureY + 32);

  // Save the document
  const fileName = `Rapor_PJJ_${data.student.name.replace(/\s+/g, '_')}_Semester_Ganjil.pdf`;
  doc.save(fileName);
}

export interface AttendanceReportPdfData {
  month: string;
  principalName: string;
  totalStudentsSchool: number;
  overallAttendanceRate: number;
  effectiveDays: number;
  summaries: {
    className: string;
    level: number;
    totalStudents: number;
    effectiveDays: number;
    hadirRate: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpa: number;
    month: string;
  }[];
}

export function generateMonthlyAttendancePdf(data: AttendanceReportPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(61, 96, 83); // #3d6053
  doc.rect(0, 0, pageWidth, 5, 'F');

  // School emblem & title
  doc.setFillColor(229, 168, 56); // #e5a838 gold
  doc.roundedRect(14, 12, 12, 12, 2, 2, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('D', 18, 20.5);

  doc.setTextColor(61, 96, 83);
  doc.setFontSize(14);
  doc.text('MR. DIVA SMART LEARNING SCHOOL', 30, 17);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Pusat Monitoring & Evaluasi Presensi Pembelajaran Jarak Jauh (PJJ)', 30, 21.5);
  doc.text('NPSN: 10829102 • Akreditasi A • Jl. Edukasi Digital Cendekia No. 88, Indonesia', 30, 25.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(14, 29, pageWidth - 14, 29);

  // Document Title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN REKAPITULASI PRESENSI BULANAN KELAS', pageWidth / 2, 36, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${data.month} • Tahun Ajaran 2026/2027`, pageWidth / 2, 40.5, { align: 'center' });

  // Summary KPI box
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Siswa Aktif', 18, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.totalStudentsSchool} Siswa (11 Rombel)`, 48, 51);

  doc.setFont('helvetica', 'bold');
  doc.text('Hari Belajar Efektif', 18, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.effectiveDays} Hari`, 48, 57);

  doc.setFont('helvetica', 'bold');
  doc.text('Rata-rata Kehadiran', 115, 51);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 96, 83);
  doc.text(`: ${data.overallAttendanceRate}% (Sangat Baik)`, 150, 51);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Status Audit KS', 115, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(': Telah Diverifikasi & Disahkan', 150, 57);

  // Table per class
  const tableRows = data.summaries.map((s) => [
    s.className,
    `Tingkat ${s.level}`,
    s.totalStudents.toString(),
    s.totalHadir.toString(),
    s.totalSakit.toString(),
    s.totalIzin.toString(),
    s.totalAlpa.toString(),
    `${s.hadirRate}%`,
    s.hadirRate >= 95 ? 'Memenuhi Standar' : 'Perlu Perhatian',
  ]);

  autoTable(doc, {
    startY: 66,
    margin: { left: 14, right: 14 },
    head: [['Rombel Kelas', 'Tingkat', 'Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', '% Hadir', 'Keterangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [61, 96, 83],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 18, textColor: [61, 96, 83], fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 16, textColor: [225, 29, 72] },
      7: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [61, 96, 83] },
      8: { halign: 'center', cellWidth: 34, fontStyle: 'normal' },
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || 180;

  // Signatures
  const signatureY = finalTableY + 12;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Dicetak dari Sistem LMS Mr. DIVA pada: ${currentDate}`, pageWidth - 14, signatureY, { align: 'right' });

  // Column Left: Koordinator Kurikulum & Kesiswaan
  doc.text('Mengetahui,', 22, signatureY + 6);
  doc.text('Koordinator Presensi & Kesiswaan', 22, signatureY + 10);
  doc.line(20, signatureY + 30, 75, signatureY + 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Ibu Rahmawati, S.Pd.', 22, signatureY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19850320 200801 2 014', 22, signatureY + 38);

  // Column Right: Kepala Sekolah
  doc.text('Disahkan & Disetujui oleh,', 135, signatureY + 6);
  doc.text('Kepala Sekolah Mr. DIVA Smart School', 135, signatureY + 10);
  doc.line(133, signatureY + 30, 195, signatureY + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(data.principalName, 135, signatureY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19790514 200312 1 002', 135, signatureY + 38);

  const fileName = `Rekap_Presensi_Bulanan_${data.month.replace(/\s+/g, '_')}_Mr_DIVA.pdf`;
  doc.save(fileName);
}

