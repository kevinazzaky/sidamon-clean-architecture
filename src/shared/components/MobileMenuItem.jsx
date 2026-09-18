export function MobileMenuItem({ icon, label, isActive, onClick }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full p-3 gap-2 transition-all rounded-[20px] ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 ${isActive ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-600/30' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
        </button>
    );
}

export default MobileMenuItem;
