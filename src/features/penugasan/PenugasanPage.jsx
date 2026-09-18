import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';

export default function PenugasanPage() {
    const {
        assignments, assignmentTabFilter, setAssignmentTabFilter, searchAssignmentTab, setSearchAssignmentTab,
        experts, setPrintData, canManageAssignments, setModalConfig, setConfirmDialog, handleAssignmentAction
    } = useContext(AppContext);

    const filteredAssignments = assignments.filter(asg => {
        // Filter pekerjaan berdasarkan status (Berjalan vs Riwayat Selesai)
        if (asg.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(asg.endDate);
            end.setHours(0, 0, 0, 0);

            const isCompleted = end < today;
            const isAllTerminsSelesai = asg.termins && asg.termins.length > 0 && asg.termins.every(t => t.status === 'Selesai');

            // Arsipkan otomatis jika SEMUA termin yang didaftarkan sudah selesai
            if (isAllTerminsSelesai) return false;

            if (assignmentTabFilter === "active" && isCompleted) return false;
            if (assignmentTabFilter === "completed" && !isCompleted) return false;
        } else if (assignmentTabFilter === "completed") {
            // Jika tidak ada endDate, maka dianggap belum selesai (Sedang Berjalan)
            return false;
        }

        const search = searchAssignmentTab.toLowerCase();
        const matchJob = (asg.jobName || '').toLowerCase().includes(search);
        const matchLpse = (asg.lpseName || '').toLowerCase().includes(search);

        const matchExpert = (asg.experts || []).some(expPlot => {
            const exp = experts.find(e => e.id === expPlot.expertId);
            const expertName = exp ? exp.name.toLowerCase() : '';
            return expertName.includes(search) || (expPlot.certificateName || '').toLowerCase().includes(search) || (expPlot.additionalCertificates || []).some(c => (c || '').toLowerCase().includes(search));
        });

        return matchJob || matchLpse || matchExpert;
    });

    return (
        <div className="space-y-6 fade-in pb-12">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 dark:border-slate-800 p-4 lg:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-colors">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Icon name="briefcase" size={24} />
                        </div>
                        Penugasan Tenaga Ahli
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Kelola plotting penugasan tenaga ahli untuk proyek.</p>
                </div>
                <div className="flex gap-2 w-full xl:w-auto flex-wrap sm:flex-nowrap">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                        <button
                            onClick={() => setAssignmentTabFilter('active')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${assignmentTabFilter === 'active' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >Berjalan</button>
                        <button
                            onClick={() => setAssignmentTabFilter('completed')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${assignmentTabFilter === 'completed' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >Selesai</button>
                    </div>
                    <div className="relative flex-1 sm:w-64 min-w-[200px]">
                        <input type="text" placeholder="Cari penugasan..." value={searchAssignmentTab} onChange={(e) => setSearchAssignmentTab(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow" />
                        <Icon name="search" size={16} className="absolute left-3 top-3 text-slate-400" />
                    </div>
                    <button onClick={() => {
                        setPrintData({ type: 'expert_assignment' });
                    }} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold flex items-center gap-2 text-sm shrink-0 border border-slate-300 dark:border-slate-700">
                        <Icon name="printer" size={18} /> Ekspor Laporan
                    </button>
                    {canManageAssignments() && (
                        <button onClick={() => setModalConfig({ isOpen: true, type: 'assignment', mode: 'add', data: null })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-semibold flex items-center gap-2 text-sm shrink-0">
                            <Icon name="plus" size={18} /> Tambah Penugasan
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAssignments.map(asg => {
                    return (
                        <div key={asg.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 transition-all group flex flex-col">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-2 break-words">{asg.jobName}</h4>
                                    <div className="flex flex-col items-start gap-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 break-all sm:break-normal">
                                            {asg.tenderType}
                                        </span>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate w-full">{asg.lpseName}</p>
                                    </div>
                                </div>
                                {canManageAssignments() && (
                                    <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setModalConfig({ isOpen: true, type: 'assignment', mode: 'edit', data: asg })} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800 rounded-lg" title="Edit Penugasan"><Icon name="edit-3" size={16} /></button>
                                        <button onClick={() => {
                                            setConfirmDialog({ isOpen: true, title: 'Hapus Pekerjaan', message: `Hapus pekerjaan ${asg.jobName}?`, type: 'danger', onConfirm: () => handleAssignmentAction('delete', { id: asg.id }) });
                                        }} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800 rounded-lg" title="Hapus"><Icon name="trash-2" size={16} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 space-y-3 flex-1">
                                <div className="flex flex-col gap-3 mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Tipe Proyek & Kontrak</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{asg.projectType || 'Pengawasan'} - {asg.contractType}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5">Progress Termin</p>
                                        {(asg.termins && asg.termins.length > 0) ? (
                                            <div className="flex flex-wrap gap-1.5 pb-1">
                                                {asg.termins.map((t, idx) => {
                                                    let badgeClass = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700";
                                                    if (t.status === 'Selesai') badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
                                                    if (t.status === 'Tertunda') badgeClass = "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";

                                                    const shortLabel = t.label.replace('Termin ', 'T');

                                                    // Mencegah tooltip terpotong oleh card edge
                                                    const isNearLeft = idx < 2;
                                                    const isNearRight = idx === asg.termins.length - 1 && asg.termins.length > 2;

                                                    const tooltipPos = isNearLeft ? "left-0 translate-x-0" : isNearRight ? "right-0 translate-x-0 left-auto" : "left-1/2 -translate-x-1/2";
                                                    const arrowPos = isNearLeft ? "left-5 translate-x-0" : isNearRight ? "right-5 translate-x-0 left-auto" : "left-1/2 -translate-x-1/2";

                                                    return (
                                                        <div key={idx} className={`group/termin relative cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${badgeClass}`}>
                                                            <span>{shortLabel}</span>

                                                            {/* Custom Animated Tooltip */}
                                                            <div className={`absolute bottom-full ${tooltipPos} mb-2 w-max min-w-[160px] bg-slate-800/95 backdrop-blur-sm dark:bg-slate-700/95 text-white text-[11px] rounded-xl p-3 opacity-0 invisible group-hover/termin:opacity-100 group-hover/termin:visible transition-all duration-300 shadow-xl z-50 pointer-events-none transform translate-y-2 group-hover/termin:translate-y-0 border border-slate-700 dark:border-slate-600`}>
                                                                <div className="font-bold text-indigo-300 mb-2 border-b border-slate-600/50 pb-1.5 text-center uppercase tracking-wider">{t.label}</div>

                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-400 font-medium">Status</span>
                                                                        <span className={`font-bold ${t.status === 'Selesai' ? 'text-emerald-400' : t.status === 'Tertunda' ? 'text-red-400' : 'text-slate-300'}`}>{t.status}</span>
                                                                    </div>

                                                                    {t.status !== 'Belum Diajukan' && (
                                                                        <>
                                                                            {t.date && (
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400 font-medium">Tanggal</span>
                                                                                    <span className="font-bold text-slate-200">{formatDateIndo(t.date)}</span>
                                                                                </div>
                                                                            )}

                                                                            {t.nominal && (
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400 font-medium">Nominal</span>
                                                                                    <span className="font-bold text-emerald-400">Rp {t.nominal}</span>
                                                                                </div>
                                                                            )}

                                                                            {t.percentage && (
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400 font-medium">Bobot</span>
                                                                                    <span className="font-bold text-indigo-300">{t.percentage}%</span>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Tooltip Arrow */}
                                                                <div className={`absolute top-full ${arrowPos} border-[5px] border-transparent border-t-slate-800/95 dark:border-t-slate-700/95`}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 dark:text-slate-600 italic">-</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Perusahaan</p>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{asg.company || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Nilai Kontrak</p>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{asg.contractValue ? `Rp ${asg.contractValue}` : '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">SPMK - Berakhir - Durasi</p>
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {asg.startDate ? formatDateIndo(asg.startDate) : '-'} s/d {asg.endDate ? formatDateIndo(asg.endDate) : '-'} ({asg.duration || 0} Hari)
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5"><Icon name="users" size={12} /> Tenaga Ahli Diplot ({(asg.experts || []).length})</p>
                                    {(asg.experts || []).length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Belum ada tenaga ahli.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {(asg.experts || []).map((expPlot, idx) => {
                                                const exp = experts.find(e => e.id === expPlot.expertId);
                                                const expertName = exp ? exp.name : 'Unknown';
                                                const certObj = exp ? (exp.certificates || []).find(c => c.certName === expPlot.certificateName) : null;
                                                let certDisplay = certObj && certObj.certLevel ? `${expPlot.certificateName} (${certObj.certLevel})` : expPlot.certificateName;
                                                (expPlot.additionalCertificates || []).forEach(addCert => {
                                                    if (!addCert) return;
                                                    const cObj = exp ? (exp.certificates || []).find(c => c.certName === addCert) : null;
                                                    const cDisplay = cObj && cObj.certLevel ? `${addCert} (${cObj.certLevel})` : addCert;
                                                    if (!certDisplay) certDisplay = cDisplay;
                                                    else certDisplay += ` & ${cDisplay}`;
                                                });
                                                return (
                                                    <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {expertName}
                                                                {expPlot.role && <span className="font-normal text-slate-500">{" "}({expPlot.role})</span>}
                                                            </p>
                                                            {(expPlot.certificateName || (expPlot.additionalCertificates || []).length > 0) && <p className="text-[10px] text-slate-500 truncate">SKA: {certDisplay}</p>}
                                                        </div>
                                                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full whitespace-nowrap">{expPlot.manMonth} MM</span>
                                                            {expPlot.billingRate && (
                                                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Rp {expPlot.billingRate}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    );
                })}

                {filteredAssignments.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <Icon name="briefcase" size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-slate-500">Belum ada penugasan tenaga ahli.</p>
                        <p className="text-sm mt-1">Klik "Tambah Penugasan" untuk membuat data baru.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
