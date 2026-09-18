import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';

export default function PrintZoomProjectModal() {
    const { printZoomProject, setPrintZoomProject, setScheduleZoom, setPrintData } = useContext(AppContext);

    if (!printZoomProject) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-in border border-slate-200 dark:border-slate-800">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="printer" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pilih Format PDF</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        Pilih tingkat detail kalender untuk laporan cetak Time Schedule proyek <strong>{printZoomProject.name}</strong>
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            setScheduleZoom("month");
                            setPrintData({ type: "project", id: printZoomProject.id });
                            setPrintZoomProject(null);
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 text-slate-500 group-hover:text-indigo-600 transition-colors">
                            <Icon name="calendar" size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200">Bulanan</div>
                            <div className="text-xs text-slate-500">Tampilan ringkas per bulan</div>
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setScheduleZoom("week");
                            setPrintData({ type: "project", id: printZoomProject.id });
                            setPrintZoomProject(null);
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 text-slate-500 group-hover:text-indigo-600 transition-colors">
                            <Icon name="calendar-days" size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200">Mingguan</div>
                            <div className="text-xs text-slate-500">Tampilan detail tiap minggu</div>
                        </div>
                    </button>
                    <button
                        onClick={() => setPrintZoomProject(null)}
                        className="w-full mt-2 p-3 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
}
