import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { ArrowRight, ShieldCheck, GraduationCap, UserCheck, KeyRound, User } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { loginAs, loginWithCredentials } = useLms();
  const [username, setUsername] = useState('087695_diva');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const result = await loginWithCredentials(username.trim(), password);
      if (!result.success) {
        setErrorMsg(result.error || 'Username atau kata sandi tidak sesuai.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#fafcfb] text-slate-800 font-sans selection:bg-[#3d6053]/20">
      {/* Left Hero Panel (matching screenshot 1) */}
      <div className="md:w-1/2 bg-[#3d6053] text-white p-8 md:p-16 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative curved background lines */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute right-10 bottom-10 w-64 h-64 rounded-full border border-white/5 pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5a838] flex items-center justify-center font-bold text-slate-900 text-xl shadow-sm">
            D
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-[#f5cf7b] font-semibold block">
              MR. DIVA SMART LEARNING SCHOOL
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="my-12 md:my-auto relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-5xl lg:text-[44px] font-bold tracking-tight text-white leading-[1.18] mb-5">
            Belajar terasa lebih mudah setiap hari.
          </h1>
          <p className="text-white/80 text-base md:text-lg font-normal leading-relaxed max-w-md">
            Ruang belajar digital yang hangat untuk guru dan murid sekolah dasar dalam Pembelajaran Jarak Jauh (PJJ).
          </p>

          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/90">
            <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/15">
              ✨ Multi-Platform: Laptop, Tab, HP, Chromebook
            </span>
            <span className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/15">
              ⏰ Pengingat Pintar Tugas
            </span>
          </div>
        </div>

        {/* Bottom Feature Numbers */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center gap-6 md:gap-10 text-xs text-white/80">
          <div>
            <span className="font-bold text-[#f5cf7b] mr-1.5 text-sm">01</span> Ruang kelas
          </div>
          <div>
            <span className="font-bold text-[#f5cf7b] mr-1.5 text-sm">02</span> Materi terarah
          </div>
          <div>
            <span className="font-bold text-[#f5cf7b] mr-1.5 text-sm">03</span> Nilai jelas
          </div>
        </div>
      </div>

      {/* Right Login Form (matching screenshot 1) */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Logo & Welcome Header */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#e5a838] flex items-center justify-center font-bold text-slate-900 text-base">
              D
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg">Mr. DIVA</span>
          </div>

          <div className="mb-6">
            <span className="text-xs font-semibold text-[#d48817] uppercase tracking-wider block mb-1">
              Selamat datang kembali
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Masuk ke ruang belajar
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Gunakan username dan kata sandi dari admin sekolah.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="087695_diva"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d6053] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Kata sandi</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d6053] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-[#3d6053] hover:bg-[#325045] text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Masuk ke dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3 text-center">
              Atau coba langsung dengan akun peran demo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loginAs('kepala_sekolah')}
                className="p-2.5 bg-[#f5f8f6] hover:bg-[#e7f0ec] border border-[#d2e2db] rounded-lg text-left transition-all text-xs flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[#3d6053] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Kepala Sekolah</span>
                </div>
                <span className="text-[11px] text-slate-600 truncate">Mr. DIVA, M.Pd.</span>
              </button>

              <button
                type="button"
                onClick={() => loginAs('guru')}
                className="p-2.5 bg-[#fbf8f2] hover:bg-[#f6ebd7] border border-[#eedcbd] rounded-lg text-left transition-all text-xs flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[#b4710b] font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Guru Kelas</span>
                </div>
                <span className="text-[11px] text-slate-600 truncate">Ibu Rahmawati</span>
              </button>

              <button
                type="button"
                onClick={() => loginAs('siswa')}
                className="p-2.5 bg-[#f3f7fd] hover:bg-[#e5effb] border border-[#cfe1f9] rounded-lg text-left transition-all text-xs flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[#2563eb] font-bold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Akun Siswa</span>
                </div>
                <span className="text-[11px] text-slate-600 truncate">Ahmad Fauzan</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 mt-6">
            Belum punya akun? Hubungi admin sekolah untuk dibuatkan akun.
          </p>
        </div>
      </div>
    </div>
  );
};
