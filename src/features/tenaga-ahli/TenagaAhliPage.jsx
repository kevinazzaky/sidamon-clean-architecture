import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import MetricCard from '../../shared/components/MetricCard';
import { formatDateIndo } from '../../shared/utils/dateHelpers';

export default function TenagaAhliPage() {
    const {
        experts, searchExpertTab, setSearchExpertTab, expertPage, setExpertPage,
        assignments, canEditExperts, setModalConfig, setConfirmDialog, handleExpertAction
    } = useContext(AppContext);

    const filteredExperts = experts.filter(e => {
        const search = searchExpertTab.toLowerCase();
        const matchName = e.name?.toLowerCase().includes(search);
        const matchBidangIlmu = e.bidangIlmu?.toLowerCase().includes(search);
        const matchCert = e.certificates?.some(c => c.certName?.toLowerCase().includes(search));
        return matchName || matchBidangIlmu || matchCert;
    });

    const assignedExpertIds = new Set();
    assignments.forEach(asg => {
        if (asg.experts) {
            asg.experts.forEach(ex => assignedExpertIds.add(ex.expertId));
        }
    });
    const assignedCount = experts.filter(e => assignedExpertIds.has(e.id)).length;
    const unassignedCount = experts.length - assignedCount;

    return (
        <div className="space-y-6 fade-in pb-12">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 dark:border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Icon name="award" size={24} />
                        </div>
                        Tenaga Ahli & Tender LPSE
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Kelola data tenaga ahli, sertifikat keahlian, dan alokasi tender LPSE.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input type="text" placeholder="Cari tenaga ahli..." value={searchExpertTab} onChange={(e) => { setSearchExpertTab(e.target.value); setExpertPage(1); }} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow" />
                        <Icon name="search" size={16} className="absolute left-3 top-3 text-slate-400" />
                    </div>
                    {canEditExperts() && (
                        <>
                            <button onClick={() => setModalConfig({ isOpen: true, type: 'expert', mode: 'add', data: null })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-semibold flex items-center gap-2 text-sm shrink-0">
                                <Icon name="plus" size={18} /> Tambah
                            </button>
                            <button onClick={() => setModalConfig({ isOpen: true, type: 'import_expert', mode: 'add', data: null })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-semibold flex items-center gap-2 text-sm shrink-0">
                                <Icon name="file-text" size={18} /> Import Excel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <MetricCard title="Total Tenaga Ahli" value={experts.length} trend="Terdaftar" trendUp={true} icon={<div className="text-blue-600"><Icon name="users" size={24} /></div>} color="bg-blue-50" />
                <MetricCard title="Aktif Penugasan" value={assignedCount} trend="Ditugaskan LPSE" trendUp={true} icon={<div className="text-emerald-600"><Icon name="briefcase" size={24} /></div>} color="bg-emerald-50" />
                <MetricCard title="Belum Ditugaskan" value={unassignedCount} trend="Tersedia" trendUp={true} icon={<div className="text-amber-600"><Icon name="clock" size={24} /></div>} color="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(() => {
                    const ITEMS_PER_PAGE = 30;
                    const totalPages = Math.ceil(filteredExperts.length / ITEMS_PER_PAGE);
                    const currentExperts = filteredExperts.slice((expertPage - 1) * ITEMS_PER_PAGE, expertPage * ITEMS_PER_PAGE);

                    return (
                        <>
                            {currentExperts.map(exp => (
                                <div key={exp.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-all group">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{exp.name}</h4>
                                            </div>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Icon name="phone" size={12} /> {exp.phone || '-'}</p>
                                                {exp.bidangIlmu && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5" title="Jenjang & Bidang Ilmu">
                                                        <Icon name="graduation-cap" size={12} /> {exp.bidangIlmu}
                                                    </p>
                                                )}
                                                {exp.perusahaan && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5" title="Perusahaan / Instansi">
                                                        <Icon name="building-2" size={12} /> {exp.perusahaan}
                                                    </p>
                                                )}
                                                {exp.keterangan && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 mt-0.5" title="Keterangan">
                                                        <Icon name="file-text" size={12} className="mt-0.5 shrink-0" /> <span className="line-clamp-2 break-words">{exp.keterangan}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {canEditExperts() && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModalConfig({ isOpen: true, type: 'expert', mode: 'edit', data: exp })} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800 rounded-lg" title="Edit Identitas"><Icon name="edit-3" size={16} /></button>
                                                <button onClick={() => {
                                                    setConfirmDialog({ isOpen: true, title: 'Hapus Tenaga Ahli', message: `Hapus tenaga ahli ${exp.name}?`, type: 'danger', onConfirm: () => handleExpertAction('delete', { id: exp.id }) });
                                                }} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800 rounded-lg" title="Hapus"><Icon name="trash-2" size={16} /></button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 space-y-5">
                                        {/* Sertifikat Section */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Icon name="shield" size={14} /> Sertifikat Keahlian
                                                </h5>
                                                {canEditExperts() && (
                                                    <button onClick={() => setModalConfig({ isOpen: true, type: 'expert_cert', mode: 'add', data: { expertId: exp.id } })} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                                        <Icon name="plus" size={10} /> Tambah
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {(!exp.certificates || exp.certificates.length === 0) ? (
                                                    <p className="text-xs text-slate-400 italic">Belum ada sertifikat.</p>
                                                ) : (
                                                    exp.certificates.map((cert, idx) => {
                                                        const isExpired = new Date(cert.expiredDate) < new Date();
                                                        return (
                                                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group/cert">
                                                                <div>
                                                                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cert.certName} <span className="text-xs font-normal text-slate-500">({cert.certLevel})</span></div>
                                                                    <div className={`text-[10px] font-bold mt-0.5 ${isExpired ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                        Exp: {formatDateIndo(cert.expiredDate)} {isExpired && '(EXPIRED)'}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {canEditExperts() && (
                                                                        <>
                                                                            <button onClick={() => setModalConfig({ isOpen: true, type: 'expert_cert', mode: 'edit', data: { expertId: exp.id, certIndex: idx, cert } })} className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors opacity-0 group-hover/cert:opacity-100"><Icon name="edit-2" size={14} /></button>
                                                                            <button onClick={() => {
                                                                                setConfirmDialog({
                                                                                    isOpen: true,
                                                                                    title: 'Hapus Sertifikat',
                                                                                    message: 'Hapus sertifikat ini?',
                                                                                    type: 'danger',
                                                                                    onConfirm: () => {
                                                                                        let updatedCerts = [...exp.certificates];
                                                                                        updatedCerts.splice(idx, 1);
                                                                                        handleExpertAction('update_certificates', { ...exp, certificates: updatedCerts });
                                                                                    }
                                                                                });
                                                                            }} className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors opacity-0 group-hover/cert:opacity-100"><Icon name="trash-2" size={14} /></button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* Tender LPSE Section (Linked to Assignments) */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Icon name="briefcase" size={14} /> Riwayat Tender LPSE
                                                </h5>
                                                {/* Tombol Tambah dihapus karena sudah terhubung ke menu Penugasan Tenaga Ahli */}
                                            </div>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const expertAssignments = [];
                                                    assignments.forEach(asg => {
                                                        // Filter out expired assignments
                                                        if (asg.endDate) {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const end = new Date(asg.endDate);
                                                            end.setHours(0, 0, 0, 0);

                                                            if (end < today) {
                                                                return;
                                                            }
                                                        }

                                                        const plot = (asg.experts || []).find(e => e.expertId === exp.id);
                                                        if (plot) {
                                                            expertAssignments.push({ ...asg, plotData: plot });
                                                        }
                                                    });

                                                    if (expertAssignments.length === 0) {
                                                        return <p className="text-xs text-slate-400 italic">Belum ada penugasan terdaftar.</p>;
                                                    }
                                                    return expertAssignments.map((tender, idx) => (
                                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group/tender">
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{tender.lpseName}</div>
                                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${tender.contractType === 'Waktu Penugasan' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800' : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                                                                    {tender.jobName} ({tender.tenderType})
                                                                </div>
                                                                <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex flex-wrap gap-x-3 gap-y-1">
                                                                    {
                                                                        (() => {
                                                                            const certObj = exp.certificates?.find(c => c.certName === tender.plotData.certificateName);
                                                                            let certDisplay = certObj && certObj.certLevel ? `${tender.plotData.certificateName} (${certObj.certLevel})` : (tender.plotData.certificateName || '-');
                                                                            (tender.plotData.additionalCertificates || []).forEach(addCert => {
                                                                                if (!addCert) return;
                                                                                const cObj = exp.certificates?.find(c => c.certName === addCert);
                                                                                const cDisplay = cObj && cObj.certLevel ? `${addCert} (${cObj.certLevel})` : addCert;
                                                                                if (certDisplay === '-') certDisplay = cDisplay;
                                                                                else certDisplay += ` & ${cDisplay}`;
                                                                            });
                                                                            return <span>SKA: {certDisplay}</span>;
                                                                        })()
                                                                    }
                                                                    <span>MM: {tender.plotData.manMonth}</span>
                                                                    <span>Kontrak: {tender.contractType || '-'}</span>
                                                                    <span>Selesai: {tender.endDate ? new Date(tender.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredExperts.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <Icon name="award" size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>Tidak ada data tenaga ahli ditemukan.</p>
                                </div>
                            )}
                            {totalPages > 1 && (
                                <div className="col-span-full flex justify-center items-center mt-6 space-x-3 fade-in">
                                    <button
                                        onClick={() => setExpertPage(prev => Math.max(prev - 1, 1))}
                                        disabled={expertPage === 1}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-semibold flex items-center gap-2 shadow-sm"
                                    >
                                        <Icon name="chevron-left" size={16} /> Sebelumnya
                                    </button>
                                    <span className="text-slate-600 dark:text-slate-400 font-medium px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm border border-slate-200 dark:border-slate-700">
                                        Hal {expertPage} dari {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setExpertPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={expertPage === totalPages}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-semibold flex items-center gap-2 shadow-sm"
                                    >
                                        Selanjutnya <Icon name="chevron-right" size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
