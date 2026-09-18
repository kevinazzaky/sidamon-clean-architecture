import Icon from '../components/Icon';

export default function ResumeModal({ showResumeModal, resumeProjectData, setShowResumeModal, setResumeProjectData, onConfirm }) {
    if (!showResumeModal || !resumeProjectData) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center fade-in p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-in border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Icon name="play" className="text-green-500" />
                        Resume Proyek
                    </h3>
                    <button onClick={() => {
                        setShowResumeModal(false);
                        setResumeProjectData(null);
                    }} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Icon name="x" size={24} />
                    </button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Anda akan mengaktifkan kembali proyek <strong className="text-slate-800 dark:text-slate-200">{resumeProjectData.name}</strong> yang sebelumnya berstatus Pending. Tim akan kembali ditugaskan ke proyek ini.
                    </p>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => {
                        setShowResumeModal(false);
                        setResumeProjectData(null);
                    }} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Icon name="check" size={16} /> Resume Proyek
                    </button>
                </div>
            </div>
        </div>
    );
}
