import { AnimatePresence, motion } from 'motion/react';
import Icon from '../components/Icon';

export default function AlertModal({ alertModal, setAlertModal }) {
    if (!alertModal?.isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-6 flex flex-col items-center text-center overflow-hidden"
                >
                    <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />

                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shadow-inner mb-4">
                        <Icon name="alert-triangle" size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{alertModal.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-6 whitespace-pre-wrap">{alertModal.message}</p>

                    <button
                        onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                        className="w-full px-5 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/30 relative z-10"
                    >
                        Mengerti
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
