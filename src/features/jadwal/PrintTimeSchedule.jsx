import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { getMicroStatus } from '../../shared/utils/projectCalculations';

export default function PrintTimeSchedule({ project: p }) {
    const { scheduleZoom } = useContext(AppContext);

    if (!p.type?.toLowerCase().includes('perencana')) return null;

    const phases = [];
    const possibleCats = ['Arsitek', 'Struktur', 'MEP', 'Tata Ruang', 'QS', 'Surveyor', 'Lainnya'];

    let globalMinDate = null;
    let globalMaxDate = null;

    possibleCats.forEach(cat => {
        const detail = p.categoryDetails?.[cat];
        const hasData = detail && (detail.startDate || detail.deadline || (detail.progress !== undefined && detail.progress !== ""));
        const hasSpmkData = p.spmk && detail && (detail.deadline || (detail.progress !== undefined && detail.progress !== ""));

        if (hasData || hasSpmkData) {
            const rawStartDate = detail.startDate ? detail.startDate : p.spmk;
            let sd = rawStartDate ? new Date(rawStartDate) : null;
            let ed = detail.deadline ? new Date(detail.deadline) : null;

            if (sd && (!globalMinDate || sd < globalMinDate)) globalMinDate = new Date(sd);
            if (ed && (!globalMaxDate || ed > globalMaxDate)) globalMaxDate = new Date(ed);
            if (sd && !globalMaxDate) globalMaxDate = new Date(sd);
            if (ed && !globalMinDate) globalMinDate = new Date(ed);

            phases.push({
                id: cat,
                name: cat,
                startDate: sd,
                endDate: ed,
                progress: detail.progress || 0,
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
                        isSubTask: true
                    });
                });
            }
        }
    });

    if (phases.length === 0) return null;

    if (!globalMinDate) globalMinDate = new Date();
    if (!globalMaxDate) {
        globalMaxDate = new Date();
        globalMaxDate.setMonth(globalMaxDate.getMonth() + 3);
    }

    const chartStart = new Date(globalMinDate);
    chartStart.setDate(1);

    const chartEnd = new Date(globalMaxDate);
    chartEnd.setMonth(chartEnd.getMonth() + 2);
    chartEnd.setDate(0);

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
            curr.setDate(curr.getDate() + 7);
            weekCounter++;
        }
    }
    const totalDays = Math.round((chartEnd - chartStart) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="print-landscape mt-10">
            <h2 className="text-lg font-bold uppercase border-b border-gray-400 pb-2 mb-4">Laporan Time Schedule: {p.name}</h2>
            <table className="w-full text-[10px] border-collapse border border-slate-300 dark:border-slate-700 table-fixed bg-white relative">
                <thead>
                    {scheduleZoom === 'week' ? (
                        <>
                            <tr className="bg-gray-200">
                                <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-1 w-[150px] text-left">Tasks / Kegiatan</th>
                                <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-1 w-[70px] text-center">Durasi</th>
                                <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-1 w-[105px] text-center">Status Target</th>
                                <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-1 w-[40px] text-center">Prog.</th>
                                {(() => {
                                    const monthGroups = [];
                                    timeUnits.forEach(u => {
                                        const last = monthGroups[monthGroups.length - 1];
                                        if (last && last.monthLabel === u.monthLabel) last.span++;
                                        else monthGroups.push({ monthLabel: u.monthLabel, span: 1 });
                                    });
                                    return monthGroups.map((g, i) => (
                                        <th key={`m-${i}`} colSpan={g.span} className="border border-slate-300 dark:border-slate-700 p-1 text-center font-bold bg-gray-300">
                                            {g.monthLabel}
                                        </th>
                                    ));
                                })()}
                            </tr>
                            <tr className="bg-gray-200">
                                {timeUnits.map((u, i) => (
                                    <th key={`w-${i}`} className="border border-slate-300 dark:border-slate-700 p-1 text-center font-bold text-[8px]">
                                        {u.label}
                                    </th>
                                ))}
                            </tr>
                        </>
                    ) : (
                        <tr className="bg-gray-200">
                            <th className="border border-slate-300 dark:border-slate-700 p-1 w-[150px] text-left">Tasks / Kegiatan</th>
                            <th className="border border-slate-300 dark:border-slate-700 p-1 w-[70px] text-center">Durasi</th>
                            <th className="border border-slate-300 dark:border-slate-700 p-1 w-[105px] text-center">Status Target</th>
                            <th className="border border-slate-300 dark:border-slate-700 p-1 w-[40px] text-center">Prog.</th>
                            {timeUnits.map((u, i) => (
                                <th key={i} className="border border-slate-300 dark:border-slate-700 p-1 text-center font-bold">
                                    {u.label}
                                </th>
                            ))}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {phases.map((phase) => {
                        const hasBar = phase.startDate && phase.endDate;
                        let leftPerc = 0;
                        let widthPerc = 0;
                        let manMonthStr = '-';

                        if (hasBar) {
                            let s = new Date(phase.startDate);
                            let e = new Date(phase.endDate);

                            // Calculate Duration based on actual dates
                            const daysTotal = Math.round((e - s) / (1000 * 60 * 60 * 24));
                            if (daysTotal >= 0) {
                                manMonthStr = daysTotal + ' Hari';
                            }

                            // Bounding for chart bar
                            if (s < chartStart) s = chartStart;
                            if (e > chartEnd) e = chartEnd;

                            const offsetDays = Math.round((s - chartStart) / (1000 * 60 * 60 * 24));
                            const durationDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;

                            leftPerc = (offsetDays / totalDays) * 100;
                            widthPerc = (durationDays / totalDays) * 100;
                        }

                        return (
                            <tr key={phase.id} className={phase.isSubTask ? "bg-white" : "bg-gray-50 font-semibold"}>
                                <td className={`border border-slate-300 dark:border-slate-700 p-1.5 truncate ${phase.isSubTask ? 'pl-4 text-gray-700' : ''}`}>
                                    {phase.isSubTask ? `└ ${phase.name}` : phase.name}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-700 p-1 text-center font-bold whitespace-nowrap">{manMonthStr}</td>
                                <td className="border border-slate-300 dark:border-slate-700 p-1 text-center font-bold uppercase">{getMicroStatus(phase.progress, phase.endDate)}</td>
                                <td className="border border-slate-300 dark:border-slate-700 p-1 text-center">{phase.progress}%</td>
                                <td colSpan={timeUnits.length} className="border border-slate-300 dark:border-slate-700 relative p-0 h-6">
                                    <div className="absolute inset-0 flex z-0">
                                        {timeUnits.map((m, i) => (
                                            <div key={i} className="flex-1 border-l border-gray-300 border-dashed first:border-l-0"></div>
                                        ))}
                                    </div>
                                    {hasBar && (
                                        <div
                                            className="absolute top-[4px] bottom-[4px] bg-black border border-slate-300 dark:border-slate-700 z-10 flex items-center justify-between px-1 text-[7px] text-white overflow-hidden whitespace-nowrap"
                                            style={{ left: `${leftPerc}%`, width: `${widthPerc}%`, printColorAdjust: 'exact' }}
                                        >
                                            <span>{formatDateIndo(new Date(phase.startDate).toISOString().split('T')[0])}</span>
                                            <span>{formatDateIndo(new Date(phase.endDate).toISOString().split('T')[0])}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <div className="mt-4 text-xs italic text-gray-600">
                Catatan: Bar berwarna solid hitam menunjukkan rentang waktu pelaksanaan tugas secara proporsional. <br />
                <strong>Tanggal Mulai (awal garis bar) pada chart ini disesuaikan dengan Tanggal Mulai masing-masing sub-tim.</strong>
            </div>
        </div>
    );
}
