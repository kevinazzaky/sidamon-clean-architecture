import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmployeeDetailPage from './EmployeeDetailPage';

export default function TimPage() {
    const {
        viewingEmployee, calculatedResources, searchTeamTab, setSearchTeamTab,
        canEditTeamAllocation, openModal, setViewingEmployee, handleDelete
    } = useContext(AppContext);

    if (viewingEmployee) return <EmployeeDetailPage />;

    const filteredResourcesTab = calculatedResources.filter(res =>
        res.name.toLowerCase().includes(searchTeamTab.toLowerCase()) ||
        res.role.toLowerCase().includes(searchTeamTab.toLowerCase()) ||
        (res.level && res.level.toLowerCase().includes(searchTeamTab.toLowerCase()))
    );

    return (
        <div className="space-y-6 fade-in">
            <ErrorBanner />
            <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-800/40">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Alokasi & Beban Kerja Tim</h3>
                        <p className="text-sm text-slate-500">Otomatis dihitung dari jumlah proyek yang mereka pegang (1 Proyek = 25% Beban).</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Icon name="search" size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama/Tim..."
                                className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:text-slate-200"
                                value={searchTeamTab}
                                onChange={(e) => setSearchTeamTab(e.target.value)}
                            />
                        </div>
                        {canEditTeamAllocation() && (
                            <button onClick={() => openModal('team', 'add')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
                                <Icon name="user-plus" size={16} /> Tambah
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-0 overflow-x-auto min-h-[400px]">
                    <table className="enterprise-table text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold whitespace-nowrap">Nama & Tim</th>
                                <th className="p-4 font-semibold whitespace-nowrap text-center">Total Proyek</th>
                                <th className="p-4 font-semibold whitespace-nowrap">Indikator Beban Kerja</th>
                                <th className="p-4 font-semibold whitespace-nowrap text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/50 dark:[&>tr:hover]:bg-slate-800/30">
                            {filteredResourcesTab.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">
                                        <Icon name="users" size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Pencarian tidak ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredResourcesTab.map((res) => {
                                    const isOverloaded = res.workload > 100;
                                    return (
                                        <tr key={res.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors group">
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{res.name}</p>
                                                {res.level && res.level.startsWith('Kordinator Divisi') ? (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        <p>{res.level}</p>
                                                        <p>{res.role}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {res.level === 'PIC' ? `PIC ${res.role}` : res.role}
                                                    </p>
                                                )}
                                                {res.level === 'Team Leader' && (
                                                    <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1"><Icon name="star" size={10} className="fill-amber-500" /> Team Leader</p>
                                                )}
                                            </td>
                                            <td className="p-4 text-center"><span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold whitespace-nowrap">{`${res.projects} Proyek Aktif`}</span></td>
                                            <td className="p-4 w-64">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className={`text-xs font-bold ${isOverloaded ? 'text-red-600' : 'text-blue-600'}`}>{res.workload}% Kapasitas Terpakai</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 flex overflow-hidden">
                                                    <div className={`h-full ${isOverloaded ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(res.workload, 100)}%` }}></div>
                                                    {isOverloaded && (<div className="h-full bg-red-800" style={{ width: `${res.workload - 100}%` }}></div>)}
                                                </div>
                                                {isOverloaded && <p className="text-[10px] text-red-500 mt-1 font-medium">Beban melampaui batas wajar</p>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {/* TOMBOL DETAIL BARU */}
                                                    <button onClick={() => setViewingEmployee(res)} className="px-2 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50 transition-colors">
                                                        <Icon name="folder-open" size={14} /> Rincian
                                                    </button>
                                                    <div className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex gap-2">
                                                        {canEditTeamAllocation() && (
                                                            <>
                                                                <button onClick={() => openModal('team', 'edit', res)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"><Icon name="edit" size={16} /></button>
                                                                <button onClick={() => handleDelete('team', res.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"><Icon name="trash" size={16} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
