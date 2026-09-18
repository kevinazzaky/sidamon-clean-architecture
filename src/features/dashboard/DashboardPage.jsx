import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import StatusBadge from '../../shared/components/StatusBadge';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { getCategoryFromRole } from '../../shared/utils/projectCalculations';

export default function DashboardPage() {
    const {
        computedProjects, resources, currentUser, username, userRole, setShowProjectTypeModal,
        setActiveTab, completedProjectsCount, atRiskProjectsCount, lateProjectsCount,
        experts, assignments, inventory, calculatedResources
    } = useContext(AppContext);

    const statusPriority = { "Terlambat": 1, "Beresiko": 2, "On Progress": 3, "Done": 4 };
    const sortedProjectsForDashboard = [...computedProjects].sort((a, b) =>
        statusPriority[a.computedStatus] - statusPriority[b.computedStatus]
    );
    // Menghitung Distribusi Sub-Tim
    const subTeamCounts = {};
    resources.forEach(r => {
        const cat = getCategoryFromRole(r.role);
        subTeamCounts[cat] = (subTeamCounts[cat] || 0) + 1;
    });

    // Urutkan dan ambil top 4, sisanya masuk 'Lainnya'
    const sortedSubTeams = Object.entries(subTeamCounts).sort((a, b) => b[1] - a[1]);
    const topSubTeams = sortedSubTeams.slice(0, 4);
    const otherSubTeamsCount = sortedSubTeams.slice(4).reduce((sum, [_, count]) => sum + count, 0);

    if (otherSubTeamsCount > 0) {
        topSubTeams.push(['Lainnya', otherSubTeamsCount]);
    }

    const totalSubTeamMembers = resources.length || 1;
    const badgeColors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-slate-400'];
    const hexColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#94a3b8'];

    let currentAngle = 0;
    const conicStops = topSubTeams.map(([_name, count], i) => {
        const angle = (count / totalSubTeamMembers) * 100;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return `${hexColors[i]} ${start}% ${end}%`;
    }).join(', ');

    return (
        <div className="space-y-8 fade-in">
            <ErrorBanner />

            {/* WELCOME CARD */}
            {currentUser && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900/80 dark:to-indigo-900/80 rounded-3xl p-6 lg:p-8 shadow-xl shadow-blue-200/50 dark:shadow-none text-white relative overflow-hidden flex items-center justify-between mb-2 scale-in-center">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none">
                        <Icon name="sun" size={160} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl lg:text-3xl font-black mb-2 tracking-tight">Selamat Datang, {username || currentUser.displayName || currentUser.email.split('@')[0]}! 👋</h2>
                        <p className="text-blue-100 font-medium text-sm lg:text-base">SIDAMON Gaharu Sempana Group, Anda masuk sebagai <span className="px-3 py-1 bg-white/20 rounded-full ml-1 font-bold text-[10px] lg:text-xs uppercase tracking-wider">{userRole}</span></p>
                    </div>
                    <div className="hidden lg:block relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Icon name="user" size={32} />
                        </div>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
                {/* BENTO CELL 1: Total Proyek (Hero) */}
                <div
                    onClick={() => setShowProjectTypeModal(true)}
                    className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-900 rounded-3xl p-6 lg:p-8 shadow-xl shadow-indigo-200/50 dark:shadow-none text-white relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between group"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <Icon name="briefcase" size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 font-medium mb-1 lg:mb-2 text-sm lg:text-base">Total Keseluruhan</p>
                        <h3 className="text-5xl lg:text-7xl font-black">{computedProjects.length}</h3>
                        <p className="text-lg lg:text-2xl font-bold mt-2">Proyek Terdaftar</p>
                    </div>
                    <div className="relative z-10 mt-8 inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full backdrop-blur-md w-max">
                        <Icon name="folder-open" size={16} /> Lihat Detail Tipe
                    </div>
                </div>

                {/* BENTO CELL 2: Proyek Aktif & Selesai */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] flex gap-4 divide-x divide-slate-100 dark:divide-slate-700 transition-colors">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Icon name="target" size={16} />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aktif</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{computedProjects.length - completedProjectsCount}</p>
                        <p className="text-xs text-slate-500 mt-1">Sedang berjalan</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center pl-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Icon name="check-circle-2" size={16} />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Selesai</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{completedProjectsCount}</p>
                        <p className="text-xs text-slate-500 mt-1">Status Done</p>
                    </div>
                </div>
                {/* BENTO CELL 3: Distribusi Sub-Tim Pie Chart */}
                <div
                    onClick={() => setActiveTab('tim')}
                    className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 glass-card rounded-[2rem] p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Distribusi Sub-Tim</h3>
                            <p className="text-xs text-slate-500 mt-1">{resources.length} Personil Aktif</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Icon name="pie-chart" size={20} /></div>
                    </div>
                    <div className="flex flex-col items-center flex-1 justify-center relative z-10 gap-4 mt-2">
                        {resources.length > 0 ? (
                            <div className="flex items-center gap-6 w-full justify-center">
                                <div
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0 shadow-inner relative flex items-center justify-center"
                                    style={{ background: `conic-gradient(${conicStops})` }}
                                >
                                    {/* Hole for donut chart effect */}
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400">Total</span>
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{resources.length}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 max-w-[120px]">
                                    {topSubTeams.map(([name, count], i) => (
                                        <div key={name} className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${badgeColors[i]}`}></div>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate" title={name}>{name}</span>
                                            <span className="text-[10px] text-slate-500 ml-auto">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada personil</p>
                        )}
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-slate-200 dark:border-amber-800/50 p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-amber-800 dark:text-amber-400 font-semibold mb-1 text-sm">Perlu Pantauan</p>
                        <h3 className="text-amber-900 dark:text-amber-100 text-3xl font-bold flex items-baseline gap-2">
                            {atRiskProjectsCount} <span className="text-lg font-medium">Beresiko</span>
                        </h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-200/50 dark:bg-amber-800/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                        <Icon name="alert-triangle" size={28} />
                    </div>
                </div>

                {/* BENTO CELL 5: Tenaga Ahli & Penugasan */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 flex gap-4">
                    <div onClick={() => setActiveTab('ahli')} className="flex-1 bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 p-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-center items-center text-center">
                        <div className="text-blue-600 dark:text-blue-400 mb-2"><Icon name="award" size={28} /></div>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{experts.length}</h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">Tenaga Ahli</p>
                    </div>
                    <div onClick={() => setActiveTab('penugasan')} className="flex-1 bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 p-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-center items-center text-center">
                        <div className="text-indigo-600 dark:text-indigo-400 mb-2"><Icon name="file-text" size={28} /></div>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{assignments.length}</h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">Penugasan</p>
                    </div>
                </div>

                {/* BENTO CELL 6: Terlambat */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-slate-200 dark:border-red-800/50 p-5 shadow-sm flex items-center justify-between hover:border-red-300 dark:hover:border-red-700/80 transition-colors">
                    <div>
                        <p className="text-red-800 dark:text-red-400 font-semibold mb-1 text-sm">Status Kritis</p>
                        <h3 className="text-red-900 dark:text-red-100 text-3xl font-bold flex items-baseline gap-2">
                            {lateProjectsCount} <span className="text-lg font-medium">Terlambat</span>
                        </h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-red-200/50 dark:bg-red-800/50 flex items-center justify-center text-red-700 dark:text-red-300">
                        <Icon name="alert-triangle" size={28} />
                    </div>
                </div>

                {/* BENTO CELL 7: Logistik & Inventaris */}
                <div onClick={() => setActiveTab('inventaris')} className="col-span-1 md:col-span-2 lg:col-span-2 bg-blue-900 dark:bg-blue-950 rounded-3xl p-6 shadow-xl shadow-blue-900/20 dark:shadow-none text-white cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-2 translate-y-2 group-hover:rotate-12 transition-transform duration-500">
                        <Icon name="box" size={100} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-4xl font-bold mb-1">{inventory.length}</h4>
                        <p className="text-sm font-medium text-blue-100">Item Logistik</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-blue-700 flex items-center justify-center relative z-10 group-hover:bg-blue-800 transition-colors">
                        <Icon name="chevron-right" size={18} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Status Proyek Berjalan</h3>
                        <button onClick={() => setActiveTab('proyek')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Lihat Semua</button>
                    </div>
                    <div className="p-0 overflow-x-auto min-h-[200px]">
                        {sortedProjectsForDashboard.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Icon name="folder-open" size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Belum ada data proyek di Google Sheets.</p>
                            </div>
                        ) : (
                            <table className="enterprise-table text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Nama Proyek</th>
                                        <th className="p-4 font-semibold">Progress</th>
                                        <th className="p-4 font-semibold">Status Makro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                                    {/* Menggunakan sortedProjectsForDashboard untuk di-*slice* dan dirender */}
                                    {sortedProjectsForDashboard.slice(0, 5).map((project) => (
                                        <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{project.name}</p>
                                                <p className="text-xs text-slate-500">{project.client}</p>
                                                {project.description && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">📝 {project.description}</p>}
                                            </td>
                                            <td className="p-4 w-48">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium">{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div className={`h-2 rounded-full ${project.computedStatus === 'Terlambat' ? 'bg-red-500' : project.computedStatus === 'Done' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${project.progress}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="p-4"><StatusBadge status={project.computedStatus} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Beban Kerja Tim</h3>
                        <button onClick={() => setActiveTab('tim')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Lihat Full</button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">Beban dihitung otomatis dari penugasan.</p>
                    <div className="space-y-5 flex-1 min-h-[150px]">
                        {calculatedResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Icon name="users" size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Belum ada data tim.</p>
                            </div>
                        ) : (
                            calculatedResources.slice(0, 5).map((res) => {
                                const isOverloaded = res.workload > 100;
                                const isOptimal = res.workload >= 70 && res.workload <= 100;
                                return (
                                    <div key={res.id}>
                                        <div className="flex justify-between items-end mb-1">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{res.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{res.projects} Proyek Berjalan</p>
                                            </div>
                                            <span className={`text-xs font-bold ${isOverloaded ? 'text-red-600' : isOptimal ? 'text-emerald-600' : 'text-blue-600'}`}>{res.workload}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2.5 flex overflow-hidden">
                                            <div className={`h-full ${isOverloaded ? 'bg-red-500' : isOptimal ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(res.workload, 100)}%` }}></div>
                                            {isOverloaded && (<div className="h-full bg-red-800" style={{ width: `${res.workload - 100}%` }}></div>)}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
