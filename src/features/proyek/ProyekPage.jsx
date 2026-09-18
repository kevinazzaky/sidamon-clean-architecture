import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import StatusBadge from '../../shared/components/StatusBadge';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { formatDateIndo, formatDateTimeIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getCategoryFromRole, getMicroStatus } from '../../shared/utils/projectCalculations';

export default function ProyekPage() {
    const {
        computedProjects, searchProjectTab, setSearchProjectTab, filterProjectType, setFilterProjectType,
        projectPage, setProjectPage, canCreateProject, openModal, resources, userRole,
        handleAnalyzeDomino, setActiveScheduleProject, setActiveTab, canEditProjectTechnical,
        handleResumeProject, setPendingProjectData, setShowPendingModal, handleToggleNotStarted,
        setPrintZoomProject, setPrintData, setAlertModal, handleDelete
    } = useContext(AppContext);

    const projectsPerPage = 5;

    const getProjectSortScore = (p) => {
        // 6. Proyek yang sudah selesai (Perencanaan dan Pengawasan)
        if (p.computedStatus === "Done" || p.status === "Done" || p.progress >= 100) return 60;

        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');

        // 5. Data proyek pengawasan (Running)
        if (isPengawasan) return 50;

        // Proyek Perencanaan (Running)
        // 1. Terlambat dari waktu kontrak
        if (p.computedStatus === "Terlambat") return 10;

        // Calculate sub-team statuses
        let hasMicroTerlambat = false;
        let hasMicroBeresiko = false;

        if (p.categoryDetails) {
            Object.values(p.categoryDetails).forEach(cat => {
                const microStatus = getMicroStatus(cat.progress || 0, cat.deadline);
                if (microStatus === "Terlambat") hasMicroTerlambat = true;
                if (microStatus === "Beresiko") hasMicroBeresiko = true;
            });
        }

        // 2. Macro aman, tapi sub tim banyak yang terlambat
        if (hasMicroTerlambat) return 20;

        // 3. Macro aman, sub tim beresiko
        if (hasMicroBeresiko) return 30;

        // 4. Macro aman, sub tim aman
        return 40;
    };

    const filteredAndSortedProjects = (computedProjects || [])
        .filter(p => {
            if (!p) return false;
            const searchLower = (searchProjectTab || '').toLowerCase();
            const matchesSearch = 
                (p.name && p.name.toLowerCase().includes(searchLower)) ||
                (p.client && p.client.toLowerCase().includes(searchLower)) ||
                (p.id && String(p.id).toLowerCase().includes(searchLower)) ||
                (p.teamLeader && p.teamLeader.toLowerCase().includes(searchLower)) ||
                (p.team && Array.isArray(p.team) && p.team.some(member => member && member.toLowerCase().includes(searchLower))) ||
                (p.surveyorTeam && Array.isArray(p.surveyorTeam) && p.surveyorTeam.some(member => member && member.toLowerCase().includes(searchLower)));

            let matchesType = true;
            if (filterProjectType && filterProjectType !== 'Semua Tipe') {
                if (filterProjectType === 'Perencanaan') {
                    matchesType = p.type ? p.type.toLowerCase().includes('perencana') : false;
                } else if (filterProjectType === 'Pengawasan') {
                    matchesType = p.type ? p.type.toLowerCase().includes('pengawas') : false;
                } else if (filterProjectType === 'Manajemen Konstruksi') {
                    matchesType = p.type ? p.type.toLowerCase().includes('manajemen konstruksi') : false;
                } else {
                    matchesType = p.type === filterProjectType;
                }
            }
            return matchesSearch && matchesType;
        })
        .sort((a, b) => getProjectSortScore(a) - getProjectSortScore(b));

    const totalPages = Math.ceil(filteredAndSortedProjects.length / projectsPerPage);
    const currentProjects = filteredAndSortedProjects.slice(
        (projectPage - 1) * projectsPerPage,
        projectPage * projectsPerPage
    );

    return (
        <div className="space-y-6 fade-in">
            <ErrorBanner />
            <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daftar List Proyek</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola proyek dan tentukan penugasan timnya di sini.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Icon name="search" size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari proyek/klien..."
                                className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500"
                                value={searchProjectTab}
                                onChange={(e) => {
                                    setSearchProjectTab(e.target.value);
                                    setProjectPage(1);
                                }}
                            />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none w-full md:w-48 pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                                value={filterProjectType}
                                onChange={(e) => {
                                    setFilterProjectType(e.target.value);
                                    setProjectPage(1);
                                }}
                            >
                                <option value="Semua Tipe">Semua Tipe</option>
                                <option value="Perencanaan">Perencanaan</option>
                                <option value="Pengawasan">Pengawasan</option>
                                <option value="Manajemen Konstruksi">Manajemen Konstruksi</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Icon name="filter" size={14} />
                            </div>
                        </div>
                        {canCreateProject() && (
                            <button onClick={() => openModal('project', 'add')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
                                <Icon name="plus" size={16} /> Tambah
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-0 overflow-x-auto min-h-[400px]">
                    <table className="enterprise-table text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold min-w-[200px]">Nama Proyek & Klien</th>
                                <th className="p-4 font-semibold min-w-[120px]">Target Makro</th>
                                <th className="p-4 font-semibold min-w-[300px]">Rincian & Target Sub-Tim</th>
                                <th className="p-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {filteredAndSortedProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">
                                        <Icon name="folder-open" size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Pencarian tidak ditemukan atau data kosong.</p>
                                    </td>
                                </tr>
                            ) : (
                                currentProjects.map((p) => {
                                    const teamGroups = {
                                        Arsitek: [], QS: [], Struktur: [], MEP: [], 'Tata Ruang': [], Surveyor: [], Lainnya: []
                                    };
                                    const isPerencanaan = p.type?.toLowerCase().includes('perencana');
                                    const surveyorList = p.surveyorTeam || [];

                                    if (p.team && p.team.length > 0) {
                                        p.team.forEach(teamMemberName => {
                                            if (isPerencanaan && surveyorList.includes(teamMemberName)) {
                                                if (!teamGroups.Surveyor.includes(teamMemberName)) {
                                                    teamGroups.Surveyor.push(teamMemberName);
                                                }
                                                return; // Memastikan mereka tidak muncul di sub-tim aslinya (hide from default category)
                                            }

                                            const resInfo = resources.find(r => fuzzyMatchName(r.name, teamMemberName));
                                            if (resInfo) {
                                                const cat = getCategoryFromRole(resInfo.role);
                                                if (teamGroups[cat]) teamGroups[cat].push(resInfo.name);
                                            } else {
                                                teamGroups.Lainnya.push(teamMemberName);
                                            }
                                        });
                                    }

                                    const renderSubTeamProgress = (title, members) => {
                                        if (members.length === 0) return null;

                                        const details = p.categoryDetails?.[title] || {};
                                        const progress = details.progress || 0;
                                        const deadline = formatDateIndo(details.deadline);

                                        const teamWarning = getMicroStatus(progress, details.deadline);

                                        return (
                                            <div className="mb-3 last:mb-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 p-2.5 rounded-xl shadow-md shadow-slate-200/40 dark:shadow-none hover:-translate-y-0.5 transition-transform duration-300">
                                                <div className="flex justify-between items-center text-[11px] mb-1.5 border-b border-slate-100 dark:border-slate-700/50 pb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{title}</span>
                                                        {teamWarning && teamWarning !== 'On Progress' && teamWarning !== 'Done' && teamWarning !== 'Belum Diatur' && (
                                                            <span title="Berdasarkan Deadline Sub-Tim" className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${teamWarning === 'Terlambat' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                <Icon name={teamWarning === 'Terlambat' ? 'alert-triangle' : 'clock'} size={10} />
                                                                {teamWarning}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-slate-500 font-medium flex items-center gap-1">
                                                        <Icon name="calendar-clock" size={10} />
                                                        {details.deadline ? deadline : 'Belum diatur'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {members.map((name, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-600">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 flex overflow-hidden">
                                                        <div className={`${progress >= 100 ? 'bg-emerald-500' : teamWarning === 'Terlambat' ? 'bg-red-500' : 'bg-blue-500'} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold w-8 text-right ${progress >= 100 ? 'text-emerald-700' : teamWarning === 'Terlambat' ? 'text-red-600' : 'text-blue-700'}`}>{progress}%</span>
                                                </div>
                                            </div>
                                        );
                                    };

                                    return (
                                        <tr key={p.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors group align-top">
                                            <td className="p-4 pt-5">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{p.name}</p>
                                                    {p.notStarted && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold tracking-wider dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">BELUM MULAI</span>
                                                    )}
                                                    {p.isPending && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded text-[10px] font-bold tracking-wider">PENDING</span>
                                                    )}
                                                    {p.sourceAssignmentId && (
                                                        <span title="Proyek ini dikelola dari menu Penugasan Tenaga Ahli" className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded text-[10px] font-bold tracking-wider">
                                                            <Icon name="link" size={10} /> Sync
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mb-2">{p.client}</p>
                                                {p.isPending && (
                                                    <div className="mb-3 bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-2.5">
                                                        <div className="flex items-center gap-1.5 mb-1 text-orange-600 dark:text-orange-400">
                                                            <Icon name="alert-triangle" size={12} />
                                                            <span className="text-[11px] font-bold">Proyek Sedang Pending</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mb-1">"{p.pendingReason}"</p>
                                                        {p.pendingDate && (
                                                            <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-1.5 pt-1.5 border-t border-orange-100 dark:border-orange-900/50">
                                                                <Icon name="clock" size={10} />
                                                                Sejak: {p.pendingDate}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${p.type?.toLowerCase().includes('perencana') ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                                                        {p.type?.toLowerCase().includes('perencana') ? 'Perencanaan' : p.type?.toLowerCase().includes('pengawas') ? 'Pengawasan' : p.type}
                                                    </span>
                                                    {p.type?.toLowerCase().includes('perencana') && p.divisiKontrol && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            {p.divisiKontrol}
                                                        </span>
                                                    )}
                                                </div>
                                                {p.teamLeader && (
                                                    <div className="mb-2">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                                            <Icon name="star" size={12} className="fill-amber-500" />
                                                            Team Leader: {p.teamLeader}
                                                        </span>
                                                    </div>
                                                )}
                                                {p.description ? (
                                                    <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 px-2 py-1.5 leading-relaxed whitespace-pre-wrap"><span className="text-blue-400 mr-1">📝</span>{p.description}</p>
                                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 px-2 pb-1.5 pt-1 mt-1 border-t border-blue-50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 font-medium">Terakhir diupdate: {p.descriptionUpdatedAt ? formatDateTimeIndo(p.descriptionUpdatedAt) : '-'}</p>
                                                    </div>
                                                ) : <p className="text-[11px] text-slate-400 italic">Belum ada deskripsi update</p>}
                                            </td>
                                            <td className="p-4 pt-5">
                                                <div className="bg-white/60 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 rounded-xl p-3 shadow-sm">
                                                    <div className="mb-3 border-b border-slate-200 dark:border-slate-700/50 pb-3">
                                                        <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Tgl SPMK Proyek</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.spmk ? formatDateIndo(p.spmk) : 'Belum diatur'}</p>
                                                    </div>
                                                    <div className="mb-3">
                                                        <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Tenggat Waktu Kontrak</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatDateIndo(p.deadline)}</p>
                                                    </div>
                                                    {!(p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi')) && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                                                <span className="truncate">Progress</span>
                                                                <span className="shrink-0">{p.progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                                <div className={`h-2 rounded-full ${p.computedStatus === 'Terlambat' ? 'bg-red-500' : p.computedStatus === 'Done' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${p.progress}%` }}></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <StatusBadge status={p.computedStatus} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {(!p.team || p.team.length === 0) ? (
                                                    <div className="flex flex-col items-center justify-center h-24 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white/40 dark:bg-slate-900/50">
                                                        <p className="text-xs italic">Belum ada tim dialokasikan</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-0 text-xs bg-white/40 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 p-2 rounded-2xl shadow-inner shadow-slate-100/50 dark:shadow-none">
                                                        {p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi') ? (
                                                            <div className="space-y-3 mt-1">
                                                                {[...new Set(p.team.map(m => p.pengawasanDetails?.[m]?.role || 'Inspector'))].sort((a, b) => {
                                                                    const getW = r => {
                                                                        const rl = r.toLowerCase();
                                                                        if (rl.includes('team leader')) return 1;
                                                                        if (rl.includes('ahli')) return 2;
                                                                        if (rl.includes('inspector') || rl.includes('pengawas')) return 3;
                                                                        if (rl.includes('quantity') || rl.includes('estimator') || rl.includes('qs')) return 4;
                                                                        if (rl.includes('laboratory') || rl.includes('surveyor') || rl.includes('drafter')) return 5;
                                                                        if (rl.includes('k3')) return 6;
                                                                        if (rl.includes('admin')) return 7;
                                                                        return 8;
                                                                    };
                                                                    const wa = getW(a), wb = getW(b);
                                                                    return wa !== wb ? wa - wb : a.localeCompare(b);
                                                                }).map(role => {
                                                                    const roleMembers = p.team.filter(m => (p.pengawasanDetails?.[m]?.role || 'Inspector') === role);
                                                                    if (roleMembers.length === 0) return null;
                                                                    return (
                                                                        <div key={role} className="flex flex-col mb-3 last:mb-0">
                                                                            <div className="flex justify-between items-center mb-1.5">
                                                                                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">{role}</span>
                                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">{roleMembers.length} Personil</span>
                                                                            </div>
                                                                            <div className="space-y-3 pl-2 border-l-2 border-emerald-100 dark:border-emerald-800/50">
                                                                                {roleMembers.map(m => {
                                                                                    const detail = p.pengawasanDetails?.[m] || {};
                                                                                    const isAutoDone = detail.deadline && detail.deadline < new Date().toISOString().split('T')[0];
                                                                                    const isIndividuallyDone = p.individualStatus?.[m] || isAutoDone;

                                                                                    return (
                                                                                        <div key={m} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                                                                            <div className="flex justify-between items-start">
                                                                                                <span className={`text-[11px] font-semibold ${isIndividuallyDone ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{m}</span>
                                                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${detail.statusTurun === 'Turun' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                                                    {detail.statusTurun || 'Tidak Turun'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-500">
                                                                                                <span className="flex items-center gap-1">
                                                                                                    <Icon name="clock" size={10} className="text-slate-400" />
                                                                                                    {detail.manMonth ? `${detail.manMonth} Bulan` : '-'}
                                                                                                </span>
                                                                                            </div>

                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {renderSubTeamProgress("Arsitek", teamGroups.Arsitek)}
                                                                {renderSubTeamProgress("Surveyor", teamGroups.Surveyor)}
                                                                {renderSubTeamProgress("QS", teamGroups.QS)}
                                                                {renderSubTeamProgress("Struktur", teamGroups.Struktur)}
                                                                {renderSubTeamProgress("MEP", teamGroups.MEP)}
                                                                {renderSubTeamProgress("Tata Ruang", teamGroups['Tata Ruang'])}
                                                                {renderSubTeamProgress("Lainnya", teamGroups.Lainnya)}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right lg:opacity-0 lg:group-hover:opacity-100 transition-opacity pt-5">
                                                {userRole !== 'Admin Tender' && (
                                                    <div className="flex justify-end gap-2 flex-col items-end">
                                                        {p.computedStatus === 'Terlambat' && (
                                                            <button onClick={() => handleAnalyzeDomino(p)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 rounded-lg shadow-md animate-pulse hover:animate-none"><Icon name="alert-triangle" size={14} /> Cek Domino</button>
                                                        )}

                                                        {p.type?.toLowerCase().includes('perencana') && (
                                                            <button onClick={() => { setActiveScheduleProject(p); setActiveTab('schedule'); }} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800/50"><Icon name="calendar" size={14} /> Time Schedule</button>
                                                        )}

                                                        {canEditProjectTechnical() && !(p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi')) && (
                                                            p.isPending ? (
                                                                <button onClick={() => handleResumeProject(p)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg border border-orange-200 dark:border-orange-800/50"><Icon name="play" size={14} /> Resume Proyek</button>
                                                            ) : (
                                                                <button onClick={() => {
                                                                    setPendingProjectData(p); setShowPendingModal(true);
                                                                }} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600"><Icon name="pause" size={14} /> Set Pending</button>
                                                            )
                                                        )}

                                                        {p.type?.toLowerCase().includes('pengawas') && (
                                                            <button onClick={() => handleToggleNotStarted(p.id, !p.notStarted)} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border ${p.notStarted ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800/50 dark:hover:bg-amber-900/50' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                                                                <Icon name={p.notStarted ? "play" : "pause"} size={14} /> {p.notStarted ? 'Mulai Proyek' : 'Belum Mulai'}
                                                            </button>
                                                        )}

                                                        <button onClick={() => {
                                                            if (p.type?.toLowerCase().includes('perencana')) {
                                                                setPrintZoomProject(p);
                                                            } else {
                                                                setPrintData({ type: 'project', id: p.id });
                                                            }
                                                        }} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800/50"><Icon name="printer" size={14} /> Cetak PDF</button>
                                                        {canEditProjectTechnical() &&
                                                            !(
                                                                (p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi')) &&
                                                                ['Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan'].includes(userRole)
                                                            ) && (
                                                                <>
                                                                    <button onClick={() => openModal('project', 'edit', p)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800/50"><Icon name="edit" size={14} /> Edit Data</button>
                                                                    {p.sourceAssignmentId ? (
                                                                        <button onClick={() => setAlertModal({ isOpen: true, title: 'Proyek Tersinkronisasi', message: 'Proyek ini dikelola secara otomatis dari menu Penugasan Tenaga Ahli.\n\nUntuk menghapus proyek ini, silakan hapus data penugasan terkait dari menu Penugasan Tenaga Ahli.' })} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-600 cursor-not-allowed"><Icon name="trash" size={14} /> Hapus</button>
                                                                    ) : (
                                                                        <button onClick={() => handleDelete('project', p.id)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800/50"><Icon name="trash" size={14} /> Hapus</button>
                                                                    )}
                                                                </>
                                                            )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 sm:px-6">
                        <div className="flex justify-between flex-1 sm:hidden">
                            <button onClick={() => setProjectPage(Math.max(1, projectPage - 1))} disabled={projectPage === 1} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">Sebelumnya</button>
                            <button onClick={() => setProjectPage(Math.min(totalPages, projectPage + 1))} disabled={projectPage === totalPages} className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">Selanjutnya</button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Menampilkan <span className="font-semibold text-slate-800 dark:text-slate-200">{(projectPage - 1) * projectsPerPage + 1}</span> hingga <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(projectPage * projectsPerPage, filteredAndSortedProjects.length)}</span> dari <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredAndSortedProjects.length}</span> proyek
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button onClick={() => setProjectPage(Math.max(1, projectPage - 1))} disabled={projectPage === 1} className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                        <span className="sr-only">Previous</span>
                                        &larr;
                                    </button>
                                    {(() => {
                                        let pages = [];
                                        if (totalPages <= 7) {
                                            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                                        } else {
                                            if (projectPage <= 4) {
                                                pages = [1, 2, 3, 4, 5, '...', totalPages];
                                            } else if (projectPage >= totalPages - 3) {
                                                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                            } else {
                                                pages = [1, '...', projectPage - 1, projectPage, projectPage + 1, '...', totalPages];
                                            }
                                        }
                                        return pages.map((num, idx) => (
                                            num === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">...</span>
                                            ) : (
                                                <button key={num} onClick={() => setProjectPage(num)} className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-semibold ${projectPage === num ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500/50 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                    {num}
                                                </button>
                                            )
                                        ));
                                    })()}
                                    <button onClick={() => setProjectPage(Math.min(totalPages, projectPage + 1))} disabled={projectPage === totalPages} className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
                                        <span className="sr-only">Next</span>
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
