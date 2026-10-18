import React from 'react';
import { useLms, ActiveTab } from '../context/LmsContext';
import {
  LayoutGrid,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  BarChart3,
  User,
  LogOut,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    logout,
    currentUser,
    tasks,
    submissions,
  } = useLms();

  // Calculate pending tasks for student badge
  const pendingTasksCount = currentUser?.role === 'siswa'
    ? tasks.filter(t => !submissions.some(s => s.taskId === t.id && s.studentId === currentUser.id)).length
    : tasks.length;

  const menuItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'ringkasan', label: 'Ringkasan', icon: LayoutGrid },
    { id: 'akun', label: 'Akun pengguna', icon: Users },
    { id: 'kelas', label: 'Kelas & murid', icon: GraduationCap },
    { id: 'mapel', label: 'Mata pelajaran', icon: Layers },
    { id: 'materi', label: 'Materi belajar', icon: BookOpen },
    { id: 'tugas', label: 'Tugas', icon: ClipboardList, count: pendingTasksCount },
    { id: 'ujian', label: 'Ujian', icon: FileText },
    { id: 'bank_soal', label: 'Bank soal', icon: HelpCircle },
    { id: 'nilai', label: 'Laporan nilai', icon: BarChart3 },
    { id: 'profil', label: 'Profil saya', icon: User },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Logo */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#e5a838] flex items-center justify-center font-bold text-slate-900 text-lg shadow-xs">
                D
              </div>
              <div className="leading-tight">
                <span className="font-bold text-slate-800 text-[15px] block tracking-tight">
                  Mr. DIVA
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  SMART SCHOOL
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#eef5f1] text-[#3d6053] font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-[19px] h-[19px] transition-colors ${
                        isActive ? 'text-[#3d6053]' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'tugas' && item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: User Status & Logout */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3d6053] text-white flex items-center justify-center font-bold text-xs uppercase">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">
                {currentUser?.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-[19px] h-[19px]" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};
