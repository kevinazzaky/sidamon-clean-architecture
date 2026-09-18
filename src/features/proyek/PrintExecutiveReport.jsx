import React, { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getCategoryFromRole, getEffectiveEmpCategory, getMicroStatus, getLPSEHierarchyScore } from '../../shared/utils/projectCalculations';
import ProjectPrintCard, { normalizeProjectType } from './ProjectPrintCard';
import PrintTimeSchedule from '../jadwal/PrintTimeSchedule';
import logoImg from '../../../LGIHT TRANSPARAN (1).PNG';
import logoSidamon from '../../assets/logo-sidamon.png';

export default function PrintExecutiveReport() {
    const {
        printData, setPrintData, computedProjects, calculatedResources, assignments, experts, darkMode
    } = useContext(AppContext);

    if (!printData) return null;

    let title = "Laporan Eksekutif Status Proyek & Penugasan Personil";
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let filteredProjects = [...computedProjects].filter(p => {
        if (p.notStarted) return false;
        if (p.computedStatus === 'Done') {
            if (p.completedAt) {
                const d = new Date(p.completedAt);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) return true;
            }
            return false;
        }
        return true;
    });
    let filteredResources = [...calculatedResources];

    if (printData.type === 'project') {
        filteredProjects = filteredProjects.filter(p => p.id === printData.id);
        title = `Laporan Rincian Proyek: ${filteredProjects[0]?.name}`;
        filteredResources = filteredResources.filter(r => (filteredProjects[0]?.team || []).some(m => fuzzyMatchName(m, r.name)));
    } else if (printData.type === 'personnel') {
        filteredResources = filteredResources.filter(r => r.name === printData.name);
        title = `Laporan Rekam Penugasan Personil: ${filteredResources[0]?.name}`;
        filteredProjects = filteredProjects.filter(p => ((p.team || []).some(m => fuzzyMatchName(m, filteredResources[0]?.name)) || fuzzyMatchName(p.teamLeader, filteredResources[0]?.name)) && !p.notStarted);
    } else if (printData.type === 'expert_assignment') {
        title = "Laporan Eksekutif Penugasan Tenaga Ahli";
    } else if (printData.type === 'custom') {
        if (printData.options.section === 'ProyekSaja') title = "Laporan Eksekutif Status Proyek";
        if (printData.options.section === 'PegawaiSaja') title = "Laporan Eksekutif Penugasan Personil";

        if (printData.options.projectType !== 'Semua') {
            title += ` (Tipe: ${printData.options.projectType})`;
            filteredProjects = filteredProjects.filter(p => {
                const pType = (p.type || '').toLowerCase();
                if (printData.options.projectType === 'Perencanaan') return pType.includes('perencana');
                if (printData.options.projectType === 'Pengawasan') return pType === 'pengawasan' || pType === 'supervisi';
                if (printData.options.projectType === 'Manajemen Konstruksi') return pType.includes('manajemen konstruksi') || pType === 'mk';
                return true;
            });
        }
    }

    // Sort proyek berdasarkan deadline
    filteredProjects.sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const dateB = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return dateA - dateB;
    });

    return (
        <div id="print-wrapper" className="fixed inset-0 z-[9999] bg-slate-200 overflow-y-auto w-full h-screen font-sans pb-20 print:static print:bg-white print:h-auto print:overflow-visible print:pb-0">
            {/* Control Bar for Print Preview */}
            <div className="sticky top-0 w-full bg-white shadow-md p-4 flex justify-between items-center z-[10000] print:hidden shrink-0 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Icon name="printer" size={20} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">Pratinjau Laporan</h2>
                        <p className="text-xs text-slate-500 font-medium">Klik Simpan PDF jika tampilan sudah sesuai.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setPrintData(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm text-sm flex items-center gap-2">Tutup Pratinjau</button>
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                        <Icon name="printer" size={16} /> Simpan PDF / Cetak
                    </button>
                </div>
            </div>

            {/* Page Wrapper */}
            <div className="bg-white shadow-xl mt-8 mx-auto print:mt-0 print:mx-0 print:shadow-none relative h-fit" style={{ width: '100%', maxWidth: '297mm', minHeight: '210mm', backgroundColor: '#fff' }}>
                <style type="text/css">
                    {`
                            @media print {
                                #main-ui-wrapper { display: none !important; }
                                #print-wrapper { position: static !important; }
                                @page { margin: 0; }
                                body {
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                    padding: 0; margin: 0;
                                    background: white !important;
                                }
                                .custom-print-footer {
                                    position: fixed;
                                    bottom: 8mm;
                                    left: 10mm;
                                    right: 10mm;
                                    display: flex;
                                    justify-content: space-between;
                                    font-size: 10px;
                                    color: #475569;
                                    font-style: italic;
                                    font-weight: 600;
                                    z-index: 1000;
                                }
                                @page landscapePage { size: landscape; margin: 10mm; }
                                .print-landscape { page: landscapePage; page-break-before: always; }
                            }
                            `}
                </style>
                <div className="custom-print-footer hidden print:flex">
                    <span>This Document Created By {printData.type === 'expert_assignment' ? 'Tim Administrasi Teknis' : 'Tim Teknis'} Gaharu Sempana Group</span>
                </div>

                <table style={{ width: '100%' }}>
                    <thead>
                        <tr><td style={{ height: '12mm' }}></td></tr>
                    </thead>
                    <tbody>
                        <tr><td className="px-10 pb-4">

                            <div className="border-b-4 border-slate-300 dark:border-slate-700 pb-4 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <img src={darkMode ? logoSidamon : logoImg} alt="Gaharu Sempana Group Logo" className="h-20 object-contain" />
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider">{title}</h1>
                                        <p className="text-sm mt-1 font-semibold">SIDAMON (Sistem Database Dan Monitoring)</p>
                                        <p className="text-sm">Gaharu Sempana Group</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-between h-20">
                                    <div className="flex justify-end">
                                        <p className="text-xs border-2 border-slate-300 dark:border-slate-700 px-2 py-1 uppercase font-black whitespace-nowrap">Dokumen Internal</p>
                                    </div>
                                    <div className="mt-auto text-right">
                                        <p className="text-sm font-semibold whitespace-nowrap">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-xs font-semibold text-slate-700 whitespace-nowrap mt-0.5">Pukul: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* BAGIAN 1: DAFTAR PROYEK */}
                            {(printData.type === 'all' || printData.type === 'project' || (printData.type === 'custom' && printData.options.section !== 'PegawaiSaja')) && (
                                <div className="mb-10" style={{ pageBreakAfter: (printData.type === 'all' || (printData.type === 'custom' && printData.options.section === 'Semua')) ? 'always' : 'auto' }}>
                                    <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-400 pb-2">Bagian A: Laporan Status Proyek</h2>
                                    {filteredProjects.length === 0 ? (
                                        <p className="text-sm italic">Tidak ada proyek aktif untuk kriteria ini.</p>
                                    ) : (
                                        <div className="space-y-8">
                                            {(printData.type === 'all' || printData.type === 'custom') ? (() => {
                                                const categoriesToRender = ((printData.type === 'custom' && printData.options.projectType !== 'Semua') ? [printData.options.projectType] : ['Perencanaan', 'Pengawasan', 'Manajemen Konstruksi']).map(kategoriTipe => {
                                                    return {
                                                        kategoriTipe,
                                                        proyeksInKategori: filteredProjects.filter(p => {
                                                            const pType = (p.type || '').toLowerCase();
                                                            if (kategoriTipe === 'Perencanaan') return pType.includes('perencana');
                                                            if (kategoriTipe === 'Pengawasan') return pType === 'pengawasan' || pType === 'supervisi';
                                                            if (kategoriTipe === 'Manajemen Konstruksi') return pType.includes('manajemen konstruksi') || pType === 'mk';
                                                            return false;
                                                        })
                                                    };
                                                }).filter(cat => cat.proyeksInKategori.length > 0);

                                                return categoriesToRender.map((catData, index) => (
                                                    <div key={catData.kategoriTipe} className="mb-6" style={{ pageBreakBefore: index === 0 ? 'auto' : 'always' }}>
                                                        <h3 className="text-md font-bold mb-3 uppercase bg-gray-200 border-t border-b border-slate-300 dark:border-slate-700 py-1 px-2">Sub Bab: {catData.kategoriTipe}</h3>
                                                        <div className="space-y-6">
                                                            {catData.proyeksInKategori.map(p => (
                                                                <div key={p.id}>
                                                                    <ProjectPrintCard project={p} />
                                                                    {printData.type === 'project' && p.type?.toLowerCase().includes('perencana') && <PrintTimeSchedule project={p} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })() : (
                                                <div className="space-y-6">
                                                    {filteredProjects.map(p => (
                                                        <div key={p.id}>
                                                            <ProjectPrintCard project={p} />
                                                            {printData.type === 'project' && p.type?.toLowerCase().includes('perencana') && <PrintTimeSchedule project={p} />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BAGIAN 2: DAFTAR PERSONIL */}
                            {(printData.type === 'all' || printData.type === 'personnel' || (printData.type === 'custom' && printData.options.section !== 'ProyekSaja')) && (
                                <div>
                                    <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-400 pb-2">Bagian B: Laporan Rincian Penugasan Pegawai</h2>
                                    {filteredResources.length === 0 ? (
                                        <p className="text-sm italic">Tidak ada personil untuk kriteria ini.</p>
                                    ) : (
                                        <div className="space-y-8">
                                            {(() => {
                                                const resourcesBySubTeam = {};
                                                filteredResources.forEach(res => {
                                                    const activeProjectsForRes = filteredProjects.filter(p => {
                                                        const inTeam = (p.team || []).some(m => fuzzyMatchName(m, res.name));
                                                        const isLeader = fuzzyMatchName(p.teamLeader, res.name);
                                                        const inSurveyor = (p.surveyorTeam || []).some(m => fuzzyMatchName(m, res.name));
                                                        return (inTeam || isLeader || inSurveyor) && !p.notStarted;
                                                    });
                                                    if (printData.type === 'custom' && printData.options.projectType !== 'Semua' && activeProjectsForRes.length === 0) return;

                                                    const subTeam = getCategoryFromRole(res.role);
                                                    if (!resourcesBySubTeam[subTeam]) resourcesBySubTeam[subTeam] = [];
                                                    resourcesBySubTeam[subTeam].push({ res, activeProjectsForRes });
                                                });

                                                const subTeamKeys = Object.keys(resourcesBySubTeam).sort();

                                                if (subTeamKeys.length === 0) {
                                                    return <p className="text-sm italic">Tidak ada personil yang terlibat di kriteria ini.</p>;
                                                }

                                                return subTeamKeys.map((subTeam, index) => (
                                                    <div key={subTeam} className="mb-6" style={{ pageBreakBefore: index === 0 ? 'auto' : 'always' }}>
                                                        <h3 className="text-md font-bold mb-3 uppercase bg-gray-200 border-t border-b border-slate-300 dark:border-slate-700 py-1 px-2">Sub Bab: Tim {subTeam}</h3>
                                                        <div className="space-y-6">
                                                            {[...resourcesBySubTeam[subTeam]].sort((a, b) => getLPSEHierarchyScore(a.res.role) - getLPSEHierarchyScore(b.res.role) || a.res.name.localeCompare(b.res.name)).map(({ res, activeProjectsForRes }) => (
                                                                <div key={res.id} className="border-2 border-slate-300 dark:border-slate-700 p-4" style={{ pageBreakInside: 'avoid' }}>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div>
                                                                            <h3 className="font-bold uppercase text-base">{res.name}</h3>
                                                                            {res.level && res.level.startsWith('Kordinator Divisi') ? (
                                                                                <div className="text-xs mt-0.5 text-slate-700">
                                                                                    <p className="font-bold">{res.level}</p>
                                                                                    <p>{res.role}</p>
                                                                                </div>
                                                                            ) : res.level === 'Team Leader' ? (
                                                                                <div className="text-xs mt-0.5 text-slate-700">
                                                                                    <p className="font-bold">Team Leader</p>
                                                                                    <p>{res.role}</p>
                                                                                </div>
                                                                            ) : res.level === 'PIC' ? (
                                                                                <div className="text-xs mt-0.5 text-slate-700">
                                                                                    <p className="font-bold">PIC</p>
                                                                                    <p>{res.role}</p>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs mt-0.5 text-slate-700">
                                                                                    {res.role}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs border border-slate-300 dark:border-slate-700 px-2 py-1 font-bold">
                                                                            {`${activeProjectsForRes.length} Proyek Aktif`}
                                                                        </span>
                                                                    </div>

                                                                    <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 mt-3">
                                                                        <thead>
                                                                            <tr className="bg-gray-100">
                                                                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[35%]">Nama Proyek</th>
                                                                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Peran/Tim Lapangan</th>
                                                                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[15%]">Man Month</th>
                                                                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Deadline Spesifik Tugas</th>
                                                                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[10%]">Status Lapangan</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {activeProjectsForRes.length === 0 ? (
                                                                                <tr><td colSpan="5" className="border border-slate-300 dark:border-slate-700 p-1.5 text-center italic">Sedang tidak memegang proyek aktif (Available).</td></tr>
                                                                            ) : (() => {
                                                                                const groupedProjects = {};
                                                                                activeProjectsForRes.forEach(p => {
                                                                                    const pType = normalizeProjectType(p.type);
                                                                                    if (!groupedProjects[pType]) groupedProjects[pType] = [];
                                                                                    groupedProjects[pType].push(p);
                                                                                });

                                                                                const typeKeys = Object.keys(groupedProjects).sort((a, b) => {
                                                                                    const order = { 'Perencanaan': 1, 'Pengawasan': 2, 'Manajemen Konstruksi': 3 };
                                                                                    return (order[a] || 99) - (order[b] || 99);
                                                                                });

                                                                                return typeKeys.map(pType => (
                                                                                    <React.Fragment key={pType}>
                                                                                        <tr>
                                                                                            <td colSpan="5" className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold bg-gray-200 text-[10px] uppercase">
                                                                                                {pType}
                                                                                            </td>
                                                                                        </tr>
                                                                                        {groupedProjects[pType].map(p => {
                                                                                            const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
                                                                                            let deadlineStr = '-';
                                                                                            let roleStr = '-';
                                                                                            let statusLapangan = '-';
                                                                                            let manMonthStr = '-';

                                                                                            if (fuzzyMatchName(p.teamLeader, res.name)) {
                                                                                                roleStr = 'Team Leader';
                                                                                                if (isPengawasan) {
                                                                                                    deadlineStr = p.deadline ? formatDateIndo(p.deadline) : '-';
                                                                                                    const detailsKey = Object.keys(p.pengawasanDetails || {}).find(k => fuzzyMatchName(k, res.name));
                                                                                                    const details = detailsKey ? p.pengawasanDetails[detailsKey] : {};
                                                                                                    statusLapangan = details.statusTurun || 'Tidak Turun';
                                                                                                    manMonthStr = details.manMonth || '-';
                                                                                                } else {
                                                                                                    statusLapangan = p.computedStatus || '-';

                                                                                                    // Kalkulasi Man Month Team Leader Perencanaan
                                                                                                    const cats = ['Arsitek', 'QS', 'Struktur', 'MEP', 'Tata Ruang', 'Surveyor', 'Lainnya'];
                                                                                                    let minDate = null;
                                                                                                    let maxDate = null;

                                                                                                    cats.forEach(cat => {
                                                                                                        const d = p.categoryDetails?.[cat];
                                                                                                        if (d) {
                                                                                                            const startDateSource = d.startDate ? d.startDate : p.spmk;
                                                                                                            if (startDateSource) {
                                                                                                                const sd = new Date(startDateSource);
                                                                                                                if (!minDate || sd < minDate) minDate = sd;
                                                                                                            }
                                                                                                            if (d.deadline) {
                                                                                                                const ed = new Date(d.deadline);
                                                                                                                if (!maxDate || ed > maxDate) maxDate = ed;
                                                                                                            }
                                                                                                        }
                                                                                                    });

                                                                                                    if (minDate && maxDate) {
                                                                                                        minDate.setHours(0, 0, 0, 0);
                                                                                                        maxDate.setHours(0, 0, 0, 0);
                                                                                                        const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                                                                                                        if (diffDays > 0) {
                                                                                                            manMonthStr = parseFloat((diffDays / 30).toFixed(1)).toString();
                                                                                                        }
                                                                                                    }

                                                                                                    deadlineStr = maxDate ? formatDateIndo(maxDate.toISOString().split('T')[0]) : (p.deadline ? formatDateIndo(p.deadline) : '-');
                                                                                                }
                                                                                            } else if (isPengawasan) {
                                                                                                const detailsKey = Object.keys(p.pengawasanDetails || {}).find(k => fuzzyMatchName(k, res.name));
                                                                                                const details = detailsKey ? p.pengawasanDetails[detailsKey] : {};
                                                                                                deadlineStr = details.deadline ? formatDateIndo(details.deadline) : '-';
                                                                                                roleStr = details.role || 'Inspector';
                                                                                                statusLapangan = details.statusTurun || 'Tidak Turun';
                                                                                                manMonthStr = details.manMonth || '-';
                                                                                            } else {
                                                                                                const effectiveCat = getEffectiveEmpCategory(p, res.name, res.role);
                                                                                                const details = p.categoryDetails?.[effectiveCat] || {};
                                                                                                deadlineStr = details.deadline ? formatDateIndo(details.deadline) : '-';
                                                                                                roleStr = effectiveCat === 'Surveyor' ? 'Tim Surveyor' : effectiveCat;

                                                                                                // Kalkulasi Man Month dari startDate ke deadline tim
                                                                                                const startDateSource = details.startDate ? details.startDate : p.spmk;
                                                                                                if (startDateSource && details.deadline) {
                                                                                                    const startD = new Date(startDateSource);
                                                                                                    const endD = new Date(details.deadline);
                                                                                                    startD.setHours(0, 0, 0, 0);
                                                                                                    endD.setHours(0, 0, 0, 0);
                                                                                                    const diffDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
                                                                                                    if (diffDays > 0) {
                                                                                                        manMonthStr = parseFloat((diffDays / 30).toFixed(1)).toString();
                                                                                                    }
                                                                                                }

                                                                                                // Status Lapangan diambil dari status sub tim
                                                                                                statusLapangan = getMicroStatus(details.progress || 0, details.deadline);
                                                                                            }

                                                                                            return (
                                                                                                <tr key={p.id}>
                                                                                                    <td className="border border-slate-300 dark:border-slate-700 p-1.5">{p.name}</td>
                                                                                                    <td className="border border-slate-300 dark:border-slate-700 p-1.5">{roleStr}</td>
                                                                                                    <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center">{manMonthStr}</td>
                                                                                                    <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-semibold">{deadlineStr}</td>
                                                                                                    <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-semibold">{statusLapangan}</td>
                                                                                                </tr>
                                                                                            )
                                                                                        })}
                                                                                    </React.Fragment>
                                                                                ));
                                                                            })()}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BAGIAN 3: DAFTAR PENUGASAN TENAGA AHLI */}
                            {(printData.type === 'expert_assignment') && (() => {
                                const activeAsg = assignments.filter(asg => {
                                    if (asg.endDate) {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const end = new Date(asg.endDate);
                                        end.setHours(0, 0, 0, 0);
                                        if (end < today) return false;
                                    }
                                    return true;
                                });

                                return (
                                    <div>
                                        <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-400 pb-2">Laporan Rekam Penugasan Tenaga Ahli</h2>
                                        {activeAsg.length === 0 ? (
                                            <p className="text-sm italic">Tidak ada penugasan tenaga ahli aktif yang terdaftar.</p>
                                        ) : (
                                            <div className="space-y-6">
                                                {activeAsg.map(asg => (
                                                    <div key={asg.id} className="border-2 border-slate-300 dark:border-slate-700 p-4" style={{ pageBreakInside: 'avoid' }}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div>
                                                                <h3 className="font-bold uppercase text-base">{asg.jobName}</h3>
                                                                <p className="text-xs uppercase mt-0.5 font-bold">{asg.tenderType} | {asg.lpseName}</p>
                                                                <p className="text-xs mt-0.5">Tipe Proyek & Kontrak: {asg.projectType || 'Pengawasan'} - {asg.contractType}</p>
                                                                <p className="text-xs mt-0.5">Perusahaan: <span className="font-bold">{asg.company || '-'}</span> | Nilai Kontrak: <span className="font-bold">Rp {asg.contractValue || '0'}</span></p>
                                                                <p className="text-xs mt-0.5">SPMK - Berakhir: {asg.startDate ? formatDateIndo(asg.startDate) : '-'} s/d {asg.endDate ? formatDateIndo(asg.endDate) : '-'} ({asg.duration || 0} Hari)</p>
                                                            </div>
                                                        </div>

                                                        <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 mt-3">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[35%]">Nama</th>
                                                                    <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[25%]">Sertifikat (SKA)</th>
                                                                    <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-center w-[15%]">Peran</th>
                                                                    <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-center w-[10%]">MM</th>
                                                                    <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-right w-[15%]">Billing Rate</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(asg.experts || []).length === 0 ? (
                                                                    <tr><td colSpan="5" className="border border-slate-300 dark:border-slate-700 p-1.5 text-center italic">Belum ada tenaga ahli.</td></tr>
                                                                ) : [...(asg.experts || [])].sort((a, b) => getLPSEHierarchyScore(a.role) - getLPSEHierarchyScore(b.role) || (experts.find(e => e.id === a.expertId)?.name || '').localeCompare(experts.find(e => e.id === b.expertId)?.name || '')).map((expPlot, idx) => {
                                                                    const exp = experts.find(e => e.id === expPlot.expertId);
                                                                    const expertName = exp ? exp.name : 'Unknown';
                                                                    const certObj = exp ? (exp.certificates || []).find(c => c.certName === expPlot.certificateName) : null;
                                                                    let certDisplay = certObj && certObj.certLevel ? `${expPlot.certificateName} (${certObj.certLevel})` : (expPlot.certificateName || '-');

                                                                    (expPlot.additionalCertificates || []).forEach(addCert => {
                                                                        if (!addCert) return;
                                                                        const cObj = exp ? (exp.certificates || []).find(c => c.certName === addCert) : null;
                                                                        const cDisplay = cObj && cObj.certLevel ? `${addCert} (${cObj.certLevel})` : addCert;
                                                                        if (certDisplay === '-') certDisplay = cDisplay;
                                                                        else certDisplay += ` & ${cDisplay}`;
                                                                    });

                                                                    return (
                                                                        <tr key={idx}>
                                                                            <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-semibold">{expertName}</td>
                                                                            <td className="border border-slate-300 dark:border-slate-700 p-1.5">{certDisplay}</td>
                                                                            <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center">{expPlot.role || '-'}</td>
                                                                            <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold">{expPlot.manMonth}</td>
                                                                            <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-right font-bold whitespace-nowrap">Rp {expPlot.billingRate ? expPlot.billingRate.toLocaleString('id-ID') : '0'}</td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* BAGIAN TANDA TANGAN */}
                            <div className="mt-16 pt-8 flex justify-between px-10 text-sm text-slate-800 dark:text-slate-200" style={{ pageBreakInside: 'avoid' }}>
                                <div className="text-center">
                                    <p className="mb-24">Diketahui Oleh,<br />{printData.type === 'expert_assignment' ? 'Manajer Administrasi' : 'Manajer Teknis'} Gaharu Sempana Group</p>
                                    <p className="font-bold underline decoration-black underline-offset-2">{printData.type === 'expert_assignment' ? 'Gusti Ayu Legong Aryaningsih, S.T., M.T.' : 'Ar. Ir. I Nyoman Adi Putra Wijaya, ST. IAI.'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-24">Disetujui Oleh,<br />CEO Gaharu Sempana Group</p>
                                    <p className="font-bold underline decoration-black underline-offset-2">Ir. Putu Andre Wicaksana Putra, S.T., M.Ars., IPP.</p>
                                </div>
                            </div>

                            {/* --- AKHIR KONTEN UTAMA --- */}
                        </td></tr>
                    </tbody>
                    <tfoot>
                        <tr><td style={{ height: '20mm' }}></td></tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
