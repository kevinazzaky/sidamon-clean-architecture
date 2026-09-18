import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';
import { calculateLeaderKPI, calculateEmployeeKPI } from '../../../shared/utils/projectCalculations';

export default function ResourceFormModal() {
    const {
        modalConfig,
        setModalConfig,
        projects,
        handleCrudAction,
        loading
    } = useContext(AppContext);

    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (modalConfig.data) {
            return {
                ...modalConfig.data,
                adjustmentInput: 0
            };
        }
        return {
            name: '',
            role: 'Arsitek',
            level: 'Staff',
            adjustmentInput: 0,
            manualPoints: 0
        };
    });

    const handleResetTo100 = () => {
        const dummyEmp = { ...formData };
        let calculated = null;
        if (formData.level === 'Team Leader') {
            calculated = calculateLeaderKPI(dummyEmp, projects);
        } else {
            calculated = calculateEmployeeKPI(dummyEmp, projects);
        }
        const gap = 100 - (calculated?.score || 0);
        setFormData(prev => ({ ...prev, adjustmentInput: gap }));
    };

    const handleResetToAuto = () => {
        const gap = -(formData.manualPoints || 0);
        setFormData(prev => ({ ...prev, adjustmentInput: gap }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newManualPoints = (formData.manualPoints || 0) + (formData.adjustmentInput || 0);
        const finalPayload = {
            ...formData,
            role: `${formData.role}|${formData.level}|${newManualPoints}`
        };
        handleCrudAction(modalConfig.mode, 'resource', finalPayload);
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
                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-transparent dark:border-slate-700/50 w-full sm:max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEdit ? 'Edit Personil Tim' : 'Tambah Personil Tim'}
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
                    <form id="resourceForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Nama Personil
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                placeholder="Cth: Ir. Budi Santoso"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Tim
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                            >
                                <option value="Arsitek">Arsitek</option>
                                <option value="QS">Quantity Surveyor (QS)</option>
                                <option value="Struktur">Struktur</option>
                                <option value="MEP">MEP</option>
                                <option value="Tata Ruang">Tata Ruang</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Tingkat Jabatan
                            </label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                            >
                                <option value="Staff">Staff (Anggota)</option>
                                <option value="Team Leader">Team Leader</option>
                                <option value="PIC">PIC</option>
                                <option value="Kordinator Divisi Jalan">Kordinator Divisi Jalan</option>
                                <option value="Kordinator Divisi Gedung">Kordinator Divisi Gedung</option>
                                <option value="Kordinator Divisi SDA">Kordinator Divisi SDA</option>
                                <option value="Kordinator Divisi Perijinan">Kordinator Divisi Perijinan</option>
                                <option value="Kordinator Divisi Master Plan">Kordinator Divisi Master Plan</option>
                                <option value="Kordinator Divisi Pengawasan">Kordinator Divisi Pengawasan</option>
                                <option value="Kordinator Divisi Perencanaan">Kordinator Divisi Perencanaan</option>
                            </select>
                        </div>

                        {/* Penyesuaian Nilai Manual */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Penyesuaian Nilai Manual (Opsional)
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Anda dapat menambahkan atau mengurangi poin KPI secara manual jika diperlukan (misal: reward / penalti). Nilai saat ini:{" "}
                                <strong className="text-blue-600 dark:text-blue-400">{formData.manualPoints || 0} poin</strong>.
                            </p>
                            <div className="flex flex-wrap gap-3 items-center mt-2">
                                <input
                                    type="number"
                                    name="adjustmentInput"
                                    value={
                                        formData.adjustmentInput === "" || isNaN(formData.adjustmentInput)
                                            ? ""
                                            : formData.adjustmentInput !== undefined
                                                ? formData.adjustmentInput
                                                : 0
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            adjustmentInput: e.target.value === "" ? "" : parseInt(e.target.value)
                                        })
                                    }
                                    className="w-24 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-center outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={handleResetTo100}
                                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Icon name="target" size={12} /> Reset ke 100
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetToAuto}
                                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                    title="Hapus semua penyesuaian manual dan kembalikan ke perhitungan murni otomatis proyek."
                                >
                                    <Icon name="refresh-ccw" size={12} /> Hapus Manual
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl mt-4">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                                💡 <strong className="font-bold">Info Cerdas:</strong> Jumlah proyek dan Persentase Beban Kerja orang ini tidak perlu diinput manual. Sistem akan otomatis menghitungnya berdasarkan seberapa banyak proyek yang ia tangani di menu List Proyek.
                            </p>
                        </div>
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
                        form="resourceForm"
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
