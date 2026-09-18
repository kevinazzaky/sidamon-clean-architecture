import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';

export default function MasterSchedulePage() {
    const { computedProjects, scheduleZoom, setScheduleZoom, setActiveScheduleProject, setActiveTab } = useContext(AppContext);

    let displayedProjects = computedProjects.filter(p => p.spmk && p.deadline && p.type?.toLowerCase().includes('perencanaan') && Number(p.progress || 0) < 100 && p.status !== 'Done');

    if (displayedProjects.length === 0) {
        return (
            <div className="relative flex flex-col h-[calc(100vh-12rem)] min-h-[400px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] items-center justify-center p-8 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                        <Icon name="folder-open" size={40} className="text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Master Schedule Kosong</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Tidak ada data proyek dengan tanggal SPMK dan Deadline yang aktif saat ini.</p>
                </div>
            </div>
        );
    }

    let globalMinDate = new Date(Math.min(...displayedProjects.map(p => new Date(p.spmk))));
    let globalMaxDate = new Date(Math.max(...displayedProjects.map(p => new Date(p.deadline))));

    if (isNaN(globalMinDate.getTime())) globalMinDate = new Date();
    if (isNaN(globalMaxDate.getTime())) globalMaxDate = new Date(globalMinDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    let chartStart = new Date(globalMinDate);
    chartStart.setMonth(chartStart.getMonth() - 1);
    chartStart.setDate(1);

    let chartEnd = new Date(globalMaxDate);
    chartEnd.setMonth(chartEnd.getMonth() + 2);
    chartEnd.setDate(0);

    const timeUnits = [];
    let curr = new Date(chartStart);
    if (scheduleZoom === 'month') {
        while (curr <= chartEnd) {
            timeUnits.push({ date: new Date(curr), label: curr.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase(), monthLabel: curr.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase() });
            curr.setMonth(curr.getMonth() + 1);
        }
    } else {
        let currentMonth = -1;
        let weekCounter = 1;
        while (curr <= chartEnd) {
            const monthStr = curr.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();
            if (curr.getMonth() !== currentMonth) {
                currentMonth = curr.getMonth();
                weekCounter = 1;
            }
            timeUnits.push({ date: new Date(curr), label: `MG ${weekCounter}`, monthLabel: monthStr });

            let nextDate = new Date(curr);
            nextDate.setDate(nextDate.getDate() + 7);

            if (nextDate.getMonth() !== currentMonth) {
                curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
            } else {
                curr = nextDate;
            }
            weekCounter++;
        }
    }

    const totalDays = Math.round((chartEnd - chartStart) / (1000 * 60 * 60 * 24)) + 1;

    timeUnits.forEach((u, i) => {
        let nextDate = i < timeUnits.length - 1 ? timeUnits[i + 1].date : new Date(chartEnd.getTime() + 1000 * 60 * 60 * 24);
        u.durationDays = Math.round((nextDate - u.date) / (1000 * 60 * 60 * 24));
        u.widthPercent = 100 / timeUnits.length;
    });

    const getDatePercent = (dateObj) => {
        if (dateObj < chartStart) return 0;
        if (dateObj > chartEnd) return 100;
        for (let i = 0; i < timeUnits.length; i++) {
            const u = timeUnits[i];
            const nextDate = i < timeUnits.length - 1 ? timeUnits[i + 1].date : new Date(chartEnd.getTime() + 1000 * 60 * 60 * 24);
            if (dateObj >= u.date && dateObj <= nextDate) {
                const fraction = (dateObj - u.date) / (nextDate - u.date);
                return (i * (100 / timeUnits.length)) + (fraction * (100 / timeUnits.length));
            }
        }
        return 100;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] fade-in glass-card rounded-[2rem] overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-800 dark:text-slate-100 font-bold text-lg">Master Schedule (Portofolio Proyek)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={scheduleZoom}
                        onChange={(e) => setScheduleZoom(e.target.value)}
                    >
                        <option value="month">Tampilan Bulanan</option>
                        <option value="week">Tampilan Mingguan</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative bg-white dark:bg-slate-950 fade-in">
                <div className="flex min-w-max min-h-full">
                    {/* Left Column: Project Names */}
                    <div className="w-80 border-r border-slate-200 dark:border-slate-800 shrink-0 flex flex-col bg-white dark:bg-slate-950 z-30 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                        <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-40">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Proyek</span>
                        </div>
                        <div className="flex flex-col">
                            {displayedProjects.map((p) => {
                                const isDone = p.status === 'Done';
                                return (
                                    <div key={p.id} className="h-14 border-b border-slate-100 dark:border-slate-800/50 flex items-center px-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight" title={p.name}>{p.name}</span>
                                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                {p.type?.toLowerCase().includes('perencana') ? 'Perencanaan' : p.type} • Akhir Kontrak: {formatDateIndo(p.deadline)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Column: Gantt Chart */}
                    <div className="flex-1 flex flex-col relative bg-slate-50/30 dark:bg-slate-950" style={{ minWidth: scheduleZoom === 'month' ? `${timeUnits.length * 80}px` : `${timeUnits.length * 40}px` }}>
                        <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-20 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm">
                            {scheduleZoom === 'week' && (
                                <div className="flex h-5 border-b border-slate-200 dark:border-slate-700">
                                    {(() => {
                                        const monthGroups = [];
                                        timeUnits.forEach(u => {
                                            const last = monthGroups[monthGroups.length - 1];
                                            if (last && last.monthLabel === u.monthLabel) last.widthPercent += u.widthPercent;
                                            else monthGroups.push({ monthLabel: u.monthLabel, widthPercent: u.widthPercent });
                                        });
                                        return monthGroups.map((g, i) => (
                                            <div key={`m-${i}`} className="flex items-center justify-center border-r border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 tracking-widest uppercase bg-slate-100/50 dark:bg-slate-800/50 overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: `${g.widthPercent}%` }}>
                                                {g.monthLabel}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                            <div className={`flex w-full ${scheduleZoom === 'week' ? 'h-5' : 'h-10'}`}>
                                {timeUnits.map((u, i) => (
                                    <div key={i} className={`flex items-center justify-center border-r border-slate-200 dark:border-slate-800/80 last:border-r-0 text-slate-500 font-bold tracking-wider ${scheduleZoom === 'week' ? 'text-[9px]' : 'text-[10px]'} overflow-hidden whitespace-nowrap text-ellipsis px-0.5`} style={{ width: `${u.widthPercent}%` }}>
                                        {u.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                                {timeUnits.map((u, i) => (
                                    <div key={`grid-${i}`} className="border-r border-slate-200 dark:border-slate-800/50 border-dashed shrink-0" style={{ width: `${u.widthPercent}%` }}></div>
                                ))}
                            </div>

                            <div className="absolute top-0 left-0 right-0 flex flex-col z-10 py-[1px]">
                                {displayedProjects.map((p) => {
                                    const pStart = new Date(p.spmk);
                                    const pEnd = new Date(p.deadline);

                                    const leftPercent = getDatePercent(pStart);
                                    const widthPercent = getDatePercent(pEnd) - leftPercent;

                                    const progress = Number(p.progress || 0);

                                    const pStatus = p.computedStatus || "On Progress";

                                    let bgColor = '#3b82f6'; // blue-500
                                    let textColor = 'text-white';
                                    if (pStatus === "Pending") bgColor = '#64748b'; // slate-500
                                    else if (pStatus === "Done") bgColor = '#10b981'; // emerald-500
                                    else if (pStatus === "Terlambat") bgColor = '#ef4444'; // red-500
                                    else if (pStatus === "Beresiko") {
                                        bgColor = '#facc15'; // yellow-400
                                        textColor = 'text-slate-800';
                                    }

                                    return (
                                        <div key={`bar-${p.id}`} className="h-14 flex items-center relative">
                                            <div className="absolute h-8 rounded-full shadow-sm flex items-center transition-all duration-300 overflow-visible min-w-[20px] group cursor-pointer hover:brightness-110 hover:shadow-md z-10 hover:z-50"
                                                onClick={() => { setActiveScheduleProject(p); setActiveTab('schedule'); }}
                                                style={{
                                                    left: `${Math.max(0, leftPercent)}%`,
                                                    width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`,
                                                    backgroundColor: bgColor
                                                }}
                                            >
                                                <div className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-l-full" style={{ width: `${progress}%` }}></div>
                                                <span className={`relative z-10 px-3 text-xs font-bold truncate drop-shadow-md ${textColor}`}>{progress}%</span>

                                                {/* Hover Tooltip */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-[10px] whitespace-nowrap flex flex-col gap-1 border border-slate-700/50 pointer-events-none">
                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                                                    <div className="font-bold text-slate-300 border-b border-slate-600 pb-1 mb-0.5">{p.name}</div>
                                                    {p.isPending && (
                                                        <div className="mb-1 pb-1 border-b border-slate-600/50">
                                                            <div className="text-orange-400 font-bold mb-0.5">Status: PENDING</div>
                                                            <div className="text-slate-400 whitespace-normal w-48 leading-tight italic">"{p.pendingReason}"</div>
                                                            {p.pendingDate && <div className="text-[8px] text-slate-500 mt-1">Sejak: {p.pendingDate}</div>}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-slate-400">SPMK:</span>
                                                        <span className="font-semibold text-emerald-400">{formatDateIndo(p.spmk)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-slate-400">Akhir Kontrak:</span>
                                                        <span className="font-semibold text-rose-400">{formatDateIndo(p.deadline)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {(() => {
                                const today = new Date();
                                if (today >= chartStart && today <= chartEnd) {
                                    const todayOffset = (today - chartStart) / (1000 * 60 * 60 * 24);
                                    const todayPercent = (todayOffset / totalDays) * 100;
                                    return (
                                        <div
                                            className="absolute top-0 bottom-0 border-l-2 border-rose-500 border-dashed z-20 pointer-events-none"
                                            style={{ left: `${todayPercent}%` }}
                                        >
                                            <div className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full absolute top-2 -translate-x-1/2 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse whitespace-nowrap flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div> Today
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
