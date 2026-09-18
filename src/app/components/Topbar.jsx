import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import Icon from '../../shared/components/Icon';

export default function Topbar({ onOpenMobileMenu }) {
    const {
        activeTab,
        darkMode,
        setDarkMode,
        isOnline = true,
        setShowPrintModal,
        initFirebaseListener,
        loading
    } = useContext(AppContext);

    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl mb-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-400/10 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-400/10 transition-colors duration-700"></div>

            <div className="relative z-10 flex items-center gap-4">
                <button
                    className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    onClick={onOpenMobileMenu}
                >
                    <Icon name="menu" size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        {activeTab === 'dashboard' && 'Ringkasan Proyek & Personil'}
                        {activeTab === 'proyek' && 'Manajemen Proyek'}
                        {activeTab === 'schedule' && 'Time Schedule Proyek'}
                        {activeTab === 'master-schedule' && 'Master Schedule (Portofolio)'}
                        {activeTab === 'tim' && 'Alokasi Sub-Tim'}
                        {activeTab === 'gantt' && 'Plotting Jadwal (Gantt)'}
                        {activeTab === 'ahli' && 'Database Tenaga Ahli'}
                        {activeTab === 'penugasan' && 'Penugasan Tenaga Ahli'}
                        {activeTab === 'inventaris' && 'Logistik & Inventaris Alat'}
                        {activeTab === 'admin-aset' && 'Manajemen Aset Gudang'}
                        {activeTab === 'kpi' && 'KPI & Evaluasi Kinerja'}
                        {activeTab === 'pengguna' && 'Manajemen Pengguna'}
                        {activeTab === 'sop' && 'Dokumen Perusahaan'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1 tracking-wide">
                        Aplikasi Manajemen Proyek & Personil Tim Teknis
                    </p>
                </div>
            </div>
            <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm relative group flex-shrink-0"
                    title={darkMode ? "Mode Terang" : "Mode Gelap"}
                >
                    <Icon name={darkMode ? "sun" : "moon"} size={20} className={darkMode ? "text-amber-400" : "text-slate-600"} />
                </button>
                {!isOnline && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/50 dark:border-amber-700/50 text-sm font-bold shadow-sm whitespace-nowrap">
                        <Icon name="wifi-off" size={16} />
                        <span className="hidden sm:inline">Offline</span>
                    </div>
                )}
                {activeTab === 'proyek' && setShowPrintModal && (
                    <button onClick={() => setShowPrintModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm shadow-sm hover:shadow-md">
                        <Icon name="printer" size={18} />
                        <span>Ekspor Laporan</span>
                    </button>
                )}
                <button
                    onClick={() => { if (initFirebaseListener) initFirebaseListener(); }}
                    className={`p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-all shadow-sm group flex-shrink-0 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                    title="Sinkronisasi Manual"
                >
                    <Icon name="refresh-ccw" size={20} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                </button>
            </div>
        </header>
    );
}
