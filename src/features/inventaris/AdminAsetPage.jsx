import { useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import * as inventoryService from '../../services/inventoryService';

export default function AdminAsetPage() {
    const {
        inventory, adminAsetFilter, setAdminAsetFilter, adminAsetSearch, setAdminAsetSearch,
        canManageAsset, adminAsetFormData, setAdminAsetFormData, adminAsetModal, setAdminAsetModal,
        adminAsetConfirm, setAdminAsetConfirm, loading, setConfirmDialog
    } = useContext(AppContext);

    const handleAdminAsetInventoryAction = async (action, payload) => {
        let newData = [...inventory];
        if (action === 'add') {
            newData.push(payload);
        } else if (action === 'edit' || action === 'verify') {
            newData = newData.map(item => item.id === payload.id ? payload : item);
        } else if (action === 'delete') {
            newData = newData.filter(item => item.id !== payload.id);
        }
        await inventoryService.saveInventory(newData);
        setAdminAsetModal({ isOpen: false, mode: 'add', data: null });
        setAdminAsetConfirm({ isOpen: false, item: null, action: null });
    };

    const handleAdminAsetVerify = (item) => {
        const updatedItem = { ...item, status: 'Dipinjam' };
        handleAdminAsetInventoryAction('verify', updatedItem);
    };

    const handleAdminAsetReject = (item) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tolak Peminjaman',
            message: `Tolak pengajuan peminjaman alat ${item.name} dari ${item.borrower}?`,
            type: 'danger',
            onConfirm: () => {
                const updatedItem = { ...item, status: 'Tersedia', borrower: null, borrowDate: null, returnDate: null, projectAssigned: null };
                handleAdminAsetInventoryAction('verify', updatedItem);
            }
        });
    };

    const handleAdminAsetReturnVerify = (item) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Terima Pengembalian',
            message: `Terima pengembalian alat ${item.name} dari ${item.borrower}?`,
            type: 'info',
            onConfirm: () => {
                const updatedItem = { ...item, status: 'Tersedia', lastBorrower: item.borrower, lastBorrowDate: item.borrowDate, borrower: null, borrowDate: null, returnDate: null, projectAssigned: null };
                handleAdminAsetInventoryAction('verify', updatedItem);
            }
        });
    };

    const handleAdminAsetReturnReject = (item) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tolak Pengembalian',
            message: `Tolak pengajuan pengembalian alat ${item.name}?`,
            type: 'danger',
            onConfirm: () => {
                const updatedItem = { ...item, status: 'Dipinjam' };
                handleAdminAsetInventoryAction('verify', updatedItem);
            }
        });
    };

    const handleAdminAsetExtendVerify = (item) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Setujui Perpanjangan',
            message: `Setujui perpanjangan alat ${item.name} hingga ${formatDateIndo(item.newReturnDate)}?`,
            type: 'info',
            onConfirm: () => {
                const updatedItem = { ...item, status: 'Dipinjam', returnDate: item.newReturnDate };
                delete updatedItem.newReturnDate;
                handleAdminAsetInventoryAction('verify', updatedItem);
            }
        });
    };

    const handleAdminAsetExtendReject = (item) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tolak Perpanjangan',
            message: `Tolak pengajuan perpanjangan alat ${item.name}?`,
            type: 'danger',
            onConfirm: () => {
                const updatedItem = { ...item, status: 'Dipinjam' };
                delete updatedItem.newReturnDate;
                handleAdminAsetInventoryAction('verify', updatedItem);
            }
        });
    };

    const handleAdminAsetConfirmAction = () => {
        const item = adminAsetConfirm.item;
        if (!item) return;

        if (adminAsetConfirm.action === 'delete') {
            handleAdminAsetInventoryAction('delete', item);
        } else if (adminAsetConfirm.action === 'reject') {
            const updatedItem = {
                ...item,
                status: 'Tersedia',
                borrower: null,
                borrowDate: null,
                returnDate: null,
                projectAssigned: null
            };
            handleAdminAsetInventoryAction('verify', updatedItem);
        } else if (adminAsetConfirm.action === 'accept_return') {
            const updatedItem = {
                ...item,
                status: 'Tersedia',
                lastBorrower: item.borrower,
                lastBorrowDate: item.borrowDate,
                borrower: null,
                borrowDate: null,
                returnDate: null,
                projectAssigned: null
            };
            handleAdminAsetInventoryAction('verify', updatedItem);
        } else if (adminAsetConfirm.action === 'reject_return') {
            const updatedItem = {
                ...item,
                status: 'Dipinjam'
            };
            handleAdminAsetInventoryAction('verify', updatedItem);
        } else if (adminAsetConfirm.action === 'accept_extend') {
            const updatedItem = {
                ...item,
                status: 'Dipinjam',
                returnDate: item.newReturnDate
            };
            delete updatedItem.newReturnDate;
            handleAdminAsetInventoryAction('verify', updatedItem);
        } else if (adminAsetConfirm.action === 'reject_extend') {
            const updatedItem = {
                ...item,
                status: 'Dipinjam'
            };
            delete updatedItem.newReturnDate;
            handleAdminAsetInventoryAction('verify', updatedItem);
        }
        setAdminAsetConfirm({ isOpen: false, item: null, action: null });
    };

    const handleAdminAsetSubmit = (e) => {
        e.preventDefault();
        let finalPayload = { ...adminAsetFormData };
        if (adminAsetModal.mode === 'add' && !finalPayload.id) {
            const prefix = 'ID';
            if (inventory.length === 0) {
                finalPayload.id = `${prefix}-001`;
            } else {
                const ids = inventory.map(item => parseInt((item.id || '').split('-')[1], 10)).filter(n => !isNaN(n));
                const maxId = ids.length > 0 ? Math.max(...ids) : 0;
                finalPayload.id = `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
            }
        }
        handleAdminAsetInventoryAction(adminAsetModal.mode, finalPayload);
    };

    const filteredInv = inventory.filter(item => {
        const matchStatus = adminAsetFilter === 'Semua' || item.status === adminAsetFilter;
        const matchSearch = (item.name || '').toLowerCase().includes(adminAsetSearch.toLowerCase()) ||
            (item.type || '').toLowerCase().includes(adminAsetSearch.toLowerCase()) ||
            ((item.borrower || '').toLowerCase().includes(adminAsetSearch.toLowerCase()));
        return matchStatus && matchSearch;
    });

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                    {['Semua', 'Menunggu Verifikasi', 'Dipinjam', 'Menunggu Verifikasi Pengembalian', 'Menunggu Verifikasi Perpanjangan'].map(status => {
                        const count = status === 'Semua' ? inventory.length : inventory.filter(i => i.status === status).length;
                        if (status !== 'Semua' && count === 0) return null;
                        return (
                            <button
                                key={status}
                                onClick={() => setAdminAsetFilter(status)}
                                className={`px-3 py-1.5 rounded-xl font-medium transition-colors text-sm ${adminAsetFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                            >
                                {status === 'Menunggu Verifikasi Pengembalian' ? 'Menunggu Pengembalian' : status === 'Menunggu Verifikasi Perpanjangan' ? 'Menunggu Perpanjangan' : status}
                                {status === 'Menunggu Verifikasi' && (
                                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                )}
                                {status === 'Menunggu Verifikasi Pengembalian' && (
                                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                )}
                                {status === 'Menunggu Verifikasi Perpanjangan' && (
                                    <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-72">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari alat..."
                            value={adminAsetSearch}
                            onChange={(e) => setAdminAsetSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                        />
                    </div>
                    {canManageAsset() && (
                        <button
                            onClick={() => {
                                setAdminAsetFormData({
                                    id: '', name: '', type: 'Alat Ukur', condition: 'Baik', status: 'Tersedia', borrower: null, borrowDate: null, returnDate: null, lastBorrower: null, lastBorrowDate: null, projectAssigned: null
                                });
                                setAdminAsetModal({ isOpen: true, mode: 'add', data: null });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap text-sm"
                        >
                            <Icon name="plus" size={16} /> Tambah Alat
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 animate-pulse"><Icon name="loader" size={20} className="animate-spin" /> Memuat data aset...</div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Nama Alat</th>
                                <th className="px-5 py-4 font-semibold text-center">Status</th>
                                <th className="px-5 py-4 font-semibold text-center">Kondisi</th>
                                <th className="px-5 py-4 font-semibold text-center">Informasi Proyek</th>
                                <th className="px-5 py-4 font-semibold">Data Peminjaman</th>
                                <th className="px-5 py-4 font-semibold text-right">Aksi Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredInv.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        Tidak ada data alat dengan status {adminAsetFilter}.
                                    </td>
                                </tr>
                            ) : (
                                filteredInv.map(item => {
                                    const overdue = item.status === 'Dipinjam' && (item.returnDate && new Date(item.returnDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));
                                    return (
                                        <tr key={item.id} className={item.status === 'Menunggu Verifikasi' ? 'bg-purple-50/50 dark:bg-purple-900/10' : item.status === 'Menunggu Verifikasi Pengembalian' ? 'bg-orange-50/50 dark:bg-orange-900/10' : item.status === 'Menunggu Verifikasi Perpanjangan' ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors'}>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.id} - {item.type}</div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {item.status === 'Menunggu Verifikasi' ? (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Menunggu Verifikasi</span>
                                                ) : item.status === 'Menunggu Verifikasi Pengembalian' ? (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">Menunggu Pengembalian</span>
                                                ) : item.status === 'Menunggu Verifikasi Perpanjangan' ? (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Menunggu Perpanjangan</span>
                                                ) : item.status === 'Dipinjam' ? (
                                                    overdue ? (
                                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">Masa Pinjam Habis</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">Sedang Dipinjam</span>
                                                    )
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">{item.status}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${item.condition === 'Baik' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/50' : item.condition === 'Rusak Sedang' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50'}`}>
                                                    {item.condition}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {(item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan' || item.status === 'Dipinjam') && item.projectAssigned ? (
                                                    <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                                                        {item.projectAssigned}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {(item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan' || item.status === 'Dipinjam') && item.borrower ? (
                                                    <div>
                                                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.borrower}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.borrowDate ? formatDateIndo(item.borrowDate) : '-'} s/d {item.returnDate ? formatDateIndo(item.returnDate) : '?'}</div>
                                                        {item.status === 'Menunggu Verifikasi Perpanjangan' && item.newReturnDate && (
                                                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                                                                Req: {formatDateIndo(item.newReturnDate)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : item.lastBorrower ? (
                                                    <div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide mb-1 uppercase">Peminjam Terakhir</div>
                                                        <div className="font-medium text-slate-700 dark:text-slate-300 text-xs">{item.lastBorrower}</div>
                                                        {item.lastBorrowDate && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{formatDateIndo(item.lastBorrowDate)}</div>}
                                                    </div>
                                                ) : <span className="text-slate-400 dark:text-slate-600">-</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {canManageAsset() && (
                                                        <>
                                                            {item.status === 'Menunggu Verifikasi' && (
                                                                <div className="flex gap-1.5 mr-2">
                                                                    <button onClick={() => handleAdminAsetVerify(item)} title="Verifikasi & Serahkan" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5"><Icon name="check-circle-2" size={14} /> Serahkan</button>
                                                                    <button onClick={() => handleAdminAsetReject(item)} title="Tolak Penyerahan" className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-medium rounded-lg transition-colors text-xs flex items-center border border-red-100 dark:border-red-800/50"><Icon name="x" size={14} /> Tolak</button>
                                                                </div>
                                                            )}
                                                            {item.status === 'Menunggu Verifikasi Pengembalian' && (
                                                                <div className="flex gap-1.5 mr-2">
                                                                    <button onClick={() => handleAdminAsetReturnVerify(item)} title="Terima Barang Pengembalian" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5"><Icon name="check-circle-2" size={14} /> Terima</button>
                                                                    <button onClick={() => handleAdminAsetReturnReject(item)} title="Tolak Pengembalian" className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-medium rounded-lg transition-colors text-xs flex items-center border border-red-100 dark:border-red-800/50"><Icon name="x" size={14} /> Tolak</button>
                                                                </div>
                                                            )}
                                                            {item.status === 'Menunggu Verifikasi Perpanjangan' && (
                                                                <div className="flex gap-1.5 mr-2">
                                                                    <button onClick={() => handleAdminAsetExtendVerify(item)} title="Setujui Perpanjangan" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5"><Icon name="check-circle-2" size={14} /> Setujui</button>
                                                                    <button onClick={() => handleAdminAsetExtendReject(item)} title="Tolak Perpanjangan" className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-medium rounded-lg transition-colors text-xs flex items-center border border-red-100 dark:border-red-800/50"><Icon name="x" size={14} /> Tolak</button>
                                                                </div>
                                                            )}
                                                            <button onClick={() => { setAdminAsetFormData({ ...item }); setAdminAsetModal({ isOpen: true, mode: 'edit', data: item }); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Alat"><Icon name="edit" size={16} /></button>
                                                            <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Hapus Alat', message: `Yakin ingin menghapus alat ${item.name}?`, type: 'danger', onConfirm: () => handleAdminAsetInventoryAction('delete', item) })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus Alat"><Icon name="trash-2" size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {adminAsetModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setAdminAsetModal({ isOpen: false, mode: 'add', data: null })} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{adminAsetModal.mode === 'edit' ? 'Edit Alat/Aset' : 'Tambah Alat/Aset'}</h3>
                            <button onClick={() => setAdminAsetModal({ isOpen: false, mode: 'add', data: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="adminAsetForm" onSubmit={handleAdminAsetSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Alat</label>
                                        <input type="text" required value={adminAsetFormData.name || ''} onChange={e => setAdminAsetFormData({ ...adminAsetFormData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Theodolite, dll" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ID Alat</label>
                                        <input type="text" value={adminAsetFormData.id || ''} onChange={e => setAdminAsetFormData({ ...adminAsetFormData, id: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder={adminAsetModal.mode === 'add' ? 'Otomatis' : ''} readOnly={adminAsetModal.mode === 'edit'} title={adminAsetModal.mode === 'edit' ? 'ID Alat tidak dapat diubah setelah dibuat' : 'Kosongkan untuk penomoran otomatis'} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe/Kategori</label>
                                        <select value={adminAsetFormData.type || 'Alat Berat'} onChange={e => setAdminAsetFormData({ ...adminAsetFormData, type: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="Alat Berat">Alat Berat</option>
                                            <option value="Kendaraan">Kendaraan</option>
                                            <option value="Peralatan Khusus">Peralatan Khusus</option>
                                            <option value="Alat Ukur">Alat Ukur</option>
                                            <option value="Elektronik">Elektronik</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kondisi</label>
                                        <select value={adminAsetFormData.condition || 'Baik'} onChange={e => setAdminAsetFormData({ ...adminAsetFormData, condition: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="Baik">Baik</option>
                                            <option value="Rusak Sedang">Rusak Sedang</option>
                                            <option value="Rusak Berat">Rusak Berat</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Catatan Tambahan</label>
                                    <textarea rows="3" value={adminAsetFormData.notes || ''} onChange={e => setAdminAsetFormData({ ...adminAsetFormData, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button onClick={() => setAdminAsetModal({ isOpen: false, mode: 'add', data: null })} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                            <button type="submit" form="adminAsetForm" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors">Simpan Data</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
