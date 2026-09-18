import React from 'react';
import Icon from './Icon';

export function TeamVisionaryMultiSelect({ title, filteredResources, formData, setFormData, teamField = 'surveyorTeam' }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const searchResults = filteredResources.filter(r =>
        searchTerm === '' ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const togglePerson = (name) => {
        const current = formData[teamField] || [];
        if (current.includes(name)) {
            setFormData({ ...formData, [teamField]: current.filter(n => n !== name) });
        } else {
            const updates = { [teamField]: [...current, name] };

            // Jika diplot ke surveyorTeam, hapus dari sub-tim biasa (team) agar tidak tercentang ganda
            if (teamField === 'surveyorTeam' && formData.team && formData.team.includes(name)) {
                updates.team = formData.team.filter(n => n !== name);
            }

            setFormData({ ...formData, ...updates });
        }
    };

    return (
        <div className="mb-4 bg-blue-50/40 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/60 p-3 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h4 className="text-[12px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Icon name="users" size={14} className="text-blue-600 dark:text-blue-400" />
                    {title}
                </h4>
                <div className="relative w-full sm:w-1/2">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400">
                        <Icon name="search" size={12} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama/jabatan (cth: arsitek)..."
                        className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700/50 rounded-lg text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm dark:text-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {(formData[teamField] || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-blue-100 dark:border-blue-800/50 shadow-inner min-h-[36px] items-center">
                    <span className="text-[9px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Terpilih:</span>
                    {(formData[teamField] || []).map(name => (
                        <div key={name} className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm group">
                            <span>{name}</span>
                            <button
                                type="button"
                                onClick={() => togglePerson(name)}
                                className="text-blue-200 hover:text-white bg-blue-700 hover:bg-red-500 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors"
                                title="Hapus"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="max-h-32 overflow-y-auto pr-1.5 space-y-1">
                {searchResults.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-3">Tidak ditemukan personil dengan pencarian "{searchTerm}".</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {searchResults.map(res => {
                            const isSelected = (formData[teamField] || []).includes(res.name);
                            return (
                                <label
                                    key={res.id}
                                    className={`flex items-start space-x-2 text-sm cursor-pointer p-1.5 rounded-lg transition-all border ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-slate-300 dark:border-slate-600 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 transition-colors"
                                        checked={isSelected}
                                        onChange={() => togglePerson(res.name)}
                                    />
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{res.name}</span>
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{res.role}</span>
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamVisionaryMultiSelect;
