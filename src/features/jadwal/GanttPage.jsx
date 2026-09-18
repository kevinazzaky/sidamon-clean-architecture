import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getEffectiveEmpCategory } from '../../shared/utils/projectCalculations';

export default function GanttPage() {
    const { resources, computedProjects, searchGanttTab, setSearchGanttTab } = useContext(AppContext);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ganttData = resources.map(res => {
        let latestDeadlineStr = null;
        let latestDate = new Date(0);
        let latestProjectName = null;

        computedProjects.forEach(p => {
            if (p.computedStatus === 'Done') return; // Hanya yang aktif

            const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
            if (isPengawasan) return; // Abaikan proyek pengawasan di Gantt

            let projDeadlineStr = null;

            // Khusus untuk Team Leader, abaikan deadline utama proyek.
            // Hanya ambil deadline dari perannya sebagai anggota Sub-Tim.
            if ((p.team || []).some(m => fuzzyMatchName(m, res.name))) {
                const effectiveCat = getEffectiveEmpCategory(p, res.name, res.role);
                const isIndividuallyDone = p.individualStatus?.[res.name] === true;
                if (!isIndividuallyDone && p.categoryDetails?.[effectiveCat]?.deadline) {
                    projDeadlineStr = p.categoryDetails[effectiveCat].deadline;
                }
            }

            if (projDeadlineStr) {
                const d = new Date(projDeadlineStr);
                if (!isNaN(d.getTime()) && d > latestDate) {
                    latestDate = d;
                    latestDeadlineStr = projDeadlineStr;
                    latestProjectName = p.name;
                }
            }
        });

        let availableNow = false;
        let isOverdue = false;
        let remainingDays = 0;

        if (!latestDeadlineStr) {
            availableNow = true;
        } else if (latestDate < today) {
            isOverdue = true;
            const diffTime = today - latestDate;
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
            const diffTime = latestDate - today;
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
            ...res,
            latestDeadlineStr,
            latestDate,
            latestProjectName,
            availableNow,
            isOverdue,
            remainingDays
        };
    });

    ganttData.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.availableNow !== b.availableNow) return a.availableNow ? 1 : -1;
        if (a.isOverdue) return b.remainingDays - a.remainingDays; // Sort highest overdue first
        return a.remainingDays - b.remainingDays;
    });

    const maxDays = Math.max(...ganttData.map(d => d.remainingDays), 30);

    return (
        <div className="space-y-6 fade-in">
            <ErrorBanner />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ploting & Jadwal Personil Perencanaan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Visualisasi sisa waktu beban kerja setiap personil dihitung dari <strong className="text-slate-700 dark:text-slate-300">Hari Ini</strong> hingga target <em className="text-slate-700 dark:text-slate-300">Deadline</em> terjauh dari semua proyek aktif mereka. Sangat berguna untuk memutuskan ploting personil ke proyek baru.</p>
                </div>
                <div className="w-full sm:w-64 flex-shrink-0 relative">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari pegawai, posisi, tugas..."
                        value={searchGanttTab}
                        onChange={e => setSearchGanttTab(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all dark:text-slate-200"
                    />
                </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/60 dark:border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[600px] p-4 sm:p-6 space-y-5">
                        {(() => {
                            let filteredGanttData = ganttData;
                            if (searchGanttTab.trim()) {
                                const term = searchGanttTab.toLowerCase();
                                filteredGanttData = ganttData.filter(d =>
                                    d.name.toLowerCase().includes(term) ||
                                    d.role.toLowerCase().includes(term) ||
                                    (d.latestProjectName && d.latestProjectName.toLowerCase().includes(term))
                                );
                            }

                            if (filteredGanttData.length === 0) {
                                return (
                                    <div className="text-center py-8">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 mb-3">
                                            <Icon name="search" size={24} />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada data ditemukan</h3>
                                        <p className="text-sm text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                                    </div>
                                );
                            }

                            return filteredGanttData.map((data, idx) => {
                                let widthPct = 0;
                                let barColor = "bg-slate-200";
                                let textColor = "text-slate-500";
                                let label = "Siap Ditugaskan Saat Ini";

                                if (data.isOverdue) {
                                    widthPct = 100;
                                    label = `Terlambat dari ${formatDateIndo(data.latestDeadlineStr)}`;
                                    barColor = "bg-rose-600";
                                    textColor = "text-rose-700";
                                } else if (!data.availableNow) {
                                    widthPct = Math.min((data.remainingDays / maxDays) * 100, 100);
                                    label = `s/d ${formatDateIndo(data.latestDeadlineStr)}`;

                                    if (data.remainingDays <= 14) { barColor = "bg-emerald-400"; textColor = "text-emerald-700"; }
                                    else if (data.remainingDays <= 60) { barColor = "bg-blue-500"; textColor = "text-blue-700"; }
                                    else { barColor = "bg-indigo-500"; textColor = "text-indigo-700"; }
                                } else {
                                    barColor = "bg-emerald-500"; textColor = "text-emerald-700";
                                }

                                return (
                                    <div key={idx} className="flex flex-col gap-1.5 border-b border-slate-50 dark:border-slate-700/50 pb-4 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-end mb-1">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                                                    {data.name}
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">{data.role}</span>
                                                </span>
                                                {data.latestProjectName && !data.availableNow && (
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        Tugas Terakhir: {data.latestProjectName}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${textColor}`}>{label}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-7 rounded-full overflow-hidden relative shadow-inner flex border border-slate-200/50 dark:border-slate-600/50">
                                            {data.availableNow ? (
                                                <div className={`h-full ${barColor} w-full flex items-center px-4 justify-between bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]`}>
                                                    <span className="text-[11px] font-bold text-white drop-shadow-sm flex items-center gap-1.5"><Icon name="check-circle-2" size={14} /> Available Now</span>
                                                </div>
                                            ) : data.isOverdue ? (
                                                <div className={`h-full ${barColor} w-full flex items-center px-4 justify-between bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]`}>
                                                    <span className="text-[11px] font-bold text-white drop-shadow-sm flex items-center gap-1.5"><Icon name="alert-triangle" size={14} /> Terlambat {data.remainingDays} Hari!</span>
                                                </div>
                                            ) : (
                                                <div className={`h-full ${barColor} flex items-center px-3 min-w-[5.5rem] justify-end rounded-full bg-gradient-to-r from-transparent to-black/10`} style={{ width: `${Math.max(widthPct, 12)}%` }}>
                                                    <span className="text-[11px] font-bold text-white drop-shadow-sm whitespace-nowrap">{data.remainingDays} Hari Lagi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
