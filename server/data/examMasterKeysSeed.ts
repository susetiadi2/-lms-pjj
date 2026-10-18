export interface SeedMasterKey {
  questionId: string;
  correctAnswer: string;
  explanation: string;
  points: number;
}

export const INITIAL_EXAM_MASTER_KEYS: Record<string, SeedMasterKey[]> = {
  'exam-1': [
    {
      questionId: 'q1',
      correctAnswer: 'B',
      explanation: 'Evaporasi adalah proses perubahan air dari fase cair menjadi uap air akibat panas matahari.',
      points: 20,
    },
    {
      questionId: 'q2',
      correctAnswer: 'A',
      explanation: 'Kondensasi terjadi ketika uap air yang naik mendingin dan berubah menjadi butiran air penyusun awan.',
      points: 20,
    },
    {
      questionId: 'q3',
      correctAnswer: 'C',
      explanation: 'Tanpa daerah resapan, air hujan tidak dapat meresap (infiltrasi) melainkan langsung mengalir di permukaan sehingga memicu genangan air atau banjir.',
      points: 20,
    },
    {
      questionId: 'q4',
      correctAnswer: 'A',
      explanation: 'Presipitasi mencakup semua bentuk air yang jatuh dari atmosfer, seperti air hujan, salju, maupun embun.',
      points: 20,
    },
    {
      questionId: 'q5',
      correctAnswer: 'B',
      explanation: 'Transpirasi adalah proses hilangnya air dalam bentuk uap dari jaringan tumbuhan melalui stomata daun.',
      points: 20,
    },
  ],
  'exam-2': [
    {
      questionId: 'qm1',
      correctAnswer: 'B',
      explanation: '2 x 4 = 8, 3 x 4 = 12. Jadi senilai dengan 8/12.',
      points: 33,
    },
    {
      questionId: 'qm2',
      correctAnswer: 'A',
      explanation: 'Keduanya dibagi FPB yaitu 5: 15/5 = 3 dan 25/5 = 5 -> 3/5.',
      points: 33,
    },
    {
      questionId: 'qm3',
      correctAnswer: 'A',
      explanation: '2/8 disederhanakan menjadi 1/4.',
      points: 34,
    },
  ],
  'exam-isolated-002': [
    {
      questionId: 'q-iso-1',
      correctAnswer: 'A',
      explanation: 'Akar menyerap air dan hara mineral.',
      points: 50,
    },
    {
      questionId: 'q-iso-2',
      correctAnswer: 'B',
      explanation: 'Karbondioksida digunakan dalam reaksi terang/gelap fotosintesis.',
      points: 50,
    },
  ],
};
