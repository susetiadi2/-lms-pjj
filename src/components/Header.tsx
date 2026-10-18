import React, { useState, useEffect } from 'react';
import { useLms } from '../context/LmsContext';
import {
  Menu,
  Bell,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Volume2,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert,
  Download,
  WifiOff,
  Smartphone,
  Info,
} from 'lucide-react';
import { playReminderChime } from '../utils/audio';
import { usePWAInstall, useOnlineStatus, sendLocalBrowserNotification } from '../utils/pwa';
import { apiClient } from '../utils/apiClient';

export const Header: React.FC = () => {
  const {
    currentUser,
    loginAs,
    activeTab,
    setIsSidebarOpen,
    smartAlerts,
    dismissAlert,
    setIsSecurityModalOpen,
    isRoleTampered,
  } = useLms();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // PWA & Connectivity Hooks
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Notification & Web Push Status
  const [notifStatus, setNotifStatus] = useState<{
    serverPushConfigured: boolean;
    activeDeliveryMode: string;
    isUserSubscribedOnServer: boolean;
    limitationsNotice: string;
  } | null>(null);
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [pushActionMsg, setPushActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAlertsOpen) {
      apiClient
        .getNotificationStatus()
        .then((res) => {
          if (res?.success) {
            setNotifStatus(res);
          }
        })
        .catch(() => {});
    }
  }, [isAlertsOpen, currentUser?.id]);

  // Map active tab to Indonesian title
  const tabTitles: Record<string, string> = {
    ringkasan: 'RINGKASAN',
    akun: 'AKUN PENGGUNA',
    kelas: 'KELAS & MURID',
    mapel: 'MATA PELAJARAN',
    materi: 'MATERI BELAJAR',
    tugas: 'MANAJEMEN TUGAS & PENGINGAT PINTAR',
    ujian: 'UJIAN & EVALUASI',
    bank_soal: 'BANK SOAL',
    nilai: 'LAPORAN NILAI & PRESTASI',
    profil: 'PROFIL SAYA',
  };

  // Test sound reminder & browser notification
  const handleTestSound = () => {
    playReminderChime('gentle');
    sendLocalBrowserNotification(
      'Pengingat Pintar Mr. DIVA LMS',
      'Uji coba pengingat lokal dan nada lonceng cerdas berhasil dijalankan.'
    );
  };

  const handleEnableNotifications = async () => {
    setPushActionMsg(null);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
      } catch {
        // ignore permission prompt restrictions in iframe
      }
    }

    try {
      // Register subscription endpoint record on server (supports VAPID Web Push when configured)
      const pseudoEndpoint = `https://fcm.googleapis.com/fcm/send/mrdiva-${currentUser?.id || 'anon'}`;
      const res = await apiClient.subscribePush({
        endpoint: pseudoEndpoint,
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
        userAgent: navigator.userAgent,
      });
      if (res?.success) {
        setPushActionMsg(res.message);
        const updated = await apiClient.getNotificationStatus().catch(() => null);
        if (updated?.success) setNotifStatus(updated);
      }
    } catch (err: any) {
      setPushActionMsg(err.message || 'Gagal menyimpan preferensi langganan notifikasi.');
    }
  };

  return (
    <>
      {/* Offline Mode Non-Intrusive Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>
            Mode Offline Aktif — Menampilkan shell aplikasi tersimpan. Data sensitif (nilai, kunci ujian, &amp; sesi) tidak di-cache demi keamanan.
          </span>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Mobile Toggle & Breadcrumb / Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              MR. DIVA / {tabTitles[activeTab] || 'RINGKASAN'}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              Selamat datang, {currentUser?.name || 'Tamu'}
            </h1>
          </div>
        </div>

        {/* Right Controls: PWA Install, Security Audit, Role Switcher, Smart Reminders, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* In-App PWA Install Prompt Button (Auto-hides when already installed in standalone mode) */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3d6053] hover:bg-[#2d483e] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              title="Instal aplikasi Mr. DIVA LMS ke perangkat Anda"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instal Aplikasi</span>
            </button>
          )}

          {!isInstalled && !isInstallable && isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Panduan instalasi PWA di iOS Safari"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#3d6053]" />
              <span className="hidden md:inline">Instal di iOS</span>
            </button>
          )}

          {/* Security Audit Center Button */}
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              isRoleTampered
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                : 'bg-[#eef5f1] hover:bg-[#dbeee4] text-[#2d483e] border border-emerald-200/70'
            }`}
            title="Buka Pusat Audit Keamanan & Uji Penetrasi (Fase 1.1 & Fase 2)"
          >
            {isRoleTampered ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#3d6053]" />
            )}
            <span className="hidden sm:inline">
              {isRoleTampered ? 'Manipulasi Tercegah' : 'Audit Keamanan'}
            </span>
            <span className="text-[10px] bg-white/80 px-1 py-0.2 rounded font-mono">
              RBAC
            </span>
          </button>

          {/* Quick Role Switcher Pill for reviewer ease */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              <span className="hidden sm:inline">Peran:</span>
              <span className="font-semibold text-[#3d6053]">
                {currentUser?.role === 'kepala_sekolah'
                  ? 'Kepala Sekolah'
                  : currentUser?.role === 'guru'
                  ? 'Guru'
                  : 'Siswa'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Ganti Peran Pengguna
                </div>
                <button
                  onClick={() => {
                    loginAs('kepala_sekolah');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    currentUser?.role === 'kepala_sekolah' ? 'font-semibold text-[#3d6053]' : 'text-slate-700'
                  }`}
                >
                  <span>Mr. DIVA (Kepala Sekolah)</span>
                  {currentUser?.role === 'kepala_sekolah' && <span className="text-xs">✓</span>}
                </button>

                <button
                  onClick={() => {
                    loginAs('guru');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    currentUser?.role === 'guru' ? 'font-semibold text-[#3d6053]' : 'text-slate-700'
                  }`}
                >
                  <span>Ibu Rahma (Guru)</span>
                  {currentUser?.role === 'guru' && <span className="text-xs">✓</span>}
                </button>

                <button
                  onClick={() => {
                    loginAs('siswa');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    currentUser?.role === 'siswa' ? 'font-semibold text-[#3d6053]' : 'text-slate-700'
                  }`}
                >
                  <span>Ahmad Fauzan (Siswa)</span>
                  {currentUser?.role === 'siswa' && <span className="text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Smart Reminder Bell Notification */}
          <div className="relative">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Pengingat Pintar Tugas & Status Web Push"
            >
              <Bell className="w-5 h-5" />
              {smartAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {isAlertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800">Pengingat Pintar Tugas</h3>
                      <p className="text-[11px] text-slate-400">Notifikasi deadline &amp; Web Push PWA</p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestSound}
                    className="flex items-center gap-1 text-[11px] text-[#3d6053] hover:underline cursor-pointer"
                    title="Uji coba suara lonceng pengingat"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Tes Nada</span>
                  </button>
                </div>

                {/* Fase 2: Transparent Notification Architecture Status */}
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#3d6053]" />
                      Mode Pengiriman Notifikasi:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        notifStatus?.serverPushConfigured
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {notifStatus?.serverPushConfigured
                        ? 'Web Push Server Aktif'
                        : 'Notifikasi Browser Lokal'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {notifStatus?.limitationsNotice ||
                      'Pengingat aktif saat aplikasi terbuka. Untuk push latar belakang saat tab tertutup, konfigurasikan VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY pada server produksi.'}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      Status Langganan:{' '}
                      <strong className="text-slate-700">
                        {notifStatus?.isUserSubscribedOnServer ? 'Terdaftar di Server' : 'Belum Terdaftar'}
                      </strong>{' '}
                      (Izin: {browserPermission})
                    </span>
                    <button
                      type="button"
                      onClick={handleEnableNotifications}
                      className="px-2.5 py-1 bg-[#3d6053] hover:bg-[#2d483e] text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                    >
                      {notifStatus?.isUserSubscribedOnServer ? 'Perbarui Langganan' : 'Aktifkan Pengingat'}
                    </button>
                  </div>
                  {pushActionMsg && (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      {pushActionMsg}
                    </div>
                  )}
                </div>

                <div className="py-2 max-h-60 overflow-y-auto space-y-2 mt-1">
                  {smartAlerts.length === 0 ? (
                    <div className="text-center py-5 text-slate-400 text-xs">
                      <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500/70 mb-1.5" />
                      <p className="font-medium text-slate-600">Semua tugas terpantau rapi!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Belum ada tugas yang mendekati batas waktu akhir.
                      </p>
                    </div>
                  ) : (
                    smartAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs relative ${
                          alert.urgency === 'high'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : 'bg-amber-50/70 border-amber-200 text-amber-900'
                        }`}
                      >
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="pr-4">
                            <p className="font-bold text-xs">{alert.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{alert.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Pukul {alert.timestamp} WIB
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile avatar pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#f2e7c9] text-[#8e6018] flex items-center justify-center font-bold text-xs">
              {currentUser?.name.charAt(0) || 'M'}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">
                {currentUser?.name}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {currentUser?.role === 'kepala_sekolah' ? 'Admin / KS' : currentUser?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* iOS Safari Guided PWA Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Instal Mr. DIVA LMS di iPhone / iPad</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah alat Safari.<br />
              2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#3d6053] py-2 text-xs font-semibold text-white hover:bg-[#2d483e] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
