import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import {
  User,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Mail,
  Phone,
  Laptop,
  Tablet,
  Smartphone,
  Monitor,
  Volume2,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { playReminderChime } from '../utils/audio';

export const ProfileView: React.FC = () => {
  const { currentUser, loginAs } = useLms();
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* User Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-[#3d6053] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {currentUser?.name.charAt(0) || 'U'}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-800">{currentUser?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {currentUser?.role.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-mono">
              Username: @{currentUser?.username} • ID: {currentUser?.nisOrNip}
            </p>

            {currentUser?.className && (
              <p className="text-xs text-[#3d6053] font-semibold mt-1">
                Rombongan Belajar: {currentUser.className}
              </p>
            )}
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">Email Institusi</span>
              <span className="font-semibold text-slate-700">{currentUser?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[11px] text-slate-400 block">Nomor WhatsApp / Kontak</span>
              <span className="font-semibold text-slate-700">{currentUser?.phone}</span>
            </div>
          </div>
        </div>

        {/* Device Compatibility Status (Multi-device: Laptop, Tab, HP, Chromebook) */}
        <div className="py-6 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Dukungan Perangkat Pembelajaran Jarak Jauh (PJJ)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Aplikasi Mr. DIVA dioptimalkan untuk berjalan lancar di segala jenis gawai:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
              <Laptop className="w-6 h-6 text-[#3d6053] mb-1.5" />
              <span className="font-bold text-xs text-slate-800">Laptop / PC</span>
              <span className="text-[10px] text-emerald-600 font-medium">Optimal 100%</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
              <Tablet className="w-6 h-6 text-[#3d6053] mb-1.5" />
              <span className="font-bold text-xs text-slate-800">Tablet / iPad</span>
              <span className="text-[10px] text-emerald-600 font-medium">Layar Sentuh Aktif</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
              <Smartphone className="w-6 h-6 text-[#3d6053] mb-1.5" />
              <span className="font-bold text-xs text-slate-800">HP (Android / iOS)</span>
              <span className="text-[10px] text-emerald-600 font-medium">Menu Drawer Rapi</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
              <Monitor className="w-6 h-6 text-[#3d6053] mb-1.5" />
              <span className="font-bold text-xs text-slate-800">Chromebook</span>
              <span className="text-[10px] text-emerald-600 font-medium">Kinerja Ringan</span>
            </div>
          </div>
        </div>

        {/* Smart Reminder Preferences */}
        <div className="pt-6">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Pengaturan Pengingat Pintar</h3>
          <p className="text-xs text-slate-500 mb-4">
            Sesuaikan perilaku bunyi lonceng dan peringatan tugas harian di perangkat ini.
          </p>

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-[#3d6053]" />
                <div>
                  <span className="font-bold text-slate-800 block">Nada Lonceng Pengingat</span>
                  <span className="text-[11px] text-slate-500">
                    Memainkan nada harpa marimba yang nyaman saat mendekati batas pengumpulan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playReminderChime('gentle')}
                  className="px-2.5 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Dengarkan
                </button>
                <input
                  type="checkbox"
                  checked={notificationSoundEnabled}
                  onChange={(e) => setNotificationSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3d6053]"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pengaturan berhasil disimpan di perangkat ini.</span>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
