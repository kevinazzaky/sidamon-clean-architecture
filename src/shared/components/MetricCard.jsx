import Icon from './Icon';

export function MetricCard({ title, value, trend, trendUp, icon, color, onClick }) {
    const darkColorMap = {
        'bg-blue-50': 'dark:bg-blue-900/20 dark:text-blue-400',
        'bg-indigo-50': 'dark:bg-indigo-900/20 dark:text-indigo-400',
        'bg-amber-50': 'dark:bg-amber-900/20 dark:text-amber-400',
        'bg-emerald-50': 'dark:bg-emerald-900/20 dark:text-emerald-400',
        'bg-teal-50': 'dark:bg-teal-900/20 dark:text-teal-400',
    };
    const darkColor = darkColorMap[color] || '';

    return (
        <div onClick={onClick} className={`glass-card p-4 sm:p-5 lg:p-6 rounded-[2rem] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}>
            <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                <div className={`p-3.5 rounded-2xl ${color} ${darkColor} shadow-inner`}>{icon}</div>
                {trendUp !== null && (
                    <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${trendUp ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                        <Icon name={trendUp ? 'trending-up' : 'trending-down'} size={12} /> {trend}
                    </div>
                )}
            </div>
            <div>
                <h4 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1 tracking-wide">{title}</h4>
                <p className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
}

export default MetricCard;
