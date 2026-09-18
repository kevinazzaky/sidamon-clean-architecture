import Icon from '../components/Icon';

export default function ConfirmModal({ confirmDialog, setConfirmDialog }) {
    if (!confirmDialog.isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() =>
                    setConfirmDialog({
                        ...confirmDialog,
                        isOpen: false,
                    })
                }
            />
            <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl w-full max-w-sm p-8 overflow-hidden scale-in-center">
                <div
                    className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 ${confirmDialog.type === "danger" ? "bg-red-500" : "bg-blue-500"}`}
                />
                <div
                    className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-10 ${confirmDialog.type === "danger" ? "bg-rose-500" : "bg-indigo-500"}`}
                />
                <div className="flex flex-col items-center text-center relative z-10">
                    <div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-inner backdrop-blur-md ${confirmDialog.type === "danger" ? "bg-red-50/80 text-red-500 shadow-red-200 border border-red-100" : "bg-blue-50/80 text-blue-500 shadow-blue-200 border border-blue-100"}`}
                    >
                        <Icon
                            name={
                                confirmDialog.type === "danger"
                                    ? "alert-triangle"
                                    : "help-circle"
                            }
                            size={36}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {confirmDialog.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed px-2">
                        {confirmDialog.message}
                    </p>
                    <div className="flex w-full gap-3">
                        <button
                            onClick={() =>
                                setConfirmDialog({
                                    ...confirmDialog,
                                    isOpen: false,
                                })
                            }
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 transition-all border border-slate-200/60 dark:border-slate-600/50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                setConfirmDialog({
                                    ...confirmDialog,
                                    isOpen: false,
                                });
                            }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 shadow-lg ${confirmDialog.type === "danger" ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30" : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30"}`}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
