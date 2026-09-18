import { useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';

export default function LpseManagerModal() {
    const { showLpseManager, setShowLpseManager, lpseList, setAlertModal, handleUpdateLpseList } = useContext(AppContext);

    if (!showLpseManager) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={() => setShowLpseManager(false)}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
                >
                    <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />

                    <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Icon name="settings" size={20} className="text-emerald-500" />
                            Kelola Daftar LPSE
                        </h3>
                        <button onClick={() => setShowLpseManager(false)} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 p-2 rounded-xl transition-colors">
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.target.elements.newlpse.value.trim();
                            if (!input) return;
                            if (lpseList.includes(input)) {
                                setAlertModal({ isOpen: true, title: "Duplikasi LPSE", message: "LPSE sudah ada di dalam daftar!" });
                                return;
                            }
                            handleUpdateLpseList([...lpseList, input]);
                            e.target.reset();
                        }} className="flex gap-2 mb-4">
                            <input type="text" name="newlpse" placeholder="Tambah instansi LPSE baru..." className="flex-1 p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800 text-sm dark:text-slate-200 transition-all" />
                            <button type="submit" className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2">
                                <Icon name="plus" size={16} /> Tambah
                            </button>
                        </form>

                        <div className="space-y-2">
                            {lpseList.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Daftar kosong.</p>
                            ) : (
                                lpseList.map((lpse, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors group">
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{lpse}</span>
                                        <button onClick={() => {
                                            if (window.confirm(`Hapus ${lpse} dari daftar LPSE?`)) {
                                                handleUpdateLpseList(lpseList.filter(item => item !== lpse));
                                            }
                                        }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors p-2 rounded-lg opacity-0 group-hover:opacity-100" title="Hapus">
                                            <Icon name="trash-2" size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
