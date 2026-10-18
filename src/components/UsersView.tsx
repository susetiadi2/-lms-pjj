import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { User, UserRole } from '../types/lms';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Mail,
  Phone,
  LogIn,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, addUser, loginAs, currentUser } = useLms();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('siswa');
  const [className, setClassName] = useState('Kelas 5A');
  const [nisOrNip, setNisOrNip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('0812-');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nisOrNip.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;

    addUser({
      name,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      role,
      className: role === 'siswa' ? className : undefined,
      subjectSpecialty: role === 'guru' ? 'Guru Pengajar' : undefined,
      nisOrNip: nisOrNip || (role === 'siswa' ? 'NISN-00129381' : 'NIP-19800101'),
      email: email || `${username}@smartschool.sch.id`,
      phone,
      status: 'active',
    });

    setIsModalOpen(false);
    setName('');
    setUsername('');
    setNisOrNip('');
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'kepala_sekolah':
        return {
          label: 'Kepala Sekolah',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ShieldCheck,
        };
      case 'guru':
        return {
          label: 'Guru Pengajar',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: UserCheck,
        };
      case 'siswa':
        return {
          label: 'Siswa / Murid',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: GraduationCap,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Manajemen Akun Pengguna</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan akun terpadu untuk Kepala Sekolah, Dewan Guru, dan Siswa PJJ.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#3d6053] hover:bg-[#325045] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, NIP/NISN, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#3d6053]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-[#3d6053]"
        >
          <option value="all">Semua Peran Pengguna</option>
          <option value="kepala_sekolah">Kepala Sekolah</option>
          <option value="guru">Dewan Guru</option>
          <option value="siswa">Siswa</option>
        </select>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const roleInfo = getRoleBadge(user.role);
          const Icon = roleInfo.icon;
          const isMe = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isMe ? 'border-[#3d6053] ring-1 ring-[#3d6053]/30 shadow-xs' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${roleInfo.bg}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </span>

                  {isMe && (
                    <span className="text-[10px] font-bold text-[#3d6053] bg-[#eef5f1] px-2 py-0.5 rounded-md">
                      Akun Aktif Anda
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-800 mb-1">{user.name}</h3>
                <p className="text-xs text-slate-400 font-mono mb-3">@{user.username}</p>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ID / NIP:</span>
                    <span className="font-mono text-slate-700">{user.nisOrNip}</span>
                  </div>
                  {user.className && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Rombel:</span>
                      <span className="font-semibold text-slate-700">{user.className}</span>
                    </div>
                  )}
                  {user.subjectSpecialty && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bidang:</span>
                      <span className="font-semibold text-slate-700">{user.subjectSpecialty}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[140px]">{user.email}</span>

                {!isMe && (
                  <button
                    onClick={() => loginAs(user.role, user.id)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#eef5f1] text-slate-700 hover:text-[#3d6053] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer text-xs"
                    title="Beralih dan masuk menggunakan akun ini"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Alihkan Akun</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Akun Pengguna</h3>
            <p className="text-xs text-slate-500 mb-4">
              Buat akun baru untuk siswa, guru, atau staf pengajar.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rayhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="rayhan_5a"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Peran Akun</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">NISN / NIP</label>
                <input
                  type="text"
                  placeholder="NISN-0091827367"
                  value={nisOrNip}
                  onChange={(e) => setNisOrNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Sekolah</label>
                <input
                  type="email"
                  placeholder="rayhan@siswa.smartschool.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
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
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
