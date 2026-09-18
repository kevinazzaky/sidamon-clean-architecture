import Icon from './Icon';

export function StatusBadge({ status }) {
    let style = 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
    if (status === 'Done') style = 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    else if (status === 'On Progress') style = 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    else if (status === 'Terlambat') style = 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400';
    else if (status === 'Beresiko') style = 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    else if (status === 'Not Started') style = 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';


    return (

        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${style} flex items-center gap-1.5 w-max`}>
            {status === 'Done' && <Icon name="check-circle-2" size={12} />}
            {status === 'On Progress' && <Icon name="clock" size={12} />}
            {status === 'Terlambat' && <Icon name="alert-triangle" size={12} />}
            {status === 'Beresiko' && <Icon name="clock" size={12} />}
            {status === 'Not Started' && <Icon name="calendar" size={12} />}
            {status}
        </span>

    );
}

export default StatusBadge;
