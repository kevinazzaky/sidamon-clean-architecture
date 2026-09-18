import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { useAuth } from '../../auth/useAuth';
import Icon from '../../shared/components/Icon';
import BottomNavItem from '../../shared/components/BottomNavItem';
import MobileMenuItem from '../../shared/components/MobileMenuItem';
import { auth } from '../../services/firebase';
import { logActivity } from '../../services/logService';

export default function MobileBottomNav({ mobileMenuOpen, setMobileMenuOpen }) {
    const { activeTab, handleTabChange } = useContext(AppContext);
    const { currentUser, userRole, username, canAccessMenu } = useAuth();

    const handleLogout = async () => {
        const userData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
        await logActivity('LOGOUT', 'Autentikasi', 'Keluar dari sistem', userData);
        auth.signOut();
    };

    return (
        <>
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-[80] lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute bottom-28 left-0 right-0 mx-auto w-[90%] max-w-[380px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-4 animate-slide-up max-h-[70vh] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }} onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-3 gap-2">
                            <MobileMenuItem icon={<Icon name="layout-dashboard" size={20} />} label="Beranda" isActive={activeTab === 'dashboard'} onClick={() => { handleTabChange('dashboard'); setMobileMenuOpen(false); }} />
                            {canAccessMenu('Proyek') && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 px-2">PM & Control</div>
                                    <MobileMenuItem icon={<Icon name="briefcase" size={20} />} label="Proyek" isActive={activeTab === 'proyek'} onClick={() => { handleTabChange('proyek'); setMobileMenuOpen(false); }} />
                                    <MobileMenuItem icon={<Icon name="users" size={20} />} label="Tim" isActive={activeTab === 'tim'} onClick={() => { handleTabChange('tim'); setMobileMenuOpen(false); }} />
                                    <MobileMenuItem icon={<Icon name="calendar-days" size={20} />} label="Jadwal" isActive={activeTab === 'gantt'} onClick={() => { handleTabChange('gantt'); setMobileMenuOpen(false); }} />
                                </>
                            )}
                            {canAccessMenu('Tenaga Ahli') && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 px-2">Experts</div>
                                    <MobileMenuItem icon={<Icon name="award" size={20} />} label="Ahli" isActive={activeTab === 'ahli'} onClick={() => { handleTabChange('ahli'); setMobileMenuOpen(false); }} />
                                    <MobileMenuItem icon={<Icon name="briefcase" size={20} />} label="Tugas" isActive={activeTab === 'penugasan'} onClick={() => { handleTabChange('penugasan'); setMobileMenuOpen(false); }} />
                                </>
                            )}
                            {(canAccessMenu('Inventaris') || canAccessMenu('Admin Aset')) && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Assets</div>
                                    {canAccessMenu('Inventaris') && (
                                        <MobileMenuItem icon={<Icon name="box" size={20} />} label="Logistik & Inventaris" isActive={activeTab === 'inventaris'} onClick={() => { handleTabChange('inventaris'); setMobileMenuOpen(false); }} />
                                    )}
                                    {canAccessMenu('Admin Aset') && (
                                        <MobileMenuItem icon={<Icon name="package" size={20} />} label="Admin Aset" isActive={activeTab === 'admin-aset'} onClick={() => { handleTabChange('admin-aset'); setMobileMenuOpen(false); }} />
                                    )}
                                </>
                            )}
                            {canAccessMenu('KPI') && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Performance</div>
                                    <MobileMenuItem icon={<Icon name="bar-chart" size={20} />} label="KPI & Evaluasi" isActive={activeTab === 'kpi'} onClick={() => { handleTabChange('kpi'); setMobileMenuOpen(false); }} />
                                </>
                            )}
                            <>
                                <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Documents</div>
                                <MobileMenuItem icon={<Icon name="file-text" size={20} />} label="Dokumen" isActive={activeTab === 'sop'} onClick={() => { handleTabChange('sop'); setMobileMenuOpen(false); }} />
                            </>
                            {canAccessMenu('Manajemen Pengguna') && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Settings</div>
                                    <MobileMenuItem icon={<Icon name="settings" size={20} />} label="Pengguna" isActive={activeTab === 'pengguna'} onClick={() => { handleTabChange('pengguna'); setMobileMenuOpen(false); }} />
                                </>
                            )}
                            {userRole === 'Super Admin' && (
                                <>
                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Audit</div>
                                    <MobileMenuItem icon={<Icon name="activity" size={20} />} label="Log Aktivitas" isActive={activeTab === 'logbook'} onClick={() => { handleTabChange('logbook'); setMobileMenuOpen(false); }} />
                                </>
                            )}
                            <div className="col-span-3 h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                            <button
                                onClick={handleLogout}
                                className="col-span-3 w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-left group text-red-600 dark:text-red-400"
                            >
                                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                                    <Icon name="log-out" size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-red-600 dark:text-red-400">Keluar Sistem</div>
                                    <div className="text-xs text-red-400 dark:text-red-500">Akhiri sesi ini</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 h-[70px] w-[90%] max-w-[380px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 rounded-[35px] z-[90] flex justify-between items-center px-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-indigo-900/20 transition-all duration-500">
                <BottomNavItem icon={<Icon name="layout-dashboard" size={20} />} label="Beranda" isActive={activeTab === 'dashboard' && !mobileMenuOpen} onClick={() => { handleTabChange('dashboard'); setMobileMenuOpen(false); }} />
                {canAccessMenu('Proyek') && (
                    <>
                        <BottomNavItem icon={<Icon name="briefcase" size={20} />} label="Proyek" isActive={activeTab === 'proyek' && !mobileMenuOpen} onClick={() => { handleTabChange('proyek'); setMobileMenuOpen(false); }} />
                        <BottomNavItem icon={<Icon name="users" size={20} />} label="Tim" isActive={activeTab === 'tim' && !mobileMenuOpen} onClick={() => { handleTabChange('tim'); setMobileMenuOpen(false); }} />
                    </>
                )}
                <BottomNavItem icon={<Icon name="menu" size={20} />} label="Menu" isActive={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
            </nav>
        </>
    );
}
