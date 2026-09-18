import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';

export default function ExpertCertModalForm() {
    const {
        modalConfig,
        setModalConfig,
        experts,
        certList,
        handleExpertAction,
        loading,
        setShowCertManager
    } = useContext(AppContext);

    const { expertId, certIndex, cert } = modalConfig.data || {};
    const expert = experts.find(e => e.id === expertId);
    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && cert) return { ...cert };
        return { certName: '', certLevel: 'Ahli Muda', issuedDate: '', expiredDate: '' };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expert) return;
        let newCerts = [...(expert.certificates || [])];
        if (isEdit) {
            newCerts[certIndex] = formData;
        } else {
            newCerts.push(formData);
        }
        handleExpertAction('update_certificates', { ...expert, certificates: newCerts });
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
                        {isEdit ? 'Edit Sertifikat' : 'Tambah Sertifikat'}
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
                    <form id="expertCertForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nama Sertifikat</label>
                                <button
                                    type="button"
                                    onClick={() => setShowCertManager(true)}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1"
                                >
                                    <Icon name="settings" size={12} /> Kelola Daftar
                                </button>
                            </div>
                            <input
                                type="text"
                                required
                                list="cert-options"
                                value={formData.certName}
                                onChange={e => setFormData({ ...formData, certName: e.target.value })}
                                placeholder="Cth: SKA Ahli Teknik Bangunan Gedung"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                            <datalist id="cert-options">
                                {certList.map((cert, idx) => <option key={idx} value={cert} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat / Kualifikasi</label>
                            <select
                                value={formData.certLevel}
                                onChange={e => setFormData({ ...formData, certLevel: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            >
                                <option value="Ahli Muda">Ahli Muda</option>
                                <option value="Ahli Madya">Ahli Madya</option>
                                <option value="Ahli Utama">Ahli Utama</option>
                                <option value="Level 1">Level 1</option>
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3">Level 3</option>
                                <option value="Level 4">Level 4</option>
                                <option value="Level 5">Level 5</option>
                                <option value="Level 6">Level 6</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tgl Terbit</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.issuedDate}
                                    onChange={e => setFormData({ ...formData, issuedDate: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tgl Berakhir</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expiredDate}
                                    onChange={e => setFormData({ ...formData, expiredDate: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                />
                            </div>
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
                        form="expertCertForm"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
