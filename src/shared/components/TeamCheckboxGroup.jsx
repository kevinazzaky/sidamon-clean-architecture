// --- KOMPONEN CHECKBOX DIPISAH AGAR SCROLL TIDAK RESET ---
export function TeamCheckboxGroup({ title, roleFilter, isOptional, filteredResources, formData, setFormData, teamField = 'team' }) {
    const groupResources = filteredResources.filter(roleFilter);
    if (groupResources.length === 0) return null;

    return (
        <div className="mb-3">
            <h4 className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded mb-1.5 flex justify-between items-center">
                <span>{title}</span>
                {isOptional && <span className="font-normal italic text-slate-500"></span>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {groupResources.map(res => (
                    <label key={res.id} className="flex items-start space-x-2 text-sm cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors">
                        <input
                            type="checkbox"
                            className="mt-0.5 rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            checked={(formData[teamField] || []).includes(res.name)}
                            onChange={(e) => {
                                const newTeam = e.target.checked
                                    ? [...(formData[teamField] || []), res.name]
                                    : (formData[teamField] || []).filter(n => n !== res.name);
                                const updates = { [teamField]: newTeam };

                                // Jika dicentang di sub-tim biasa, hapus dari surveyorTeam (mencegah centang ganda)
                                if (e.target.checked && teamField === 'team' && formData.surveyorTeam && formData.surveyorTeam.includes(res.name)) {
                                    updates.surveyorTeam = formData.surveyorTeam.filter(n => n !== res.name);
                                }

                                setFormData({ ...formData, ...updates });
                            }}
                        />
                        <div className="flex flex-col">
                            <span className="text-[12px] font-medium leading-tight">{res.name}</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

export default TeamCheckboxGroup;
