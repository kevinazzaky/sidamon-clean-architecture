import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { useAuth } from '../../auth/useAuth';
import Icon from '../../shared/components/Icon';
import SidebarItem from '../../shared/components/SidebarItem';
import logoImg from '../../../LGIHT TRANSPARAN (1).PNG';
import logoSidamon from '../../assets/logo-sidamon.png';
import { auth } from '../../services/firebase';
import { logActivity } from '../../services/logService';

export default function Sidebar() {
    const { activeTab, handleTabChange, darkMode } = useContext(AppContext);
    const { currentUser, userRole, username, canAccessMenu } = useAuth();

    const handleLogout = async () => {
        const userData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
        await logActivity('LOGOUT', 'Autentikasi', 'Keluar dari sistem', userData);
        auth.signOut();
    };

    return (
        <aside className="hidden lg:flex lg:relative z-auto w-[270px] my-5 ml-5 rounded-[2rem] glass-panel text-slate-700 dark:text-slate-200 flex-col shrink-0 transition-all duration-300 shadow-xl overflow-hidden">
            <div className="p-7 pb-5 border-b border-slate-200/50 dark:border-slate-700/30">
                <div className="flex items-center gap-3 w-full mb-3">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                        <img src={darkMode ? logoSidamon : logoImg} alt="Logo SIDAMON" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg font-black tracking-widest leading-none text-slate-900 dark:text-white">SIDAMON</h1>
                        <span className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 mt-1 truncate">Gaharu Sempana Group</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap">Sistem Database & Monitoring</p>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto pb-4">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 first:mt-0 px-2">Overview</div>
                <SidebarItem icon={<Icon name="layout-dashboard" size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />

                {canAccessMenu('Proyek') && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Project Management & Control</div>
                        <SidebarItem icon={<Icon name="briefcase" size={20} />} label="List Proyek" isActive={activeTab === 'proyek'} onClick={() => handleTabChange('proyek')} />
                        {canAccessMenu('Time Schedule') && <SidebarItem icon={<Icon name="calendar" size={20} />} label="Master Schedule" isActive={activeTab === 'master-schedule'} onClick={() => handleTabChange('master-schedule')} />}
                        {canAccessMenu('Alokasi Tim') && <SidebarItem icon={<Icon name="users" size={20} />} label="Alokasi Tim" isActive={activeTab === 'tim'} onClick={() => handleTabChange('tim')} />}
                        {canAccessMenu('Plotting Jadwal') && <SidebarItem icon={<Icon name="calendar-days" size={20} />} label="Plotting Jadwal" isActive={activeTab === 'gantt'} onClick={() => handleTabChange('gantt')} />}
                    </>
                )}

                {canAccessMenu('Tenaga Ahli') && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Database & Assignment Experts</div>
                        <SidebarItem icon={<Icon name="award" size={20} />} label="Tenaga Ahli" isActive={activeTab === 'ahli'} onClick={() => handleTabChange('ahli')} />
                        <SidebarItem icon={<Icon name="briefcase" size={20} />} label="Penugasan Tenaga Ahli" isActive={activeTab === 'penugasan'} onClick={() => handleTabChange('penugasan')} />
                    </>
                )}

                {(canAccessMenu('Inventaris') || canAccessMenu('Admin Aset')) && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Assets</div>
                        {canAccessMenu('Inventaris') && (
                            <SidebarItem icon={<Icon name="box" size={20} />} label="Logistik & Inventaris" isActive={activeTab === 'inventaris'} onClick={() => handleTabChange('inventaris')} />
                        )}
                        {canAccessMenu('Admin Aset') && (
                            <SidebarItem icon={<Icon name="package" size={20} />} label="Admin Aset" isActive={activeTab === 'admin-aset'} onClick={() => handleTabChange('admin-aset')} />
                        )}
                    </>
                )}

                {canAccessMenu('KPI') && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Performance</div>
                        <SidebarItem icon={<Icon name="bar-chart" size={20} />} label="KPI & Evaluasi" isActive={activeTab === 'kpi'} onClick={() => handleTabChange('kpi')} />
                    </>
                )}

                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Documents</div>
                <SidebarItem icon={<Icon name="file-text" size={20} />} label="Dokumen" isActive={activeTab === 'sop'} onClick={() => handleTabChange('sop')} />

                {canAccessMenu('Manajemen Pengguna') && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Settings</div>
                        <SidebarItem icon={<Icon name="settings" size={20} />} label="Manajemen Pengguna" isActive={activeTab === 'pengguna'} onClick={() => handleTabChange('pengguna')} />
                    </>
                )}

                {userRole === 'Super Admin' && (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Audit</div>
                        <SidebarItem icon={<Icon name="activity" size={20} />} label="Log Aktivitas" isActive={activeTab === 'logbook'} onClick={() => handleTabChange('logbook')} />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/30">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 group shadow-sm"
                >
                    <Icon name="log-out" size={18} className="transition-transform group-hover:-translate-x-1" />
                    <span className="font-bold">Keluar Sistem</span>
                </button>
            </div>
        </aside>
    );
}
