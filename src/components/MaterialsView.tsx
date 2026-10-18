import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { LearningMaterial } from '../types/lms';
import {
  BookOpen,
  Plus,
  Search,
  Video,
  FileText,
  Eye,
  Clock,
  User,
  ArrowRight,
  Download,
  Share2,
  CheckCircle,
} from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const { materials, addMaterial, incrementMaterialViews, subjects, currentUser } = useLms();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);

  // Create material modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [classLevel, setClassLevel] = useState('Kelas 5A');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'video' | 'pdf' | 'article'>('article');
  const [readTime, setReadTime] = useState('7 menit');

  const isTeacherOrPrincipal = currentUser?.role === 'guru' || currentUser?.role === 'kepala_sekolah';

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'all' || m.subjectId === selectedSubject;
    return matchSearch && matchSubject;
  });

  const handleOpenMaterial = (mat: LearningMaterial) => {
    incrementMaterialViews(mat.id);
    setActiveMaterial(mat);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const sub = subjects.find((s) => s.id === subjectId);
    addMaterial({
      title,
      subjectId,
      subjectName: sub ? sub.name : 'Tematik Terpadu',
      classLevel,
      authorId: currentUser?.id || 'guru-1',
      authorName: currentUser?.name || 'Ibu Rahmawati, S.Pd.',
      description,
      content,
      type,
      readTime,
      fileSize: '2.5 MB',
    });
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Materi Pembelajaran Daring (PJJ)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Modul terarah, video interaktif, dan rangkuman bacaan untuk mendukung belajar mandiri siswa di rumah.
          </p>
        </div>

        {isTeacherOrPrincipal && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi Baru</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari materi berdasarkan topik atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => {
          return (
            <div
              key={mat.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                    {mat.subjectName}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{mat.readTime}</span>
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-800 mb-2 leading-snug line-clamp-2">
                  {mat.title}
                </h3>

                <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{mat.viewsCount} dibaca</span>
                </span>

                <button
                  onClick={() => handleOpenMaterial(mat)}
                  className="px-3 py-1.5 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Buka Modul</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Interactive Material Reader */}
      {activeMaterial && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-[#eef5f1] text-[#3d6053] rounded-md">
                    {activeMaterial.subjectName}
                  </span>
                  <span className="text-xs text-slate-400">• {activeMaterial.classLevel}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {activeMaterial.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Oleh: {activeMaterial.authorName} • {activeMaterial.readTime} waktu baca
                </p>
              </div>

              <button
                onClick={() => setActiveMaterial(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Video or Graphic Placeholder if Video type */}
            {activeMaterial.type === 'video' && (
              <div className="my-4 bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-white">
                <div className="text-center p-6">
                  <Video className="w-12 h-12 text-[#e5a838] mx-auto mb-2" />
                  <p className="text-sm font-semibold">Video Pembelajaran PJJ Interaktif</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Durasi: 12 menit 30 detik • Format HD 1080p
                  </p>
                </div>
              </div>
            )}

            {/* Content body */}
            <div className="my-6 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-xl border border-slate-100 font-sans">
              {activeMaterial.content}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Materi telah tercatat dalam progress harianmu</span>
              </div>

              <button
                onClick={() => setActiveMaterial(null)}
                className="px-4 py-2 bg-[#3d6053] text-white font-semibold rounded-xl hover:bg-[#325045] cursor-pointer"
              >
                Selesai Membaca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Material */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Materi Pembelajaran</h3>
            <p className="text-xs text-slate-500 mb-4">
              Bagikan modul atau rangkuman materi baru untuk siswa.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Materi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengenalan Ekosistem dan Rantai Makanan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Materi</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="article">Artikel Bacaan</option>
                    <option value="video">Video Interaktif</option>
                    <option value="pdf">Modul Dokumen / PDF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ringkasan isi materi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Isi Lengkap Materi</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Ketik teks materi pembelajaran, panduan, atau catatan guru..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-sans"
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
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
