import Icon from '../components/Icon';

export default function PendingModal({ showPendingModal, pendingProjectData, pendingReasonText, setShowPendingModal, setPendingProjectData, setPendingReasonText, onSubmit }) {
    if (!showPendingModal || !pendingProjectData) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center fade-in p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-in border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Icon name="alert-triangle" className="text-orange-500" />
                        Pending Proyek
                    </h3>
                    <button onClick={() => {
                        setShowPendingModal(false);
                        setPendingProjectData(null);
                        setPendingReasonText("");
                    }} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Icon name="x" size={24} />
                    </button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Anda akan mengubah status proyek <strong className="text-slate-800 dark:text-slate-200">{pendingProjectData.name}</strong> menjadi Pending. Status ini akan membebastugaskan tim sementara waktu.
                    </p>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Alasan Pending <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={pendingReasonText}
                        onChange={(e) => setPendingReasonText(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows="3"
                        placeholder="Contoh: Menunggu konfirmasi revisi RAB dari klien..."
                    />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => {
                        setShowPendingModal(false);
                        setPendingProjectData(null);
                        setPendingReasonText("");
                    }} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!pendingReasonText.trim()}
                        className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Icon name="check" size={16} /> Set Pending
                    </button>
                </div>
            </div>
        </div>
    );
}
