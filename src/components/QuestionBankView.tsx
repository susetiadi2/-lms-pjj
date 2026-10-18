import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { QuestionBankItem } from '../types/lms';
import { HelpCircle, Plus, Search, Filter, BookOpen, Check } from 'lucide-react';

export const QuestionBankView: React.FC = () => {
  const { questionBank, subjects, addQuestionBankItem, currentUser } = useLms();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Mudah');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');

  const filteredQuestions = questionBank.filter((q) => {
    const matchSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = subjectFilter === 'all' || q.subjectId === subjectFilter;
    const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchSearch && matchSubject && matchDiff;
  });

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    const sub = subjects.find((s) => s.id === subjectId);
    addQuestionBankItem({
      subjectId,
      subjectName: sub ? sub.name : 'Tematik Terpadu',
      classLevel: 'Kelas 5',
      difficulty,
      topic,
      questionText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC },
        { key: 'D', text: optD },
      ],
      correctAnswer,
      authorName: currentUser?.name || 'Ibu Rahmawati, S.Pd.',
    });
    setIsModalOpen(false);
    setQuestionText('');
    setTopic('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Bank Soal Terpadu</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Koleksi butir soal ujian dan kuis terstandar Kurikulum Merdeka yang siap digunakan para guru.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Butir Soal</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari butir soal berdasarkan materi atau pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#3d6053]"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-[#3d6053]"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-[#3d6053]"
        >
          <option value="all">Semua Tingkat</option>
          <option value="Mudah">Mudah</option>
          <option value="Sedang">Sedang</option>
          <option value="Sulit">Sulit</option>
        </select>
      </div>

      {/* Question Cards */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                  {q.subjectName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Topik: {q.topic}</span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  q.difficulty === 'Mudah'
                    ? 'bg-emerald-100 text-emerald-800'
                    : q.difficulty === 'Sedang'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {q.difficulty}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
              {q.questionText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {q.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    opt.key === q.correctAnswer
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </div>
                  {opt.key === q.correctAnswer && (
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                      Kunci Jawaban
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              Disusun oleh: {q.authorName}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Question */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Soal ke Bank Soal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Isi pertanyaan pilihan ganda beserta kunci jawaban yang tepat.
            </p>

            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Kesulitan</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Topik / Bahasan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Siklus Air, Pecahan, Cerita Rakyat"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pertanyaan Soal</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan teks pertanyaan soal..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">Pilihan Jawaban (A, B, C, D)</span>
                <input
                  type="text"
                  required
                  placeholder="Pilihan A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Pilihan B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Pilihan C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Pilihan D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kunci Jawaban Benar</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-[#3d6053]"
                >
                  <option value="A">Pilihan A</option>
                  <option value="B">Pilihan B</option>
                  <option value="C">Pilihan C</option>
                  <option value="D">Pilihan D</option>
                </select>
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
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
