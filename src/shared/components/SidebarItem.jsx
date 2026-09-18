export function SidebarItem({ icon, label, isActive, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-semibold ${isActive ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/20 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon} <span className="font-medium text-sm tracking-wide">{label}</span>
        </button>
    );
}

export default SidebarItem;
