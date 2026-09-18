import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import StatusBadge from '../../shared/components/StatusBadge';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getCategoryFromRole, getEffectiveEmpCategory, getMicroStatus } from '../../shared/utils/projectCalculations';

export default function EmployeeDetailPage() {
    const { viewingEmployee, setViewingEmployee, computedProjects, setPrintData, handleToggleIndividualStatus } = useContext(AppContext);

    const empCategory = getCategoryFromRole(viewingEmployee.role);

    const activeAssignedProjects = computedProjects.filter(p => {
        if (!(p.team || []).some(m => fuzzyMatchName(m, viewingEmployee.name)) || p.computedStatus === 'Done' || p.notStarted) return false;
        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
        let isIndividuallyDone = p.individualStatus?.[viewingEmployee.name] === true;

        if (isPengawasan) {
            const pengawasanDeadline = p.pengawasanDetails?.[viewingEmployee.name]?.deadline;
            if (pengawasanDeadline && pengawasanDeadline < new Date().toISOString().split('T')[0]) {
                isIndividuallyDone = true;
            }
            return !isIndividuallyDone;
        } else {
            const effectiveCat = getEffectiveEmpCategory(p, viewingEmployee.name, viewingEmployee.role);
            const microProgress = p.categoryDetails?.[effectiveCat]?.progress ? Number(p.categoryDetails[effectiveCat].progress) : 0;
            return microProgress < 100 && !isIndividuallyDone;
        }
    });

    const completedAssignedProjects = computedProjects.filter(p => {
        if (!(p.team || []).some(m => fuzzyMatchName(m, viewingEmployee.name)) || p.computedStatus === 'Done' || p.notStarted) return false;
        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
        let isIndividuallyDone = p.individualStatus?.[viewingEmployee.name] === true;

        if (isPengawasan) {
            const pengawasanDeadline = p.pengawasanDetails?.[viewingEmployee.name]?.deadline;
            if (pengawasanDeadline && pengawasanDeadline < new Date().toISOString().split('T')[0]) {
                isIndividuallyDone = true;
            }
            return isIndividuallyDone;
        } else {
            const effectiveCat = getEffectiveEmpCategory(p, viewingEmployee.name, viewingEmployee.role);
            const microProgress = p.categoryDetails?.[effectiveCat]?.progress ? Number(p.categoryDetails[effectiveCat].progress) : 0;
            return microProgress >= 100 || isIndividuallyDone;
        }
    });

    const ledProjects = computedProjects.filter(p =>
        fuzzyMatchName(p.teamLeader, viewingEmployee.name) &&
        p.computedStatus !== 'Done' && !p.notStarted
    );

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewingEmployee(null)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
                        <Icon name="arrow-left" size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100">Rincian Penugasan: {viewingEmployee.name}</h2>
                        {viewingEmployee.level && viewingEmployee.level.startsWith('Kordinator Divisi') ? (
                            <div className="text-sm text-slate-500">
                                <p>{viewingEmployee.level}</p>
                                <p>{viewingEmployee.role} • Kapasitas Terpakai: <strong className={viewingEmployee.workload > 100 ? 'text-red-600' : 'text-blue-600'}>{viewingEmployee.workload}%</strong></p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                {viewingEmployee.level === 'PIC' ? `PIC ${viewingEmployee.role}` : viewingEmployee.role} • Kapasitas Terpakai: <strong className={viewingEmployee.workload > 100 ? 'text-red-600' : 'text-blue-600'}>{viewingEmployee.workload}%</strong>
                            </p>
                        )}
                    </div>
                </div>
                <button onClick={() => setPrintData({ type: 'personnel', name: viewingEmployee.name })} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0">
                    <Icon name="printer" size={16} /> Cetak Laporan Pegawai
                </button>
            </div>

            <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col">
                {viewingEmployee.level === 'Team Leader' && (
                    <div className="mb-6 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                            <Icon name="star" size={20} className="fill-amber-500 text-amber-600" />
                            <div>
                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Daftar Proyek yang Di-Lead</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Tanggung jawab pengawasan keseluruhan proyek secara Makro.</p>
                            </div>
                        </div>
                        <div className="p-0 overflow-x-auto min-h-[150px]">
                            <table className="enterprise-table text-left">
                                <thead>
                                    <tr className="bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-amber-800/50">
                                        <th className="p-4 font-semibold">Nama Proyek & Klien</th>
                                        <th className="p-4 font-semibold text-center">Tenggat Waktu Kontrak</th>
                                        <th className="p-4 font-semibold">Total Progress</th>
                                        <th className="p-4 font-semibold">Status Makro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 dark:divide-amber-800/50 text-sm bg-white dark:bg-slate-800">
                                    {ledProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-400">
                                                <Icon name="briefcase" size={32} className="mx-auto mb-2 opacity-50" />
                                                <p>Belum ada proyek yang dipimpin.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        ledProjects.map(p => (
                                            <tr key={`led-${p.id}`} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.client}</p>
                                                </td>
                                                <td className="p-4 text-center font-medium text-slate-700 dark:text-slate-300">
                                                    {p.deadline ? formatDateIndo(p.deadline) : <span className="text-slate-400 italic text-xs">Belum diatur</span>}
                                                </td>
                                                <td className="p-4 w-48">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{p.progress}% Selesai</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div className={`h-2 rounded-full ${p.computedStatus === 'Terlambat' ? 'bg-red-500' : p.computedStatus === 'Done' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${p.progress}%` }}></div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={p.computedStatus} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daftar Penugasan Sub-Tim Aktif</h3>
                    <p className="text-sm text-slate-500">Menampilkan target progres dan deadline spesifik untuk Sub-Tim <strong>{empCategory}</strong> pada masing-masing proyek.</p>
                </div>
                <div className="p-0 overflow-x-auto min-h-[300px]">
                    <table className="enterprise-table text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Nama Proyek</th>
                                <th className="p-4 font-semibold">Status Proyek (Makro)</th>
                                <th className="p-4 font-semibold">Tugas Sub-Tim ({empCategory})</th>
                                <th className="p-4 font-semibold">Deadline Sub-Tim</th>
                                <th className="p-4 font-semibold text-center">Status Individu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {activeAssignedProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        <Icon name="briefcase" size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Belum ada proyek yang ditugaskan kepada personil ini.</p>
                                    </td>
                                </tr>
                            ) : (
                                activeAssignedProjects.map(p => {
                                    const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
                                    const pengawasanDetail = p.pengawasanDetails?.[viewingEmployee.name] || {};
                                    const mRole = pengawasanDetail.role || '-';

                                    const effectiveCat = getEffectiveEmpCategory(p, viewingEmployee.name, viewingEmployee.role);
                                    const microDetails = p.categoryDetails?.[effectiveCat] || {};
                                    const mProg = microDetails.progress || 0;
                                    const mDead = isPengawasan ? pengawasanDetail.deadline : microDetails.deadline;
                                    const isIndividuallyDone = p.individualStatus && p.individualStatus[viewingEmployee.name] === true;
                                    const mStatus = isIndividuallyDone || mProg === 100 ? 'Done' : getMicroStatus(mProg, mDead);

                                    return (
                                        <tr key={p.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                                                <p className="text-xs text-slate-500">{p.client}</p>
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={p.computedStatus} />
                                            </td>
                                            {isPengawasan ? (
                                                <td colSpan="2" className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Peran: {mRole} | Status: {pengawasanDetail.statusTurun || 'Tidak Turun'}</span>
                                                        <span className="text-[11px] text-slate-600 dark:text-slate-400">SPMK: {p.spmk ? formatDateIndo(p.spmk) : '-'} | {pengawasanDetail.manMonth || '-'} Bulan</span>

                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="p-4 w-48">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{mProg}% Selesai {isIndividuallyDone && <span className="text-emerald-600 font-bold ml-1">(Bebas)</span>}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                            <div className={`h-2 rounded-full ${mStatus === 'Terlambat' ? 'bg-red-500' : mStatus === 'Done' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${mProg}%` }}></div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                                        {mDead ? formatDateIndo(mDead) : <span className="text-slate-400 italic text-xs">Belum diatur</span>}
                                                    </td>
                                                </>
                                            )}
                                            <td className="p-4 text-center">
                                                <button
                                                    className={`btn-clean-check group ${isIndividuallyDone ? 'success' : ''}`}
                                                    onClick={() => handleToggleIndividualStatus(p.id, viewingEmployee.name, !isIndividuallyDone)}
                                                    title={isIndividuallyDone ? 'Batalkan Selesai' : 'Tandai Selesai'}
                                                >
                                                    {!isIndividuallyDone ? (
                                                        <Icon name="check" size={20} className="transition-colors" />
                                                    ) : (
                                                        <div className="flip-wrapper">
                                                            <div className="flip-inner">
                                                                <div className="flip-front">
                                                                    <Icon name="check" size={20} className="transition-colors" />
                                                                </div>
                                                                <div className="flip-back">
                                                                    <Icon name="x" size={20} className="transition-colors" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {completedAssignedProjects.length > 0 && (
                    <>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 mt-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Riwayat Penugasan Selesai</h3>
                            <p className="text-sm text-slate-500">Menampilkan proyek di mana tugas Sub-Tim <strong>{empCategory}</strong> telah mencapai 100% atau ditandai selesai secara individu. Proyek ini tidak lagi membebani kapasitas kerja personil.</p>
                        </div>
                        <div className="p-0 overflow-x-auto min-h-[150px]">
                            <table className="enterprise-table text-left opacity-80">
                                <thead>
                                    <tr className="bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Nama Proyek</th>
                                        <th className="p-4 font-semibold">Status Proyek (Makro)</th>
                                        <th className="p-4 font-semibold">Tugas Sub-Tim ({empCategory})</th>
                                        <th className="p-4 font-semibold">Deadline Sub-Tim</th>
                                        <th className="p-4 font-semibold text-center">Status Individu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50 dark:divide-emerald-900/20 text-sm">
                                    {completedAssignedProjects.map(p => {
                                        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
                                        const pengawasanDetail = p.pengawasanDetails?.[viewingEmployee.name] || {};
                                        const mRole = pengawasanDetail.role || '-';

                                        const effectiveCat = getEffectiveEmpCategory(p, viewingEmployee.name, viewingEmployee.role);
                                        const microDetails = p.categoryDetails?.[effectiveCat] || {};
                                        const mProg = microDetails.progress || 0;
                                        const mDead = isPengawasan ? pengawasanDetail.deadline : microDetails.deadline;

                                        let isIndividuallyDone = p.individualStatus?.[viewingEmployee.name] === true;
                                        const pengawasanDeadline = isPengawasan ? p.pengawasanDetails?.[viewingEmployee.name]?.deadline : null;
                                        const isAutoDone = isPengawasan && pengawasanDeadline && pengawasanDeadline < new Date().toISOString().split('T')[0];

                                        if (isAutoDone) isIndividuallyDone = true;

                                        return (
                                            <tr key={p.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.client}</p>
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={p.computedStatus} />
                                                </td>
                                                {isPengawasan ? (
                                                    <td colSpan="2" className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Peran: {mRole} | Status: {pengawasanDetail.statusTurun || 'Tidak Turun'}</span>
                                                            <span className="text-[11px] text-slate-600 dark:text-slate-400">SPMK: {p.spmk ? formatDateIndo(p.spmk) : '-'} | {pengawasanDetail.manMonth || '-'} Bulan</span>

                                                        </div>
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="p-4 w-48">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">{mProg}% Selesai {isIndividuallyDone && <span className="text-emerald-600 font-bold ml-1">(Bebas)</span>}</span>
                                                            </div>
                                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                                <div className={`h-2 rounded-full bg-emerald-500`} style={{ width: `${mProg}%` }}></div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                                            {mDead ? formatDateIndo(mDead) : <span className="text-slate-400 italic text-xs">Belum diatur</span>}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="p-4 text-center">
                                                    {(mProg >= 100 && !isIndividuallyDone) || isAutoDone ? (
                                                        <div className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 w-full bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-default shadow-inner" title="Telah diselesaikan secara otomatis">
                                                            <Icon name="check-circle" size={14} className="text-emerald-500/70" />
                                                            Selesai (Otomatis)
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className={`btn-clean-check group ${isIndividuallyDone ? 'success' : ''}`}
                                                            onClick={() => handleToggleIndividualStatus(p.id, viewingEmployee.name, !isIndividuallyDone)}
                                                            title={isIndividuallyDone ? 'Batalkan Selesai' : 'Tandai Selesai'}
                                                        >
                                                            {!isIndividuallyDone ? (
                                                                <Icon name="check" size={20} className="transition-colors" />
                                                            ) : (
                                                                <div className="flip-wrapper">
                                                                    <div className="flip-inner">
                                                                        <div className="flip-front">
                                                                            <Icon name="check" size={20} className="transition-colors" />
                                                                        </div>
                                                                        <div className="flip-back">
                                                                            <Icon name="x" size={20} className="transition-colors" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
