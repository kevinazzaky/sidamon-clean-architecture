import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import * as userService from '../../services/userService';

export default function ManajemenPenggunaPage() {
    const { usersList, currentUser, setConfirmDialog, setAlertModal } = useContext(AppContext);

    const roles = [
        "Super Admin",
        "Manajer",
        "Manajer Teknis",
        "Manajer Administrasi",
        "Kordinator Divisi Teknis",
        "Admin Tender",
        "Kordinator Aset",
        "PIC",
        "Team Leader Pekerjaan",
        "HRD",
        "Guest"
    ];

    const handleRoleChange = (uid, newRole) => {
        userService.updateUserRole(uid, newRole)
            .then(() => console.log('Role updated successfully'))
            .catch(error => console.error('Error updating role:', error));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Icon name="users" size={20} />
                            </div>
                            Daftar Pengguna Sistem
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Atur hak akses pengguna di sini. Perubahan akan langsung tersimpan ke database.</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Informasi Pengguna</th>
                                <th className="px-6 py-4 w-64">Status Akses (Role)</th>
                                <th className="px-6 py-4 w-32 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {usersList.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500">Memuat data pengguna...</td>
                                </tr>
                            ) : (
                                usersList.map((usr) => (
                                    <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase shadow-sm">
                                                    {usr.email ? usr.email.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{usr.email || 'Email Tidak Diketahui'}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">UID: {usr.uid}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <select
                                                    value={usr.role || 'Guest'}
                                                    onChange={(e) => handleRoleChange(usr.uid, e.target.value)}
                                                    disabled={usr.uid === currentUser?.uid}
                                                    title={usr.uid === currentUser?.uid ? 'Anda tidak dapat mengubah role Anda sendiri' : ''}
                                                    className={`w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                                                                ${usr.uid === currentUser?.uid ? 'opacity-50 cursor-not-allowed ' : ''}
                                                                ${usr.role === 'Guest' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' :
                                                            usr.role === 'Super Admin' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' :
                                                                'bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'}`}
                                                >
                                                    {roles.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                                    <Icon name="chevron-down" size={16} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                {usr.role === 'Guest' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        <Icon name="clock" size={14} /> Menunggu
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        <Icon name="check-circle-2" size={14} /> Aktif
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setConfirmDialog({
                                                            isOpen: true,
                                                            title: 'Konfirmasi Hapus',
                                                            message: `Apakah Anda yakin ingin menghapus pengguna ${usr.email}? Akses mereka akan sepenuhnya dicabut.`,
                                                            type: 'danger',
                                                            onConfirm: () => {
                                                                userService.deleteUser(usr.uid)
                                                                    .then(() => setAlertModal({ isOpen: true, title: 'Sukses', message: 'Pengguna berhasil dihapus dari sistem.' }))
                                                                    .catch(err => setAlertModal({ isOpen: true, title: 'Error', message: 'Gagal menghapus pengguna: ' + err.message }));
                                                            }
                                                        });
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Hapus Pengguna"
                                                >
                                                    <Icon name="trash-2" size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
