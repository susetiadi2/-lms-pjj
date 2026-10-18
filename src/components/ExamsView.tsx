import React, { useState, useEffect } from 'react';
import { useLms } from '../context/LmsContext';
import { Exam, ExamQuestion } from '../types/lms';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Trophy,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../utils/apiClient';

export const ExamsView: React.FC = () => {
  const { exams, examResults, recordExamResult, currentUser, subjects } = useLms();
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  // Active exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverAudit, setServerAudit] = useState<{
    serverAuditHash: string;
    evaluatedOnServer: boolean;
    itemEvaluations?: any[];
  } | null>(null);

  // Start exam - fetches sanitized questions from server
  const handleStartExam = async (exam: Exam) => {
    try {
      const srvData = await apiClient.getExam(exam.id);
      if (srvData && srvData.exam) {
        setActiveExam(srvData.exam);
      } else {
        setActiveExam(exam);
      }
    } catch {
      setActiveExam(exam);
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSecondsRemaining(exam.durationMinutes * 60);
    setIsFinished(false);
    setFinalScore(null);
    setServerAudit(null);
  };

  // Timer countdown
  useEffect(() => {
    if (!activeExam || isFinished) return;
    if (secondsRemaining <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, secondsRemaining, isFinished]);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  // SUBMIT EXAM: Evaluated strictly by backend server master key (NO client-side score fallback)
  const handleSubmitExam = async () => {
    if (!activeExam || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const timeSpent = activeExam.durationMinutes * 60 - secondsRemaining;
      const res = await apiClient.submitExam(activeExam.id, selectedAnswers, timeSpent);

      if (res && res.result) {
        const calculatedScore = res.result.score;
        setFinalScore(calculatedScore);
        setServerAudit({
          serverAuditHash: res.result.serverAuditHash,
          evaluatedOnServer: true,
          itemEvaluations: res.result.itemEvaluations,
        });

        recordExamResult({
          examId: activeExam.id,
          studentId: currentUser?.id || 'user-siswa-1',
          studentName: currentUser?.name || 'Ahmad Fauzan',
          className: currentUser?.className || 'Kelas 5A',
          score: calculatedScore,
          maxScore: 100,
          answers: selectedAnswers,
        });

        if (calculatedScore >= 75) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
        setIsFinished(true);
      }
    } catch (err: any) {
      if (err?.code === 'DUPLICATE_SUBMISSION' && err?.data?.previousResult) {
        setFinalScore(err.data.previousResult.score);
        setSubmitError(err.message || 'Ujian ini sudah pernah dikumpulkan sebelumnya.');
        setIsFinished(true);
      } else {
        setSubmitError(err?.message || 'Gagal mengirim jawaban ujian ke server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* If Exam is Active (Interactive Test Simulator) */}
      {activeExam ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                {activeExam.subjectName}
              </span>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{activeExam.title}</h2>
            </div>

            {!isFinished && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-900 font-mono font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Sisa Waktu: {formatTimer(secondsRemaining)}</span>
              </div>
            )}
          </div>

          {submitError && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {!isFinished ? (
            /* Question Area */
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {activeExam.questions[currentQuestionIndex] && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Soal Nomor {currentQuestionIndex + 1} dari {activeExam.questions.length}
                      </span>
                      <span className="text-xs font-semibold text-[#3d6053] bg-[#eef5f1] px-2 py-0.5 rounded-md">
                        {activeExam.questions[currentQuestionIndex].points} Poin
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed mb-6">
                      {activeExam.questions[currentQuestionIndex].questionText}
                    </p>

                    {/* Options list */}
                    <div className="space-y-3">
                      {activeExam.questions[currentQuestionIndex].options.map((opt) => {
                        const isSelected =
                          selectedAnswers[activeExam.questions[currentQuestionIndex].id] === opt.key;
                        return (
                          <div
                            key={opt.key}
                            onClick={() =>
                              handleSelectOption(activeExam.questions[currentQuestionIndex].id, opt.key)
                            }
                            className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-[#eef5f1] border-[#3d6053] text-[#244237] font-semibold ring-1 ring-[#3d6053]'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-[#3d6053] text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Prev / Next Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {currentQuestionIndex < activeExam.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Selanjutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Selesai & Kumpulkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Navigation Palette */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Nomor Soal
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {activeExam.questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isCurrent = currentQuestionIndex === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-9 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                          isCurrent
                            ? 'ring-2 ring-[#3d6053] bg-white text-[#3d6053]'
                            : isAnswered
                            ? 'bg-[#3d6053] text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#3d6053]" />
                    <span>Sudah dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-white border border-slate-300" />
                    <span>Belum dijawab</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmitExam}
                  className="w-full mt-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Kumpulkan Sekarang
                </button>
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-slate-800">Ujian Telah Selesai!</h3>
              <p className="text-xs text-slate-500">
                Terima kasih telah mengikuti evaluasi pembelajaran dengan jujur dan tepat waktu.
              </p>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-400 uppercase font-semibold">Skor Akhir Kamu</span>
                <div className="text-5xl font-black text-[#3d6053] my-2">{finalScore} / 100</div>
                
                {serverAudit && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Terverifikasi Server Master Key (Anti-Cheat)</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono break-all">
                      Audit Hash: {serverAudit.serverAuditHash}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 mt-3">
                  {finalScore && finalScore >= 80
                    ? '🎉 Hebat sekali! Pemahaman konsepmu sangat matang.'
                    : '👍 Terus tingkatkan dan pelajari kembali materi pembahasannya.'}
                </p>
              </div>

              <button
                onClick={() => setActiveExam(null)}
                className="w-full py-2.5 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Daftar Ujian
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Exam List Screen */
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
                  <FileText className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-800">Ujian & Evaluasi Daring PJJ</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Penilaian Harian (PH), Kuis Kilat, dan Ujian Semester berbasis komputer & perangkat mobile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const previousResult = examResults.find(
                (r) => r.examId === exam.id && r.studentId === currentUser?.id
              );

              return (
                <div
                  key={exam.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                        {exam.subjectName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {exam.className}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-800 mb-2 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3d6053]" />
                        <span>{exam.durationMinutes} Menit</span>
                      </span>
                      <span>•</span>
                      <span>{exam.questionsCount} Butir Soal</span>
                    </div>

                    <div className="text-[11px] text-slate-400 pb-3 border-t border-slate-100">
                      Pembuat: {exam.createdBy}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {previousResult ? (
                      <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Skor: {previousResult.score}/100</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Belum dikerjakan</span>
                    )}

                    {previousResult && currentUser?.role === 'siswa' ? (
                      <span className="px-3.5 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sudah Dikumpulkan</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSubmitError(null);
                          handleStartExam(exam);
                        }}
                        className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{currentUser?.role !== 'siswa' ? 'Pratinjau Soal' : 'Mulai Ujian'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
