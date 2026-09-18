import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';

export default function ExpertModalForm() {
    const {
        modalConfig,
        setModalConfig,
        resources,
        handleExpertAction,
        loading
    } = useContext(AppContext);

    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && modalConfig.data) return { ...modalConfig.data };
        return {
            id: '',
            name: '',
            phone: '',
            status: 'Tersedia',
            jenjang: '',
            bidangIlmu: '',
            perusahaan: '',
            linkedResourceName: '',
            keterangan: ''
        };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleExpertAction(isEdit ? 'edit' : 'add', formData);
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
                className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
            >
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEdit ? 'Edit Data Tenaga Ahli' : 'Tambah Tenaga Ahli'}
                    </h3>
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null })}
                        type="button"
                        className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="expertForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / WhatsApp</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenjang & Bidang Ilmu</label>
                            <input
                                type="text"
                                placeholder="Cth: SMA, S1 Teknik Sipil Thn 1997"
                                value={formData.bidangIlmu || ''}
                                onChange={e => setFormData({ ...formData, bidangIlmu: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Perusahaan / Instansi</label>
                            <select
                                value={formData.perusahaan || ''}
                                onChange={e => setFormData({ ...formData, perusahaan: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            >
                                <option value="">-- Pilih Perusahaan --</option>
                                <option value="PT. Gaharu Sempana">PT. Gaharu Sempana</option>
                                <option value="PT. Kencana Adhi Karma">PT. Kencana Adhi Karma</option>
                                <option value="CV. Cipta Asri Disain">CV. Cipta Asri Disain</option>
                                <option value="CV. Tataring Bali">CV. Tataring Bali</option>
                                <option value="Freelance">Freelance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Icon name="link" size={14} className="text-indigo-500" /> Hubungkan dgn Personil Internal (Opsional)
                            </label>
                            <input
                                type="text"
                                list="internal-resources-list"
                                placeholder="-- Ketik untuk mencari personil atau biarkan kosong --"
                                value={formData.linkedResourceName || ''}
                                onChange={e => setFormData({ ...formData, linkedResourceName: e.target.value })}
                                className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-indigo-50/30 dark:bg-indigo-900/10 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                            />
                            <datalist id="internal-resources-list">
                                {resources.map(r => (
                                    <option key={r.id || r.name} value={r.name}>{r.name} ({r.role})</option>
                                ))}
                            </datalist>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Pilih ini jika nama Tenaga Ahli di kontrak berbeda dengan nama di menu Alokasi Tim agar tetap terbaca & tersinkron pada beban kerja.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Icon name="file-text" size={14} className="text-slate-500" /> Keterangan
                            </label>
                            <textarea
                                rows="3"
                                value={formData.keterangan || ''}
                                onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                placeholder="Tambahkan keterangan tambahan (opsional)..."
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all resize-none"
                            />
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
                        form="expertForm"
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
