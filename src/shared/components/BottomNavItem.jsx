export function BottomNavItem({ icon, label, isActive, onClick }) {
    return (
        <button onClick={onClick} className={`relative flex items-center justify-center transition-all duration-500 ease-out h-[48px] overflow-hidden ${isActive ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-full px-5 gap-2 shadow-lg shadow-slate-900/20 dark:shadow-white/20 w-auto' : 'w-12 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent rounded-full'}`}>
            <div className={`transition-transform duration-500 ${isActive ? 'scale-100' : 'scale-95'}`}>{icon}</div>
            {isActive && <span className="text-[12px] font-bold whitespace-nowrap animate-in fade-in zoom-in duration-300 tracking-wide">{label}</span>}
        </button>
    );
}

export default BottomNavItem;
