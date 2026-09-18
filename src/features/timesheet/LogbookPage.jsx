import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateTimeIndo } from '../../shared/utils/dateHelpers';

export default function LogbookPage() {
    const { activityLogs } = useContext(AppContext);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Icon name="activity" size={24} />
                        </div>
                        Logbook Aktivitas Sistem
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 pl-2">Jejak audit otomatis aktivitas user (Hanya Super Admin, Auto-delete &gt;30 hari)</p>
                </div>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-white/40 dark:border-slate-800/60 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400">
                                <th className="p-4 font-bold text-sm rounded-tl-xl whitespace-nowrap">WAKTU</th>
                                <th className="p-4 font-bold text-sm whitespace-nowrap">USER</th>
                                <th className="p-4 font-bold text-sm whitespace-nowrap">MODUL</th>
                                <th className="p-4 font-bold text-sm whitespace-nowrap">AKSI</th>
                                <th className="p-4 font-bold text-sm rounded-tr-xl w-full">DETAIL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                            {(activityLogs || []).length > 0 ? (activityLogs || []).map((log) => {
                                let actionColor = 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800';
                                if (log.action === 'LOGIN' || log.action === 'LOGOUT') actionColor = 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30';
                                else if (log.action === 'ADD') actionColor = 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30';
                                else if (log.action === 'EDIT') actionColor = 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30';
                                else if (log.action === 'DELETE') actionColor = 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTimeIndo(log.timestamp)}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{log.username || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{log.role || '-'}</div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{log.menu}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${actionColor}`}>{log.action}</span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 min-w-[300px]">{log.details}</td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Tidak ada catatan log aktivitas saat ini.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
