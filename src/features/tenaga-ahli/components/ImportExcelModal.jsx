import React, { useContext } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx-js-style';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';

export default function ImportExcelModal() {
    const {
        setModalConfig,
        handleImportExcel
    } = useContext(AppContext);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setModalConfig({ isOpen: false, type: null })}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-8 relative overflow-hidden"
            >
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Import Data Excel</h3>
                    <button
                        onClick={() => setModalConfig({ isOpen: false, type: null })}
                        className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Silakan download template format Excel yang didukung sistem terlebih dahulu untuk menghindari kesalahan input.
                    </p>

                    <button
                        onClick={() => {
                            const ws_data = [
                                ["Nama Personil", "No HP", "Status", "Jenjang dan Bidang Ilmu", "Perusahaan", "Sertifikat Keahlian", "Jenjang", "Masa Berlaku"],
                                ["Contoh: Budi Santoso", "08123456789", "Tersedia", "S1 Teknik Sipil", "PT. Maju Jaya", "Ahli Teknik Bangunan Gedung", "Madya", "2027-12-31"]
                            ];
                            const ws = XLSX.utils.aoa_to_sheet(ws_data);
                            ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Template");
                            XLSX.writeFile(wb, "Template_Import_Tenaga_Ahli.xlsx");
                        }}
                        className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <Icon name="download" size={18} /> Download Template Excel
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold">ATAU</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    </div>

                    <label className="w-full cursor-pointer px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors shadow-md">
                        <Icon name="upload" size={18} /> Pilih File & Import
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                                setModalConfig({ isOpen: false, type: null });
                                handleImportExcel(e);
                            }}
                            className="hidden"
                        />
                    </label>
                </div>
            </motion.div>
        </div>
    );
}
