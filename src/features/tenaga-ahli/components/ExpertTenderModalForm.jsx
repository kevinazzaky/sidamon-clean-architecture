import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';

export default function ExpertTenderModalForm() {
    const {
        modalConfig,
        setModalConfig,
        experts,
        lpseList,
        handleExpertAction,
        setAlertModal,
        loading,
        setShowLpseManager
    } = useContext(AppContext);

    const { expertId, tenderIndex, tender } = modalConfig.data || {};
    const expert = experts.find(e => e.id === expertId);
    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && tender) return { ...tender };
        return { lpseName: '', position: 'Team Leader', status: 'Aktif' };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expert) return;

        // Validation rule
        if (formData.status === 'Aktif' || formData.status === 'Menunggu Pengumuman') {
            const existingActive = (expert.tenders || []).find((t, idx) =>
                (!isEdit || idx !== tenderIndex) &&
                t.lpseName.trim().toLowerCase() === formData.lpseName.trim().toLowerCase() &&
                (t.status === 'Aktif' || t.status === 'Menunggu Pengumuman')
            );

            if (existingActive) {
                setAlertModal({
                    isOpen: true,
                    title: 'Kapasitas Penuh',
                    message: `Gagal menyimpan! Tenaga Ahli ini sudah memiliki tender aktif/menunggu di ${existingActive.lpseName}. Sesuai aturan, tidak boleh dipasang pada lebih dari 1 tender aktif di LPSE yang sama.`
                });
                return;
            }
        }

        let newTenders = [...(expert.tenders || [])];
        if (isEdit) {
            newTenders[tenderIndex] = formData;
        } else {
            newTenders.push(formData);
        }
        handleExpertAction('update_tenders', { ...expert, tenders: newTenders });
    };

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
                className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-6 relative overflow-hidden"
            >
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEdit ? 'Edit Riwayat Tender' : 'Plotting Tender LPSE'}
                    </h3>
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null })}
                        type="button"
                        className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <form id="expertTenderForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama / Instansi LPSE</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    list="lpse-options"
                                    required
                                    value={formData.lpseName}
                                    onChange={e => setFormData({ ...formData, lpseName: e.target.value })}
                                    placeholder="Cth: LPSE Kementerian PUPR"
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                />
                                <datalist id="lpse-options">
                                    {lpseList.map((lpse, idx) => <option key={idx} value={lpse} />)}
                                </datalist>
                                <button
                                    type="button"
                                    onClick={() => setShowLpseManager(true)}
                                    className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors shrink-0"
                                    title="Kelola Daftar LPSE"
                                >
                                    <Icon name="settings" size={18} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Posisi / Jabatan yang Ditawarkan</label>
                            <input
                                type="text"
                                required
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                placeholder="Cth: Team Leader / Ahli Struktur"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Tender</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            >
                                <option value="Menunggu Pengumuman">Menunggu Pengumuman</option>
                                <option value="Aktif">Aktif (Sedang Proses)</option>
                                <option value="Menang">Menang</option>
                                <option value="Kalah">Kalah / Gugur</option>
                                <option value="Selesai">Selesai / Riwayat</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null })}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                    >
                        Batal
                    </button>
                    <button
                        form="expertTenderForm"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
