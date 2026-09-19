import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { logActivity } from '../services/logService';
import { getUserRecord, checkUsernameExists, createUserRecord } from '../services/userService';
import logoSidamon from '../assets/logo-sidamon.png';
import Icon from '../shared/components/Icon';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Menggantikan name
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (isLogin) {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                // Log activity
                const userData = await getUserRecord(userCredential.user.uid);
                if (userData) {
                    await logActivity('LOGIN', 'Autentikasi', 'Berhasil masuk ke sistem', userData);
                }
                // AuthContext akan otomatis mendeteksi auth state change
            } else {
                if (!username.trim()) throw new Error("Username harus diisi");
                if (password !== confirmPassword) throw new Error("Kata sandi dan konfirmasi tidak cocok");

                // Cek apakah username sudah ada
                const usernameTaken = await checkUsernameExists(username);
                if (usernameTaken) {
                    throw new Error("Username sudah digunakan oleh akun lain. Silakan pilih username yang berbeda.");
                }

                // Register
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);

                // Set default user data in database
                await createUserRecord(userCredential.user.uid, {
                    email: email,
                    username: username,
                    role: 'Guest', // Default role sebelum di-approve Admin
                    createdAt: new Date().toISOString()
                });
                
                setSuccessMsg("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Super Admin.");
                setIsLogin(true); // Kembali ke form login
            }
        } catch (err) {
            let errorMsg = err.message;
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMsg = 'Email atau kata sandi yang Anda masukkan salah. Silakan coba lagi.';
            } else if (err.code === 'auth/invalid-email') {
                errorMsg = 'Format email tidak valid.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMsg = 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke sistem.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMsg = 'Akses ditolak karena terlalu banyak percobaan masuk yang gagal. Silakan coba lagi nanti.';
            } else if (err.code === 'auth/weak-password') {
                errorMsg = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans text-slate-100 overflow-hidden relative">
            {/* Background Animations & Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#158ed4]/20 blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Left Side: Branding / Visuals (Hidden on small screens) */}
            <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col justify-between p-12 lg:p-20 border-r border-white/10 shadow-[20px_0_40px_rgba(0,0,0,0.3)] z-10">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                        alt="Modern Architecture" 
                        className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-[#158ed4]/40"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <img src={logoSidamon} alt="SIDAMON Logo" className="w-12 h-12 object-contain drop-shadow-md" />
                        <h1 className="text-3xl font-black tracking-tight text-white">SIDAMON<span className="text-[#158ed4]">.</span></h1>
                    </div>
                    
                    <h2 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
                        Enterprise <br /> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#158ed4] to-cyan-400">
                            Resource Planning
                        </span>
                    </h2>
                    <p className="text-lg text-slate-300 max-w-md leading-relaxed border-l-4 border-[#158ed4] pl-4">
                        Sistem Informasi Database & Monitoring Gaharu Sempana Group. Kelola proyek, inventaris, dan tenaga ahli dalam satu ekosistem cerdas.
                    </p>
                </div>


            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen md:min-h-0">
                <div className="w-full max-w-md">
                    {/* Mobile Branding (Visible only on small screens) */}
                    <div className="md:hidden text-center mb-10">
                        <img src={logoSidamon} alt="SIDAMON Logo" className="w-16 h-16 object-contain mx-auto drop-shadow-lg mb-6" />
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">SIDAMON<span className="text-[#158ed4]">.</span></h1>
                        <p className="text-sm text-slate-400">Gaharu Sempana Group</p>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        {/* Decorative top gradient line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#158ed4] via-cyan-500 to-blue-500"></div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
                            <p className="text-sm text-slate-400">
                                {isLogin ? 'Silahkan masukkan akun anda yang terdaftar untuk melanjutkan' : 'Daftarkan diri Anda untuk mengakses sistem.'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 fade-in">
                                <Icon name="alert-circle" size={18} className="text-red-400 shrink-0 mt-0.5" />
                                <span className="text-red-300 text-sm font-medium">{error}</span>
                            </div>
                        )}
                        
                        {successMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-[#158ed4]/10 border border-[#158ed4]/20 flex items-start gap-3 fade-in">
                                <Icon name="check-circle-2" size={18} className="text-[#158ed4] shrink-0 mt-0.5" />
                                <span className="text-[#158ed4] text-sm font-medium">{successMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#158ed4] transition-colors">
                                            <Icon name="user" size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#158ed4] focus:ring-1 focus:ring-[#158ed4] transition-all shadow-inner placeholder:text-slate-600"
                                            placeholder="username_unik"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#158ed4] transition-colors">
                                        <Icon name="mail" size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#158ed4] focus:ring-1 focus:ring-[#158ed4] transition-all shadow-inner placeholder:text-slate-600"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#158ed4] transition-colors">
                                        <Icon name="lock" size={18} />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#158ed4] focus:ring-1 focus:ring-[#158ed4] transition-all shadow-inner placeholder:text-slate-600"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
                                        <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Konfirmasi Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#158ed4] transition-colors">
                                            <Icon name="lock" size={18} />
                                        </div>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#158ed4] focus:ring-1 focus:ring-[#158ed4] transition-all shadow-inner placeholder:text-slate-600"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required={!isLogin}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
                                            <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full group relative overflow-hidden bg-[#158ed4] hover:bg-[#158ed4] text-white font-bold text-sm py-4 px-4 rounded-2xl transition-all shadow-lg shadow-[#158ed4]/40 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <><Icon name="loader-2" size={18} className="animate-spin" /> Memproses...</>
                                    ) : (
                                        isLogin ? 'Masuk ke Sistem' : 'Daftar Sekarang'
                                    )}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-700/50 pt-6">
                            <button 
                                type="button" 
                                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); setPassword(''); setConfirmPassword(''); }}
                                className="text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
                            >
                                {isLogin ? (
                                    <>Belum punya akun? <span className="text-[#158ed4] font-bold">Daftar sekarang</span></>
                                ) : (
                                    <>Sudah punya akun? <span className="text-[#158ed4] font-bold">Masuk di sini</span></>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center md:hidden">
                        <p className="text-xs text-slate-500">&copy; 2026 Gaharu Sempana Group. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
