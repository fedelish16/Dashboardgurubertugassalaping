import React, { useState } from 'react';
import { UserProfile, TetapanSekolah, Peranan, Sidang } from '../types';
import { SmkSalapingLogo } from './SmkSalapingLogo';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Briefcase,
  User,
  Sun,
  Moon,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  users: UserProfile[];
  tetapan: TetapanSekolah;
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterUser: (newUser: UserProfile) => void;
  onToast: (msg: string) => void;
  isMandatory?: boolean; // If user is logged out, user must login
}

const COMMON_JAWATAN_LIST = [
  'Ketua Guru Bertugas',
  'Penolong Ketua Guru Bertugas',
  'Guru Bertugas Mingguan',
  'Guru Akademik Biasa',
  'Guru Kelas / Tingkatan',
  'Guru Disiplin / Pengawas',
  'Guru Kaunseling / B&K',
  'Guru Bimbingan',
  'Guru Media & Perpustakaan',
  'Guru Kokurikulum',
  'Guru Data & Maklumat',
  'Guru Penyelaras ICT',
  'Ketua Bidang Bahasa',
  'Ketua Bidang Sains & Matematik',
  'Ketua Bidang Kemanusiaan',
  'Ketua Bidang Teknik & Vokasional',
  'Penolong Kanan Pentadbiran (PK 1)',
  'Penolong Kanan Hal Ehwal Murid (PK HEM)',
  'Penolong Kanan Kokurikulum (PK Koko)',
  'Penolong Kanan Petang',
  'Pengetua'
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  tetapan,
  onLoginSuccess,
  onRegisterUser,
  onToast,
  isMandatory = false
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup Form States
  const [signupNama, setSignupNama] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPeranan, setSignupPeranan] = useState<Peranan>('guru');
  const [signupJawatan, setSignupJawatan] = useState('Guru Bertugas Mingguan');
  const [signupCustomJawatan, setSignupCustomJawatan] = useState('');
  const [signupSidang, setSignupSidang] = useState<Sidang>('pagi');
  const [signupGred, setSignupGred] = useState('DG41');
  const [signupTelefon, setSignupTelefon] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation Helpers
  const isValidDelimaEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    // DELIMa format: e.g. g-12345678@moe-dl.edu.my, or @moe.edu.my, or standard valid teacher format
    return (
      trimmed.endsWith('@moe-dl.edu.my') ||
      trimmed.endsWith('@moe.edu.my') ||
      trimmed.endsWith('@moe.gov.my') ||
      trimmed.includes('@')
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setLoginError('Sila masukkan Emel DELIMa anda.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Sila masukkan kata laluan.');
      return;
    }

    // Find user by email or ID match
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === emailTrimmed ||
        u.email.toLowerCase().replace(/@.+/, '') === emailTrimmed
    );

    if (!foundUser) {
      setLoginError(
        'Akaun emel tidak ditemui dalam sistem. Sila semak emel atau daftar akaun baharu di tab Daftar Masuk.'
      );
      return;
    }

    // Check password if set, or accept default
    if (foundUser.kata_laluan && foundUser.kata_laluan !== loginPassword) {
      setLoginError('Kata laluan tidak tepat. Sila cuba lagi.');
      return;
    }

    onLoginSuccess(foundUser);
    onToast(`Selamat kembali, ${foundUser.nama}! Anda telah berjaya log masuk.`);
    if (onClose) onClose();
  };

  const handleQuickDemoLogin = (user: UserProfile) => {
    onLoginSuccess(user);
    onToast(`Berjaya log masuk pantas sebagai ${user.nama} (${user.jawatan})`);
    if (onClose) onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const namaTrimmed = signupNama.trim();
    const emailTrimmed = signupEmail.trim().toLowerCase();
    const finalJawatan =
      signupJawatan === 'Lain-lain' ? signupCustomJawatan.trim() : signupJawatan.trim();

    if (!namaTrimmed) {
      setSignupError('Sila masukkan Nama Penuh Guru.');
      return;
    }

    if (!emailTrimmed) {
      setSignupError('Sila masukkan Emel Rasmi DELIMa.');
      return;
    }

    // Validate email
    if (!isValidDelimaEmail(emailTrimmed)) {
      setSignupError(
        'Format emel tidak sah. Digalakkan menggunakan emel rasmi DELIMa KPM (@moe-dl.edu.my).'
      );
      return;
    }

    // Check duplicate email
    const duplicate = users.some((u) => u.email.toLowerCase() === emailTrimmed);
    if (duplicate) {
      setSignupError('Emel DELIMa ini telah didaftarkan dalam sistem. Sila log masuk.');
      return;
    }

    if (!finalJawatan) {
      setSignupError('Sila pilih atau nyatakan jawatan guru / pentadbir.');
      return;
    }

    if (signupPassword.length < 4) {
      setSignupError('Kata laluan mestilah sekurang-kurangnya 4 aksara.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Pengesahan kata laluan tidak sepadan.');
      return;
    }

    // Create new user profile
    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nama: namaTrimmed,
      email: emailTrimmed,
      peranan: signupPeranan,
      jawatan: finalJawatan,
      sidang: signupSidang,
      gred: signupGred || 'DG41',
      telefon: signupTelefon.trim() || undefined,
      kata_laluan: signupPassword
    };

    onRegisterUser(newUser);
    onLoginSuccess(newUser);
    onToast(`Pendaftaran akaun DELIMa berjaya! Selamat bertugas, ${newUser.nama}.`);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs p-1.5 border border-white/20 shadow-md shrink-0 flex items-center justify-center">
              <SmkSalapingLogo className="w-full h-full" logoUrl={tetapan.logo_url} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-1">
                <Sparkles className="w-3 h-3" /> Akses Portal Guru DELIMa
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {tetapan.sekolah}
              </h2>
              <p className="text-xs text-emerald-100/90 line-clamp-1">
                Sistem Pengurusan Guru Bertugas & Pemantauan Sekolah KPM
              </p>
            </div>
          </div>

          {/* Close button if optional */}
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              ✕
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-emerald-950/40 p-1 rounded-xl mt-5 border border-emerald-700/40">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Log Masuk Guru</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setSignupError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akaun DELIMa</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {mode === 'login' ? (
            /* ================= LOGIN MODE ================= */
            <div className="space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{loginError}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Emel Rasmi DELIMa (KPM)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="contoh: g-12345678@moe-dl.edu.my"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-emerald-600" />
                    Gunakan ID DELIMa atau emel rasmi sekolah yang telah didaftarkan.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Kata Laluan
                    </label>
                    <span className="text-[11px] text-stone-400">
                      (Kata laluan lalai: delima123 / admin123)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata laluan"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                      aria-label="Tunjuk kata laluan"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Login Section for Convenience */}
              <div className="pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Akses Pantas Akaun Contoh:
                  </span>
                  <span className="text-[11px] text-stone-400">Pilih satu untuk log masuk terus</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.slice(0, 4).map((u) => {
                    const isAdmin = u.peranan === 'pentadbir';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickDemoLogin(u)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all hover:scale-[1.01] flex items-center gap-2.5 cursor-pointer ${
                          isAdmin
                            ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 text-amber-900'
                            : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70 text-emerald-900'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {isAdmin ? 'P' : 'G'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-stone-900">{u.nama}</p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {u.jawatan} • {u.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= SIGNUP MODE ================= */
            <div className="space-y-4">
              {signupError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{signupError}</div>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-3.5">
                {/* Nama Penuh */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Nama Penuh Guru / Pentadbir <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="contoh: Cikgu Norazlina binti Ahmad"
                      value={signupNama}
                      onChange={(e) => setSignupNama(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Email DELIMA */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Emel Rasmi DELIMa (KPM) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="g-12345678@moe-dl.edu.my"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Sila gunakan akaun DELIMa KPM (@moe-dl.edu.my) untuk pengesahan identiti guru.
                  </p>
                </div>

                {/* Peranan & Sidang Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Peranan Akses <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={signupPeranan}
                      onChange={(e) => setSignupPeranan(e.target.value as Peranan)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    >
                      <option value="guru">Guru (Isi & Hantar Laporan)</option>
                      <option value="pentadbir">Pentadbir (Pengesah & Semakan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Sidang Persekolahan
                    </label>
                    <select
                      value={signupSidang}
                      onChange={(e) => setSignupSidang(e.target.value as Sidang)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    >
                      <option value="pagi">Sidang Pagi</option>
                      <option value="petang">Sidang Petang</option>
                      <option value="kedua">Kedua-dua Sidang</option>
                    </select>
                  </div>
                </div>

                {/* Jawatan */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Jawatan Guru / Tanggungjawab Rasmi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={signupJawatan}
                      onChange={(e) => setSignupJawatan(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    >
                      {COMMON_JAWATAN_LIST.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                      <option value="Lain-lain">Lain-lain (Nyatakan sendiri...)</option>
                    </select>
                  </div>
                  {signupJawatan === 'Lain-lain' && (
                    <input
                      type="text"
                      required
                      placeholder="Masukkan jawatan anda"
                      value={signupCustomJawatan}
                      onChange={(e) => setSignupCustomJawatan(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  )}
                </div>

                {/* Gred & No Telefon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Gred Jawatan
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: DG41, DG44, DG48"
                      value={signupGred}
                      onChange={(e) => setSignupGred(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      No. Telefon (Pilihan)
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: 013-8889900"
                      value={signupTelefon}
                      onChange={(e) => setSignupTelefon(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Kata Laluan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 aksara"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Sahkan Kata Laluan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ulang kata laluan"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akaun & Masuk ke Sistem</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-3.5 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Integrasi Pengesahan Guru DELIMa KPM
          </span>
          <span className="text-stone-400">SMK Salaping Kota Marudu</span>
        </div>
      </div>
    </div>
  );
};
