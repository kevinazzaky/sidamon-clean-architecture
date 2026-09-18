import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { calculateLeaderKPI, calculateEmployeeKPI } from '../../shared/utils/projectCalculations';

export default function KPIPage() {
    const { resources, computedProjects, searchKPITab, setSearchKPITab, setShowKPIInfoModal } = useContext(AppContext);

    const safeResources = resources || [];
    const leaders = safeResources.filter(r => r.level === 'Team Leader');
    const kordinators = safeResources.filter(r => r.level?.startsWith('Kordinator Divisi'));
    const staffs = safeResources.filter(r => r.level !== 'Team Leader' && !r.level?.startsWith('Kordinator Divisi'));

    const allKpiDataLeaders = leaders.map(res => {
        const kpi = calculateLeaderKPI(res, computedProjects);
        return { ...res, ...kpi };
    });

    const allKpiDataKordinators = kordinators.map(res => {
        const kpi = calculateLeaderKPI(res, computedProjects);
        return { ...res, ...kpi };
    });

    const allKpiDataStaffs = staffs.map(res => {
        const kpi = calculateEmployeeKPI(res, computedProjects);
        return { ...res, ...kpi };
    });

    const sortKpiData = (a, b) => {
        // 1. Prioritas Utama: Skor KPI Tertinggi
        if (b.score !== a.score) return b.score - a.score;

        // 2. Prioritas Kedua (Tie-breaker 1): Rating Bintang Manual
        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);

        // 3. Prioritas Ketiga (Tie-breaker 2): Jumlah Proyek Selesai Tepat Waktu Terbanyak
        const doneA = (a.bonusDoneLeader !== undefined ? a.bonusDoneLeader : (a.bonusDone || 0)) + (a.bonusDoneStaff || 0);
        const doneB = (b.bonusDoneLeader !== undefined ? b.bonusDoneLeader : (b.bonusDone || 0)) + (b.bonusDoneStaff || 0);
        if (doneB !== doneA) return doneB - doneA;

        // 4. Prioritas Keempat (Tie-breaker 3): Keterlambatan Paling Sedikit
        if (a.delayed !== b.delayed) return a.delayed - b.delayed;

        // 5. Prioritas Kelima (Tie-breaker 4): Rata-rata Progress Tertinggi
        return b.avgProgress - a.avgProgress;
    };

    const search = (searchKPITab || '').toLowerCase();

    const kpiDataLeaders = allKpiDataLeaders
        .filter(res => (res.name || '').toLowerCase().includes(search) || (res.role || '').toLowerCase().includes(search))
        .sort(sortKpiData);

    const kpiDataKordinators = allKpiDataKordinators
        .filter(res => (res.name || '').toLowerCase().includes(search) || (res.role || '').toLowerCase().includes(search))
        .sort(sortKpiData);

    const kpiDataStaffs = allKpiDataStaffs
        .filter(res => (res.name || '').toLowerCase().includes(search) || (res.role || '').toLowerCase().includes(search))
        .sort(sortKpiData);

    const allKpiCombined = [...allKpiDataLeaders, ...allKpiDataKordinators, ...allKpiDataStaffs];
    const needsAttention = allKpiCombined.filter(k => k.score < 60 || (k.isOverloaded && k.delayed > 0));
    const healthyCount = allKpiCombined.length - needsAttention.length;

    const renderTableRows = (data, isLeaderTable) => {
        if (data.length === 0) {
            return <tr><td colSpan="5" className="p-8 text-center text-slate-400">Belum ada data personil.</td></tr>;
        }
        return data.map((kpi, idx) => (
            <tr key={kpi.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
                <td className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${idx === 0 ? 'bg-amber-400 shadow-lg shadow-amber-400/30' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-slate-800'}`}>
                        {idx + 1}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{kpi.name}</p>
                            {isLeaderTable && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1"><Icon name="star" size={10} className="fill-amber-500" /> Leader</span>}
                        </div>
                        {kpi.level && kpi.level.startsWith('Kordinator Divisi') ? (
                            <div className="text-xs text-slate-500">
                                <p>{kpi.level}</p>
                                <p>{kpi.role}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">
                                {kpi.level === 'PIC' ? `PIC ${kpi.role}` : kpi.role}
                            </p>
                        )}
                    </div>
                </td>
                <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${kpi.score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : kpi.score >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {kpi.score}
                    </span>
                </td>
                <td className="p-4">
                    <div className="flex justify-center items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={i < kpi.rating ? "currentColor" : "none"} stroke={i < kpi.rating ? "currentColor" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
                    </div>
                </td>
                <td className="p-4 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{kpi.avgProgress}%</span>
                </td>
                <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                        {isLeaderTable && kpi.bonusDoneLeader > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">+{kpi.bonusDoneLeader * 20} Bonus Leader (Tepat Waktu)</span>}
                        {isLeaderTable && kpi.bonusDoneStaff > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">+{kpi.bonusDoneStaff * 15} Bonus Staff (Tepat Waktu)</span>}
                        {!isLeaderTable && kpi.bonusDone > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">+{kpi.bonusDone * 15} Bonus Selesai Tepat Waktu</span>}
                        {kpi.isOverloaded && kpi.delayed > 0 && <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">Overload & Terlambat</span>}
                        {kpi.isOverloaded && kpi.delayed === 0 && <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">Performa Ekstra (&gt;4 Proyek)</span>}
                        {kpi.delayed > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">{kpi.delayed} Proyek Terlambat</span>}
                        {kpi.atRisk > 0 && <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-medium inline-block whitespace-nowrap">{kpi.atRisk} Proyek Beresiko</span>}
                        {!kpi.isOverloaded && kpi.delayed === 0 && kpi.atRisk === 0 && <span className="text-xs text-slate-400 italic">Bersih & Aman</span>}
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <Icon name="alert-triangle" className="shrink-0 mt-0.5 text-indigo-600" />
                <div>
                    <h4 className="font-bold text-sm">Tahap Pengembangan (BETA)</h4>
                    <p className="text-sm mt-1">Menu Evaluasi dan KPI ini belum resmi digunakan dan masih dalam tahap uji coba (pengembangan logika). Data di bawah ini belum menjadi hasil penilaian akhir.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-6 rounded-2xl">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Evaluasi & KPI Personil (BETA)</h3>
                    <p className="text-sm text-slate-500 mt-1">Mengukur kinerja berdasarkan ketepatan waktu, manajemen beban, dan rating.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-2 shrink-0">
                        <Icon name="check-circle-2" size={18} />
                        <span className="font-bold text-sm">{healthyCount} Sehat</span>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-slate-200 flex items-center gap-2 shrink-0">
                        <Icon name="alert-triangle" size={18} />
                        <span className="font-bold text-sm">{needsAttention.length} Perlu Pantauan</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-row gap-3 items-center bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl p-4 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/60 dark:border-slate-700/50">
                <div className="relative flex-1 sm:flex-none sm:w-96">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau Tim..."
                        value={searchKPITab}
                        onChange={(e) => setSearchKPITab(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors dark:text-slate-200"
                    />
                </div>
                <button
                    onClick={() => setShowKPIInfoModal(true)}
                    className="shrink-0 p-2.5 text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 dark:bg-slate-900/50 dark:hover:bg-blue-900/30 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                    title="Informasi Perhitungan KPI"
                >
                    <Icon name="help-circle" size={20} />
                </button>
            </div>

            {/* TABEL TEAM LEADER */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl border border-white/60 dark:border-amber-900/30 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden flex flex-col mt-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/30 flex items-center gap-2">
                    <Icon name="star" size={20} className="fill-amber-500 text-amber-600" />
                    <h3 className="font-bold text-amber-900 dark:text-amber-400">Leaderboard: Team Leader</h3>
                </div>
                <div className="p-0 overflow-x-auto min-h-[150px]">
                    <table className="enterprise-table text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold whitespace-nowrap">Peringkat & Personil</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Skor KPI</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Rating Manual</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Progress Makro Rata-rata</th>
                                <th className="p-4 font-semibold whitespace-nowrap">Rincian Masalah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {renderTableRows(kpiDataLeaders, true)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABEL KORDINATOR DIVISI */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl border border-white/60 dark:border-blue-900/30 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden flex flex-col mt-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-900/30 flex items-center gap-2">
                    <Icon name="target" size={20} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-blue-900 dark:text-blue-400">Leaderboard: Kordinator Divisi</h3>
                </div>
                <div className="p-0 overflow-x-auto min-h-[150px]">
                    <table className="enterprise-table text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold whitespace-nowrap">Peringkat & Personil</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Skor KPI</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Rating Manual</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Progress Makro Rata-rata</th>
                                <th className="p-4 font-semibold whitespace-nowrap">Rincian Masalah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {renderTableRows(kpiDataKordinators, true)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABEL STAFF */}
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col mt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                    <Icon name="users" size={20} className="text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Leaderboard: Staff & Anggota Tim</h3>
                </div>
                <div className="p-0 overflow-x-auto min-h-[300px]">
                    <table className="enterprise-table text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold whitespace-nowrap">Peringkat & Personil</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Skor KPI</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Rating Manual</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">Progress Sub-Tim Rata-rata</th>
                                <th className="p-4 font-semibold whitespace-nowrap">Rincian Masalah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {renderTableRows(kpiDataStaffs, false)}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
