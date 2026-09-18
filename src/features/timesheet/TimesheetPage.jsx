import Icon from '../../shared/components/Icon';

export default function TimesheetPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center fade-in">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <Icon name="calendar-clock" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Modul Timesheet</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">Modul pengisian log harian karyawan sedang dalam tahap pengembangan dan akan segera dirilis pada pembaruan sistem berikutnya.</p>
        </div>
    );
}
