import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import * as userService from '../../services/userService';

export default function RoleManagerModal() {
    const { showRoleManager, setShowRoleManager, roleList, setRoleList } = useContext(AppContext);

    if (!showRoleManager) return null;
    return (
        <div className="fixed inset-0 z-[60000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRoleManager(false)}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden fade-in border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Icon name="briefcase" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kelola Daftar Jabatan</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Atur daftar pilihan jabatan untuk setiap tipe proyek</p>
                        </div>
                    </div>
                    <button onClick={() => setShowRoleManager(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <Icon name="x" size={20} className="text-slate-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {['Perencanaan', 'Pengawasan'].map(type => (
                        <div key={type} className="mb-8 last:mb-0">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                                Jabatan Proyek {type}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(roleList?.[type] || []).map((r, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                                        <span>{r}</span>
                                        <button onClick={() => {
                                            const updated = {
                                                ...roleList,
                                                [type]: (roleList?.[type] || []).filter((_, idx) => idx !== i)
                                            };
                                            setRoleList(updated);
                                            userService.saveRoleList(updated);
                                        }} className="text-red-500 hover:text-red-600 ml-1">
                                            <Icon name="x" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const val = e.target.newRole.value.trim();
                                const currentRoles = roleList?.[type] || [];
                                if (val && !currentRoles.includes(val)) {
                                    const updated = {
                                        ...roleList,
                                        [type]: [...currentRoles, val]
                                    };
                                    setRoleList(updated);
                                    userService.saveRoleList(updated);
                                }
                                e.target.reset();
                            }} className="flex gap-2">
                                <input name="newRole" type="text" placeholder={"Tambah jabatan " + type + "..."} className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                                <button type="submit" className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors">Tambah</button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
