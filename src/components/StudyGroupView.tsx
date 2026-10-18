import React, { useState, useRef, useEffect } from 'react';
import { useLms } from '../context/LmsContext';
import { StudyGroup, StudyGroupMember } from '../types/lms';
import {
  Users,
  MessageSquare,
  CheckSquare,
  Plus,
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
  Clock,
  Pin,
  CheckCircle2,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyGroupViewProps {
  initialGroupId?: string;
  onOpenTaskDetails?: (taskId: string) => void;
}

export const StudyGroupView: React.FC<StudyGroupViewProps> = ({ initialGroupId, onOpenTaskDetails }) => {
  const {
    studyGroups,
    currentUser,
    tasks,
    users,
    sendStudyGroupMessage,
    toggleStudyGroupChecklist,
    addStudyGroupChecklistItem,
    createStudyGroup,
  } = useLms();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || studyGroups[0]?.id || ''
  );
  const [messageInput, setMessageInput] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistAssignee, setNewChecklistAssignee] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTaskId, setNewGroupTaskId] = useState(tasks[0]?.id || '');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    currentUser?.id || 'user-siswa-1',
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeGroup = studyGroups.find((g) => g.id === selectedGroupId) || studyGroups[0];
  const studentsList = users.filter((u) => u.role === 'siswa');
  const teachersList = users.filter((u) => u.role === 'guru');

  // Auto scroll chat to bottom when active group or messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeGroup?.messages.length, selectedGroupId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeGroup) return;
    sendStudyGroupMessage(activeGroup.id, messageInput);
    setMessageInput('');
  };

  const handleQuickReaction = (reactionText: string) => {
    if (!activeGroup) return;
    sendStudyGroupMessage(activeGroup.id, reactionText);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !activeGroup) return;
    addStudyGroupChecklistItem(activeGroup.id, newChecklistTitle, newChecklistAssignee);
    setNewChecklistTitle('');
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const matchedTask = tasks.find((t) => t.id === newGroupTaskId);
    const members: StudyGroupMember[] = selectedMemberIds.map((id, idx) => {
      const u = users.find((user) => user.id === id);
      return {
        userId: id,
        name: u?.name || 'Siswa',
        role: u?.role || 'siswa',
        isLeader: idx === 0,
      };
    });

    // Automatically add teacher if not already added
    if (teachersList.length > 0 && !members.some((m) => m.role === 'guru')) {
      members.push({
        userId: teachersList[0].id,
        name: teachersList[0].name,
        role: 'guru',
      });
    }

    createStudyGroup({
      name: newGroupName,
      taskId: newGroupTaskId,
      taskTitle: matchedTask?.title || 'Tugas Proyek Kolaborasi',
      subjectName: matchedTask?.subjectName || 'Tematik Terpadu',
      description: newGroupDescription || 'Kelompok belajar kolaboratif siswa untuk menyelesaikan tugas proyek PJJ.',
      members,
      pinnedNote: '📌 Tips: Saling koordinasikan pembagian tugas secara adil dan kumpulkan tepat waktu!',
    });

    setIsCreateModalOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  // Progress percentage of group checklist
  const totalChecklist = activeGroup?.checklist.length || 0;
  const completedChecklist = activeGroup?.checklist.filter((c) => c.isCompleted).length || 0;
  const progressPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner & Group Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Ruang Belajar Kelompok (Virtual Study Group)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kolaborasi tugas proyek antar siswa, pembagian sub-tugas, dan konsultasi interaktif dengan guru pembimbing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kelompok Baru</span>
        </button>
      </div>

      {/* Main Study Group Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Group Channels List (3.5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Kelompok Aktif ({studyGroups.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pt-1">
              {studyGroups.map((group) => {
                const isSelected = group.id === selectedGroupId;
                const completedItems = group.checklist.filter((c) => c.isCompleted).length;
                const totalItems = group.checklist.length;

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#eef5f1] border-[#3d6053] text-[#244237] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#3d6053]">
                        {group.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {group.members.length} Anggota
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">
                      {group.name}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      Tugas: {group.taskTitle}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Progres Tugas:</span>
                      <span className="font-bold text-[#3d6053]">
                        {completedItems}/{totalItems} Selesai
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Group Discussion & Task Collaboration (8.5 cols) */}
        {activeGroup ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Active Group Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#eef5f1] text-[#3d6053]">
                      {activeGroup.subjectName}
                    </span>
                    <span className="text-xs text-slate-400">• Proyek Kolaborasi PJJ</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{activeGroup.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tugas Induk: <span className="font-semibold text-slate-700">{activeGroup.taskTitle}</span>
                  </p>
                </div>

                {/* Member avatars */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {activeGroup.members.map((m) => (
                      <div
                        key={m.userId}
                        title={`${m.name} (${m.role}${m.isLeader ? ' - Ketua' : ''})`}
                        className={`inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          m.role === 'guru'
                            ? 'bg-amber-600'
                            : m.isLeader
                            ? 'bg-[#3d6053]'
                            : 'bg-blue-600'
                        }`}
                      >
                        {m.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeGroup.members.length} Kolaborator
                  </span>
                </div>
              </div>

              {/* Pinned Teacher Note Banner */}
              {activeGroup.pinnedNote && (
                <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-start gap-2">
                  <Pin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-amber-900 font-medium">{activeGroup.pinnedNote}</span>
                </div>
              )}
            </div>

            {/* Split Workspace: Collaborative Checklist & Group Chat */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Subsection: Pembagian Sub-Tugas Kelompok (5 cols) */}
              <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#3d6053]" />
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Pembagian Sub-Tugas
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-[#3d6053] bg-[#eef5f1] px-2 py-0.5 rounded-md">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="bg-[#3d6053] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Checklist items list */}
                  <div className="space-y-2.5 mt-4 max-h-60 overflow-y-auto pr-1">
                    {activeGroup.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleStudyGroupChecklist(activeGroup.id, item.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          item.isCompleted
                            ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-0.5 rounded text-[#3d6053] focus:ring-[#3d6053] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-snug">{item.title}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            PIC: {item.assignedToName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Sub-task form */}
                <form onSubmit={handleAddChecklistItem} className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Tambah Rincian Tugas:
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Judul sub-tugas..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Penanggung Jawab (Nama Siswa)"
                      value={newChecklistAssignee}
                      onChange={(e) => setNewChecklistAssignee(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Tambah
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Subsection: Live Group Chat & Discussion (7 cols) */}
              <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#3d6053]" />
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Obrolan & Diskusi Proyek
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Diskusi</span>
                  </span>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-2 space-y-3.5 text-xs my-2">
                  {activeGroup.messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isTeacher = msg.senderRole === 'guru' || msg.senderRole === 'kepala_sekolah';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="font-bold text-[11px] text-slate-700">
                            {msg.senderName}
                          </span>
                          {isTeacher && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Guru Pembimbing
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            isMe
                              ? 'bg-[#3d6053] text-white rounded-tr-none'
                              : isTeacher
                              ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.messageText}</p>
                          {msg.attachmentName && (
                            <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1 text-[11px]">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{msg.attachmentName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Reaction Pills */}
                <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-[11px] border-t border-slate-100">
                  <button
                    onClick={() => handleQuickReaction('👍 Siap, aku kerjakan bagianku sekarang!')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 cursor-pointer"
                  >
                    👍 Siap kerjakan
                  </button>
                  <button
                    onClick={() => handleQuickReaction('💡 Ada ide tambahan untuk materi ini!')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 cursor-pointer"
                  >
                    💡 Usul ide
                  </button>
                  <button
                    onClick={() => handleQuickReaction('❓ Bu/Pak Guru, mohon petunjuk untuk bagian ini.')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 cursor-pointer"
                  >
                    ❓ Tanya guru
                  </button>
                  <button
                    onClick={() => handleQuickReaction('✅ Tugas bagianku sudah selesai dibuat.')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 cursor-pointer"
                  >
                    ✅ Selesai
                  </button>
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tulis pesan diskusi kelompok..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3d6053]"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#3d6053] hover:bg-[#325045] text-white rounded-xl cursor-pointer transition-colors"
                    title="Kirim pesan"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Pilih atau Buat Kelompok Belajar</p>
            <p className="text-xs text-slate-400 mt-1">
              Silakan pilih salah satu kelompok di samping kiri untuk mulai berkolaborasi.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Create New Study Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Bentuk Kelompok Belajar Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih tugas proyek PJJ dan tentukan anggota kelompok siswa untuk berkolaborasi.
            </p>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelompok 3 - Analisis Teks Cerita"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tugas yang Dikerjakan</label>
                <select
                  value={newGroupTaskId}
                  onChange={(e) => setNewGroupTaskId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subjectName} - {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Proyek</label>
                <textarea
                  rows={2}
                  placeholder="Tujuan pengerjaan kelompok..."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Pilih Anggota Siswa (Centang)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 p-2 rounded-xl bg-slate-50">
                  {studentsList.map((st) => {
                    const isChecked = selectedMemberIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds((prev) => [...prev, st.id]);
                            } else {
                              setSelectedMemberIds((prev) => prev.filter((id) => id !== st.id));
                            }
                          }}
                          className="rounded text-[#3d6053]"
                        />
                        <span className="font-medium text-slate-700">{st.name}</span>
                        <span className="text-[10px] text-slate-400">({st.className})</span>
                      </label>
                    );
                  })}
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
                  Bentuk Kelompok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
