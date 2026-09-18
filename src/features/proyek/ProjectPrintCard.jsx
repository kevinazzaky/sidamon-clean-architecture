import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import { formatDateIndo } from '../../shared/utils/dateHelpers';
import { fuzzyMatchName } from '../../shared/utils/nameMatch';
import { getCategoryFromRole, getMicroStatus, getLPSEHierarchyScore } from '../../shared/utils/projectCalculations';

const normalizeProjectType = (typeStr) => {
    if (!typeStr) return '-';
    const lower = typeStr.toLowerCase();
    if (lower.includes('perencana')) return 'Perencanaan';
    if (lower.includes('pengawas') || lower === 'supervisi') return 'Pengawasan';
    if (lower.includes('manajemen konstruksi') || lower === 'mk') return 'Manajemen Konstruksi';
    return typeStr;
};

export default function ProjectPrintCard({ project: p }) {
    const { resources, calculatedResources } = useContext(AppContext);
    const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
    return (
        <div key={p.id} className="border-2 border-slate-300 dark:border-slate-700 p-4" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-3">
                <div>
                    <h3 className="text-base font-bold uppercase">{p.name}</h3>
                    <p className="text-xs uppercase tracking-wide mt-0.5">
                        {normalizeProjectType(p.type)} {' | '}Klien: {p.client || '-'}
                    </p>
                    {p.type?.toLowerCase().includes('perencana') && p.divisiKontrol && (
                        <p className="text-xs font-bold mt-1 text-gray-800">Divisi Kontrol: {p.divisiKontrol}</p>
                    )}
                    {!isPengawasan && <p className="text-xs font-bold mt-1 text-gray-800">Team Leader: {p.teamLeader || 'Belum Ditentukan'}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-bold border border-slate-300 dark:border-slate-700 px-2 py-1 inline-block uppercase whitespace-nowrap">Status Makro: {p.computedStatus}</p>

                    {(isPengawasan || p.type?.toLowerCase().includes('perencana')) && <p className="text-xs mt-1 whitespace-nowrap font-semibold text-gray-800">Tanggal SPMK: {p.spmk ? formatDateIndo(p.spmk) : '-'}</p>}
                    <p className="text-xs mt-1 whitespace-nowrap">Tenggat Kontrak: {p.deadline ? formatDateIndo(p.deadline) : '-'}</p>
                </div>
            </div>

            <div>
                <h4 className="text-[11px] font-bold uppercase mb-2">Rincian Penugasan & Target Sub-Tim</h4>
                {isPengawasan ? (
                    <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 mb-1">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[35%]">Nama Personil</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[25%]">Peran</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Man Month</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Status Lapangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...(p.team || [])].sort((a, b) => {
                                const roleA = p.pengawasanDetails?.[a]?.role || 'Inspector';
                                const roleB = p.pengawasanDetails?.[b]?.role || 'Inspector';
                                return getLPSEHierarchyScore(roleA) - getLPSEHierarchyScore(roleB);
                            }).map(member => {
                                const details = p.pengawasanDetails?.[member] || {};
                                return (
                                    <tr key={member}>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-bold">{member}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5">{details.role || 'Inspector'}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center">{details.manMonth || '-'}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5">{details.statusTurun || 'Tidak Turun'}</td>
                                    </tr>
                                )
                            })}
                            {(!p.team || p.team.length === 0) && (
                                <tr><td colSpan="4" className="border border-slate-300 dark:border-slate-700 p-1.5 text-center italic">Belum ada personil diplot.</td></tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 mb-1">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Kategori Sub Tim</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[15%]">Target Progress</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Tenggat Waktu Tim</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[20%]">Status Target</th>
                                <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left w-[25%]">Personil Terploting</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['Arsitek', 'Struktur', 'MEP', 'QS', 'Tata Ruang', 'Lainnya', 'Surveyor'].map(cat => {
                                let catMembers = [];
                                if (cat === 'Surveyor') {
                                    catMembers = p.surveyorTeam || [];
                                } else {
                                    catMembers = (p.team || []).filter(m => {
                                        const isSurveyor = (p.surveyorTeam || []).includes(m);
                                        if (isSurveyor) return false;
                                        const r = resources.find(res => fuzzyMatchName(res.name, m));

                                        if (cat === 'Lainnya') {
                                            const matchesOther = ['Arsitek', 'Struktur', 'MEP', 'QS', 'Tata Ruang'].some(other => getCategoryFromRole(r?.role) === other);
                                            return !matchesOther;
                                        } else {
                                            return getCategoryFromRole(r?.role) === cat;
                                        }
                                    });
                                }

                                if (catMembers.length === 0) return null;

                                catMembers.sort((a, b) => {
                                    const resA = calculatedResources.find(r => r.name === a);
                                    const resB = calculatedResources.find(r => r.name === b);
                                    return getLPSEHierarchyScore(resA?.role) - getLPSEHierarchyScore(resB?.role);
                                });

                                const details = p.categoryDetails?.[cat] || {};
                                const progressVal = details.progress || 0;
                                const statusTarget = getMicroStatus(progressVal, details.deadline);

                                return (
                                    <tr key={cat}>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-bold">{cat}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5">
                                            {progressVal}% Tercapai
                                        </td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5">{details.deadline ? formatDateIndo(details.deadline) : '-'}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-semibold">{statusTarget}</td>
                                        <td className="border border-slate-300 dark:border-slate-700 p-1.5">{catMembers.join(', ')}</td>
                                    </tr>
                                )
                            })}
                            {(!p.team || p.team.length === 0) && (
                                <tr><td colSpan="5" className="border border-slate-300 dark:border-slate-700 p-1.5 text-center italic">Belum ada personil diplot.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export { normalizeProjectType };
