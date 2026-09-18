import { AnimatePresence, motion } from 'motion/react';
import Icon from '../components/Icon';
import { formatDateIndo } from '../utils/dateHelpers';

export default function DominoModal({ dominoAnalysis, setDominoAnalysis }) {
    if (!dominoAnalysis) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={() => setDominoAnalysis(null)}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
                                    <Icon name="alert-triangle" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Analisis Efek Domino 💥</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Prediksi tabrakan jadwal akibat keterlambatan</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDominoAnalysis(null)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <Icon name="x" size={20} />
                            </motion.button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white/50 dark:bg-slate-800/50">
                            <div className="mb-6 bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 p-5 rounded-2xl">
                                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Proyek <strong className="text-red-600 dark:text-red-400">{dominoAnalysis.project.name}</strong> saat ini terlambat <strong className="text-red-600 dark:text-red-400 text-lg">{dominoAnalysis.delayDays} hari</strong>.
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    Sistem memprediksi anggota sub-tim yang belum selesai di proyek ini akan membawa keterlambatan ini ke proyek mereka selanjutnya.
                                </p>
                            </div>

                            {dominoAnalysis.impactedEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                                        <Icon name="check-circle-2" size={32} className="text-emerald-500" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Aman Terkendali</h4>
                                    <p className="text-sm text-center max-w-sm mt-2">Tidak ditemukan efek domino. Anggota sub-tim tidak memiliki jadwal proyek lain di masa depan yang berdekatan.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dominoAnalysis.impactedEmployees.map((emp, i) => (
                                        <div key={i} className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h5 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{emp.name}</h5>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Delay Individu: {emp.delayDays} hari</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-2">Berdampak pada proyek berikutnya:</p>
                                                <ul className="space-y-3">
                                                    {emp.futureProjects.map((np, j) => (
                                                        <li key={j} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{np.name}</span>
                                                            <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                                                                Deadline: {formatDateIndo(np.deadlineStr)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

        </AnimatePresence>
    );
}
