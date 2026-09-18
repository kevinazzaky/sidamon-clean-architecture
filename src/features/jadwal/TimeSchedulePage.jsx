import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getEffectiveEmpCategory, getMicroStatus } from '../../shared/utils/projectCalculations';

export default function TimeSchedulePage() {
    const {
        activeScheduleProject, setActiveScheduleProject, setActiveTab, resources,
        scheduleZoom, setScheduleZoom, scheduleFilterUser, setScheduleFilterUser,
        scheduleCollapsedCats, setScheduleCollapsedCats, chartAnimate
    } = useContext(AppContext);

    if (!activeScheduleProject) return null;
    const p = activeScheduleProject;

    // 1. Ekstrak Fase/Tim yang aktif di proyek ini
    const phases = [];
    const possibleCats = ['Arsitek', 'Struktur', 'MEP', 'Tata Ruang', 'QS', 'Surveyor', 'Lainnya'];

    let globalMinDate = null;
    let globalMaxDate = null;

    const isPerencanaan = p.type?.toLowerCase().includes('perencana');

    possibleCats.forEach(cat => {
        const detail = p.categoryDetails?.[cat];
        const hasData = detail && (detail.startDate || detail.deadline || (detail.progress !== undefined && detail.progress !== ""));
        const hasSpmkData = isPerencanaan && p.spmk && detail && (detail.deadline || (detail.progress !== undefined && detail.progress !== ""));

        // Tampilkan jika punya startDate/deadline atau progress > 0
        if (hasData || hasSpmkData) {
            const rawStartDate = detail.startDate ? detail.startDate : p.spmk;
            let sd = rawStartDate ? new Date(rawStartDate) : null;
            let ed = detail.deadline ? new Date(detail.deadline) : null;

            if (sd && (!globalMinDate || sd < globalMinDate)) globalMinDate = new Date(sd);
            if (ed && (!globalMaxDate || ed > globalMaxDate)) globalMaxDate = new Date(ed);
            if (sd && !globalMaxDate) globalMaxDate = new Date(sd);
            if (ed && !globalMinDate) globalMinDate = new Date(ed);

            // Cari assignees (orang yang perannya masuk ke kategori ini dan ada di p.team)
            const assignees = p.team ? p.team.filter(mName => {
                const res = resources.find(r => fuzzyMatchName(r.name, mName));
                if (res) {
                    return getEffectiveEmpCategory(p, mName, res.role) === cat;
                }
                return false;
            }) : [];

            if (cat === 'Surveyor' && p.surveyorTeam && p.surveyorTeam.length > 0) {
                p.surveyorTeam.forEach(st => { if (!assignees.includes(st)) assignees.push(st); });
            }

            phases.push({
                id: cat,
                name: cat,
                startDate: sd,
                endDate: ed,
                progress: detail.progress || 0,
                assignees: assignees,
                isSubTask: false
            });

            if (detail.tasks && detail.tasks.length > 0) {
                detail.tasks.forEach((task, tIdx) => {
                    const isTaskCompleted = (detail.completedTasks || []).includes(task);
                    phases.push({
                        id: `${cat}-task-${tIdx}`,
                        name: task,
                        startDate: null,
                        endDate: null,
                        progress: isTaskCompleted ? 100 : 0,
                        assignees: [],
                        isSubTask: true
                    });
                });
            }
        }
    });

    // Jika tidak ada data tanggal sama sekali, gunakan hari ini sebagai default
    if (!globalMinDate) globalMinDate = new Date();
    if (!globalMaxDate) {
        globalMaxDate = new Date();
        globalMaxDate.setMonth(globalMaxDate.getMonth() + 3); // Default span 3 bulan
    }

    // Beri padding 1 bulan ke belakang dan 2 bulan ke depan untuk visual
    const chartStart = new Date(globalMinDate);
    chartStart.setDate(1);

    const chartEnd = new Date(globalMaxDate);
    chartEnd.setMonth(chartEnd.getMonth() + 2);
    chartEnd.setDate(0); // Akhir bulan

    // Generate array of months for the header
    const timeUnits = [];
    let curr = new Date(chartStart);

    if (scheduleZoom === 'month') {
        while (curr <= chartEnd) {
            timeUnits.push({ date: new Date(curr), label: curr.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase(), monthLabel: curr.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase() });
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
        u.widthPercent = (u.durationDays / totalDays) * 100;
    });



    // Filter phases by user
    let filteredPhases = phases;
    if (scheduleFilterUser !== 'Semua') {
        filteredPhases = phases.filter(ph => {
            if (ph.isSubTask) {
                const parent = phases.find(parentPhase => parentPhase.id === ph.id.split('-task')[0]);
                return parent && parent.assignees && parent.assignees.includes(scheduleFilterUser);
            }
            return ph.assignees && ph.assignees.includes(scheduleFilterUser);
        });
    }

    // Filter out collapsed subtasks
    filteredPhases = filteredPhases.filter(ph => {
        if (ph.isSubTask) {
            const parentId = ph.id.split('-task')[0];
            if (scheduleCollapsedCats[parentId]) return false;
        }
        return true;
    });

    // Warna ditentukan secara dinamis berdasarkan status fase (Selesai, Beresiko, Terlambat, On Progress)

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] fade-in glass-card rounded-[2rem] overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveTab('proyek'); setActiveScheduleProject(null); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                        <Icon name="arrow-left" size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 font-medium cursor-pointer hover:text-slate-800 dark:hover:text-slate-300" onClick={() => { setActiveTab('proyek'); setActiveScheduleProject(null); }}>Projects</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500 font-medium">Perencanaan</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{p.name}</span>
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
                    <select
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={scheduleFilterUser}
                        onChange={(e) => setScheduleFilterUser(e.target.value)}
                    >
                        <option value="Semua">Semua Personil</option>
                        {(p.team || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                </div>
            </div>

            {/* Sub Header (Timeline Span & Members) */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-500">Team Leader: <span className="text-slate-800 dark:text-slate-200 font-bold">{p.teamLeader || "Belum ditugaskan"}</span></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="font-semibold text-slate-500">Timeline: </span>
                    <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium shadow-sm flex items-center gap-2">
                        {formatDateIndo(globalMinDate.toISOString().split('T')[0])} to {formatDateIndo(globalMaxDate.toISOString().split('T')[0])}
                        <Icon name="chevrons-up-down" size={12} className="text-slate-400" />
                    </span>
                </div>
            </div>

            {/* Gantt Area */}
            <div className="flex-1 overflow-auto flex bg-white/40 dark:bg-slate-900/40">

                {/* Left Column: Items Table */}
                <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 shrink-0 flex flex-col bg-white dark:bg-slate-950 z-10 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                    <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredPhases.length === 0 ? (
                            <div className="p-4 text-xs text-slate-400 italic">Tidak ada data fase / jadwal untuk kriteria ini.</div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredPhases.map((phase) => {
                                    const isDone = phase.progress >= 100;
                                    return (
                                        <div key={phase.id} className={`h-12 border-b border-slate-100 dark:border-slate-800/50 flex items-center px-4 gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group ${phase.isSubTask ? 'pl-10 bg-slate-50/30 dark:bg-slate-900/10' : ''}`}>
                                            {!phase.isSubTask ? (
                                                <button
                                                    onClick={() => setScheduleCollapsedCats(prev => ({ ...prev, [phase.id]: !prev[phase.id] }))}
                                                    className="text-slate-400 hover:text-indigo-500 transition-colors"
                                                    title={scheduleCollapsedCats[phase.id] ? "Buka Sub-Tugas" : "Tutup Sub-Tugas"}
                                                >
                                                    <Icon name={scheduleCollapsedCats[phase.id] ? "chevron-right" : "chevron-down"} size={16} />
                                                </button>
                                            ) : (
                                                <div className="w-3 border-b-2 border-l-2 border-slate-300 dark:border-slate-600 h-3 rounded-bl -mt-2 ml-1 opacity-50 shrink-0"></div>
                                            )}
                                            <div className={`w-4 h-4 rounded shadow-sm border flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                                                {isDone && <Icon name="check" size={10} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <span className={`${phase.isSubTask ? 'text-xs' : 'text-sm'} font-semibold truncate ${isDone ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`} title={phase.name}>{phase.name}</span>
                                            {isDone && <Icon name="check-circle-2" size={14} className="text-emerald-500 ml-auto shrink-0" />}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Timeline Grid */}
                <div className="flex-1 flex flex-col relative min-w-[600px] overflow-x-auto">
                    {/* Months Header */}
                    <div className="border-b border-slate-200 dark:border-slate-800 flex flex-col relative shrink-0 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 w-full" style={{ minWidth: '100%' }}>
                        {scheduleZoom === 'week' && (
                            <div className="flex w-full h-5 border-b border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-800/80">
                                {/* Group by monthLabel */}
                                {(() => {
                                    const monthGroups = [];
                                    timeUnits.forEach(u => {
                                        const last = monthGroups[monthGroups.length - 1];
                                        if (last && last.monthLabel === u.monthLabel) {
                                            last.widthPercent += u.widthPercent;
                                        } else {
                                            monthGroups.push({ monthLabel: u.monthLabel, widthPercent: u.widthPercent });
                                        }
                                    });
                                    return monthGroups.map((g, i) => (
                                        <div key={`m-${i}`} className="flex items-center justify-center border-l border-slate-300 dark:border-slate-700 first:border-l-0 text-slate-700 dark:text-slate-300 font-bold tracking-wider text-[10px] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: `${g.widthPercent}%` }}>
                                            {g.monthLabel}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                        <div className={`flex w-full ${scheduleZoom === 'week' ? 'h-5' : 'h-10'}`}>
                            {timeUnits.map((u, i) => (
                                <div key={`u-${i}`} className={`flex items-center justify-center border-l border-slate-200 dark:border-slate-800/80 first:border-l-0 text-[10px] font-semibold ${scheduleZoom === 'month' ? 'text-slate-600 dark:text-slate-400 tracking-wider' : 'text-slate-400 dark:text-slate-500'} overflow-hidden whitespace-nowrap text-ellipsis`} style={{ width: `${u.widthPercent}%` }}>
                                    {u.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid Background Lines */}
                    <div className="absolute top-10 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                        {timeUnits.map((m, i) => (
                            <div key={`grid-${i}`} className="border-l border-slate-100 dark:border-slate-800/30 first:border-l-0 border-dashed" style={{ width: `${m.widthPercent}%` }}></div>
                        ))}
                    </div>

                    {/* Bars Area */}
                    <div className="flex-1 w-full relative z-10">
                        {filteredPhases.map((phase, idx) => {
                            let hasBar = false;
                            let leftPercent = 0;
                            let widthPercent = 0;
                            let isLate = false;
                            let phaseStatus = "On Progress";

                            if (phase.startDate && phase.endDate) {
                                hasBar = true;
                                const startOffset = Math.max(0, (phase.startDate - chartStart) / (1000 * 60 * 60 * 24));
                                const duration = (phase.endDate - phase.startDate) / (1000 * 60 * 60 * 24);
                                leftPercent = (startOffset / totalDays) * 100;
                                widthPercent = Math.max(1, (duration / totalDays) * 100);

                                // Get precise micro status
                                phaseStatus = getMicroStatus(phase.progress, phase.endDate);
                                if (phaseStatus === "Terlambat") {
                                    isLate = true;
                                }
                            } else if (phase.progress >= 100) {
                                phaseStatus = "Done";
                            }

                            let colorClass = "bg-blue-500 border-blue-600 text-white"; // On Progress (Biru)
                            if (phaseStatus === "Done") {
                                colorClass = "bg-emerald-500 border-emerald-600 text-white"; // Hijau
                            } else if (phaseStatus === "Terlambat") {
                                colorClass = "bg-red-500 border-red-600 text-white"; // Merah
                            } else if (phaseStatus === "Beresiko") {
                                colorClass = "bg-yellow-400 border-yellow-500 text-slate-800"; // Kuning
                            }



                            return (
                                <div key={`bar-${phase.id}`} className="h-12 border-b border-slate-100/50 dark:border-slate-800/30 flex items-center relative hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors w-full">
                                    {hasBar && (
                                        <div
                                            className={`absolute h-6 rounded-md border flex items-center shadow-sm group cursor-pointer hover:shadow-md transition-shadow hover:z-50 ${colorClass}`}
                                            style={{ left: `${leftPercent}%`, width: chartAnimate ? `${widthPercent}%` : '0%', minWidth: chartAnimate ? '40px' : '0px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                        >
                                            {/* Progress fill container */}
                                            <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                                                <div className={`absolute top-0 bottom-0 left-0 opacity-20 ${isLate ? 'bg-black' : 'bg-current'}`} style={{ width: `${phase.progress}%` }}></div>
                                            </div>

                                            {/* Label inside bar */}
                                            <div className="px-2 flex items-center gap-1.5 z-10 w-full h-full text-[10px] font-bold pointer-events-none overflow-hidden">
                                                {isLate && <Icon name="alert-triangle" size={10} className="text-white shrink-0" />}
                                                {phase.progress === 100 && <Icon name="check-circle-2" size={10} className="shrink-0" />}
                                            </div>

                                            {/* Rich Tooltip (Glassmorphism) */}
                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-[100] w-64 bg-slate-900/90 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl pointer-events-none border border-slate-700">
                                                <div className="font-bold text-sm mb-1">{phase.name}</div>
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="text-slate-400">Progress</span>
                                                    <span className="font-bold">{phase.progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full mb-3 overflow-hidden shadow-inner">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${phase.progress}%` }}></div>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                                        <Icon name="calendar" size={12} className="text-slate-400 shrink-0" />
                                                        {formatDateIndo(new Date(phase.startDate).toISOString().split('T')[0])} - {formatDateIndo(new Date(phase.endDate).toISOString().split('T')[0])}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                                        <Icon name="clock" size={12} className="text-slate-400 shrink-0" />
                                                        {(() => {
                                                            if (phaseStatus === 'Done') return 'Selesai';
                                                            const diffDays = Math.ceil((new Date(phase.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                            if (diffDays < 0) return <span className="text-red-400 font-bold">Terlambat {Math.abs(diffDays)} hari</span>;
                                                            return `Tersisa ${diffDays} hari`;
                                                        })()}
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-slate-300 mt-1 pt-1.5 border-t border-slate-700/50">
                                                        <Icon name="users" size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{phase.assignees && phase.assignees.length > 0 ? phase.assignees.join(', ') : 'Belum ditugaskan'}</span>
                                                    </div>

                                                </div>
                                            </div>


                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Today Line */}
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
                                        <div className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full absolute -top-3 -translate-x-1/2 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse whitespace-nowrap flex items-center gap-1">
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
    );
}
