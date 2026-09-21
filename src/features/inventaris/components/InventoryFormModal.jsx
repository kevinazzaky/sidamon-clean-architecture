import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';

export default function InventoryFormModal() {
    const {
        modalConfig,
        setModalConfig,
        handleInventoryAction,
        borrowCart,
        loading
    } = useContext(AppContext);

    const [formData, setFormData] = useState(() => {
        const offset = new Date().getTimezoneOffset() * 6e4;
        const defaultBorrowDate = new Date(Date.now() - offset).toISOString().split("T")[0];
        if (modalConfig.data) {
            const data = { ...modalConfig.data };
            if (modalConfig.mode === "borrow" && !data.borrowDate) {
                data.borrowDate = defaultBorrowDate;
            }
            return data;
        }
        return {
            id: '',
            name: '',
            type: 'Alat Ukur',
            condition: 'Baik',
            borrower: '',
            borrowDate: defaultBorrowDate,
            returnDate: '',
            projectAssigned: ''
        };
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalConfig.mode === "borrow-cart") {
            const selectedIds = (Array.isArray(modalConfig.data) && modalConfig.data.length > 0)
                ? modalConfig.data
                : (borrowCart || []);
            handleInventoryAction("borrow-cart", {
                selectedIds,
                data: {
                    borrower: formData.borrower,
                    borrowDate: formData.borrowDate || new Date().toISOString().split("T")[0],
                    returnDate: formData.returnDate,
                    projectAssigned: formData.projectAssigned,
                },
            });
            return;
        }

        let finalPayload = { ...formData };
        if (modalConfig.mode === "borrow") {
            finalPayload.status = "Menunggu Verifikasi";
            if (!finalPayload.borrowDate) {
                finalPayload.borrowDate = new Date().toISOString().split("T")[0];
            }
        } else if (modalConfig.mode === "return") {
            finalPayload.status = "Menunggu Verifikasi Pengembalian";
        } else if (modalConfig.mode === "extend") {
            finalPayload.status = "Menunggu Verifikasi Perpanjangan";
            finalPayload.newReturnDate = finalPayload.returnDate;
            finalPayload.returnDate = modalConfig.data?.returnDate;
        }

        handleInventoryAction(modalConfig.mode, finalPayload);
    };

    const title =
        modalConfig.mode === "borrow-cart"
            ? "Peminjaman Massal Alat"
            : modalConfig.mode === "borrow"
                ? "Pinjam Alat"
                : modalConfig.mode === "return"
                    ? "Pengembalian Alat"
                    : modalConfig.mode === "extend"
                        ? "Perpanjang Peminjaman"
                        : modalConfig.mode === "edit"
                            ? "Edit Alat"
                            : "Tambah Alat";

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-transparent dark:border-slate-700/50 w-full sm:max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {title}
                    </h3>
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })}
                        type="button"
                        className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="inventoryForm" onSubmit={handleSubmit} className="space-y-4">
                        {modalConfig.mode === "borrow" ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Nama Peminjam
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="borrower"
                                        value={formData.borrower || ''}
                                        onChange={handleChange}
                                        placeholder="Masukkan nama peminjam..."
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tanggal Dipinjam
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="borrowDate"
                                        value={formData.borrowDate || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tanggal Pengembalian
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="returnDate"
                                        value={formData.returnDate || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Proyek (Opsional)
                                    </label>
                                    <input
                                        name="projectAssigned"
                                        value={formData.projectAssigned || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        placeholder="Cth: Perencanaan RSUD"
                                    />
                                </div>
                            </div>
                        ) : modalConfig.mode === "borrow-cart" ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-2">
                                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                                        Anda akan meminjam <strong className="font-bold">{(Array.isArray(modalConfig.data) && modalConfig.data.length > 0 ? modalConfig.data.length : borrowCart?.length) || 0} alat sekaligus</strong>. Data formulir ini akan diaplikasikan ke semua alat yang Anda pilih.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Nama Peminjam
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="borrower"
                                        value={formData.borrower || ''}
                                        onChange={handleChange}
                                        placeholder="Masukkan nama peminjam..."
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tanggal Dipinjam
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="borrowDate"
                                        value={formData.borrowDate || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tanggal Pengembalian
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="returnDate"
                                        value={formData.returnDate || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Proyek (Opsional)
                                    </label>
                                    <input
                                        name="projectAssigned"
                                        value={formData.projectAssigned || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        placeholder="Cth: Perencanaan RSUD"
                                    />
                                </div>
                            </div>
                        ) : modalConfig.mode === "extend" ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-slate-200 dark:border-amber-800/50 rounded-xl mb-2">
                                    <p className="text-xs text-amber-800 dark:text-amber-300">
                                        Perpanjang masa pinjam untuk alat <strong className="font-bold">{formData.name}</strong> yang sedang dipinjam oleh <strong className="font-bold">{formData.borrower}</strong>.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tanggal Pengembalian Baru
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="returnDate"
                                        value={formData.returnDate || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        ) : modalConfig.mode === "return" ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-2">
                                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                                        Anda akan mengembalikan alat <strong className="font-bold">{formData.name}</strong> yang dipinjam oleh <strong className="font-bold">{formData.borrower}</strong>. Silakan perbarui kondisi terakhir alat ini.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Kondisi Alat Saat Dikembalikan
                                    </label>
                                    <select
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    >
                                        <option value="Baik">Baik</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {modalConfig.mode !== "edit" && (
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            ID / Kode Alat
                                        </label>
                                        <input
                                            required
                                            name="id"
                                            value={formData.id}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                            placeholder="Cth: INV-2023-001"
                                        />
                                    </div>
                                )}
                                <div className={`col-span-2 ${modalConfig.mode !== "edit" ? "sm:col-span-1" : ""}`}>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Nama Alat
                                    </label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        placeholder="Cth: Drone DJI Mavic"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    >
                                        <option value="Alat Ukur">Alat Ukur</option>
                                        <option value="Kendaraan">Kendaraan</option>
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Kondisi
                                    </label>
                                    <select
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    >
                                        <option value="Baik">Baik</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        form="inventoryForm"
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70"
                    >
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
