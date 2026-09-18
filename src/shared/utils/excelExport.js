import * as XLSX from 'xlsx-js-style';
import { formatDateIndo } from './dateHelpers';
import { fuzzyMatchName } from './nameMatch';
import { getCategoryFromRole, getEffectiveEmpCategory, getMicroStatus, getLPSEHierarchyScore } from './projectCalculations';

export const exportProjectExcel = (computedProjects, calculatedResources, options) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let filteredProjects = [...computedProjects].filter(p => {
        if (p.notStarted) return false;
        if (p.computedStatus === 'Done') {
            if (p.completedAt) {
                const d = new Date(p.completedAt);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) return true;
            }
            return false;
        }
        return true;
    });
    let filteredResources = [...calculatedResources];
    let title = "Laporan Eksekutif";

    if (options.section === 'ProyekSaja') title = "Laporan Eksekutif Status Proyek";
    if (options.section === 'PegawaiSaja') title = "Laporan Eksekutif Penugasan Personil";

    if (options.projectType !== 'Semua') {
        title += ` (Tipe: ${options.projectType})`;
        filteredProjects = filteredProjects.filter(p => {
            const pType = (p.type || '').toLowerCase();
            if (options.projectType === 'Perencanaan') return pType.includes('perencana');
            if (options.projectType === 'Pengawasan') return pType === 'pengawasan' || pType === 'supervisi';
            if (options.projectType === 'Manajemen Konstruksi') return pType.includes('manajemen konstruksi') || pType === 'mk';
            return true;
        });
    }

    filteredProjects.sort((a, b) => {
        const dateA = a.spmk ? new Date(a.spmk).getTime() : 0;
        const dateB = b.spmk ? new Date(b.spmk).getTime() : 0;
        return dateB - dateA;
    });

    const aoa = [];
    const merges = [];
    const cardRanges = [];
    let rowIndex = 0;

    const addRow = (row, mergeToCol = -1) => {
        aoa.push(row);
        if (mergeToCol > 0) {
            merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: mergeToCol } });
        }
        rowIndex++;
    };

    addRow([title], 7);
    addRow([`Tanggal Cetak: ${formatDateIndo(new Date().toISOString().split('T')[0])}`], 7);
    addRow([]);

    if (options.section !== 'PegawaiSaja') {
        addRow(["BAGIAN A: LAPORAN STATUS PROYEK"], 7);
        if (filteredProjects.length === 0) {
            addRow(["Tidak ada proyek aktif untuk kriteria ini."], 7);
        } else {
            const bagianAStart = rowIndex;
            const categoriesToRender = (options.projectType !== 'Semua' ? [options.projectType] : ['Perencanaan', 'Pengawasan', 'Manajemen Konstruksi']).map(kategoriTipe => {
                return {
                    kategoriTipe,
                    proyeksInKategori: filteredProjects.filter(p => {
                        const pType = (p.type || '').toLowerCase();
                        if (kategoriTipe === 'Perencanaan') return pType.includes('perencana');
                        if (kategoriTipe === 'Pengawasan') return pType === 'pengawasan' || pType === 'supervisi';
                        if (kategoriTipe === 'Manajemen Konstruksi') return pType.includes('manajemen konstruksi') || pType === 'mk';
                        return false;
                    })
                };
            }).filter(cat => cat.proyeksInKategori.length > 0);

            if (options.projectType === 'Semua') {
                const mappedIds = new Set(categoriesToRender.flatMap(g => g.proyeksInKategori.map(p => p.id)));
                const others = filteredProjects.filter(p => !mappedIds.has(p.id));
                if (others.length > 0) {
                    categoriesToRender.push({ kategoriTipe: 'Lainnya', proyeksInKategori: others });
                }
            }

            categoriesToRender.forEach(cat => {
                if (options.projectType === 'Semua') {
                    addRow([`Sub Bab: ${cat.kategoriTipe}`], 7);
                }

                cat.proyeksInKategori.forEach(p => {
                    const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');

                    const startRow = rowIndex;

                    addRow([`NAMA PROYEK: ${p.name || '-'}`], 7);
                    if (isPengawasan) {
                        addRow([
                            `Klien: ${p.client || '-'}`,
                            `Tanggal SPMK: ${p.spmk ? formatDateIndo(p.spmk) : '-'}`,
                            `Tenggat Kontrak: ${p.deadline ? formatDateIndo(p.deadline) : '-'}`,
                            `Status Makro: ${p.computedStatus || '-'}`,
                            "",
                            "",
                            "",
                            ""
                        ]);
                    } else {
                        addRow([
                            `Klien: ${p.client || '-'}`,
                            `Team Leader: ${p.teamLeader || '-'}`,
                            `Tanggal SPMK: ${p.spmk ? formatDateIndo(p.spmk) : '-'}`,
                            `Tenggat Kontrak: ${p.deadline ? formatDateIndo(p.deadline) : '-'}`,
                            `Status Makro: ${p.computedStatus || '-'}`,
                            "",
                            "",
                            ""
                        ]);
                    }

                    addRow(["Rincian Penugasan & Target Sub-Tim"], 7);

                    let sumStart, sumEnd;

                    if (isPengawasan) {
                        addRow(["Nama Personil", "Peran", "Man Month", "Deadline Spesifik", "Status Lapangan", "Gaji Total", "Gaji Bank", "Gaji Tunai"]);
                        sumStart = rowIndex;
                        if (!p.team || p.team.length === 0) {
                            addRow(["Belum ada personil diplot.", "", "", "", "", "", "", ""], 7);
                        } else {
                            const sortedTeam = [...p.team].sort((a, b) => {
                                const roleA = p.pengawasanDetails?.[a]?.role || 'Inspector';
                                const roleB = p.pengawasanDetails?.[b]?.role || 'Inspector';
                                return getLPSEHierarchyScore(roleA) - getLPSEHierarchyScore(roleB);
                            });
                            sortedTeam.forEach(member => {
                                const details = p.pengawasanDetails?.[member] || {};
                                addRow([
                                    member,
                                    details.role || 'Inspector',
                                    details.manMonth || '-',
                                    details.deadline ? formatDateIndo(details.deadline) : '-',
                                    details.statusTurun || 'Tidak Turun',
                                    "",
                                    "",
                                    ""
                                ]);
                            });
                        }
                    } else {
                        addRow(["Kategori Sub Tim", "Target Progress", "Tenggat Waktu Tim", "Status Target", "Personil Terploting", "Gaji Total", "Gaji Bank", "Gaji Tunai"]);
                        sumStart = rowIndex;
                        const cats = ['Arsitek', 'Struktur', 'MEP', 'QS', 'Tata Ruang', 'Lainnya', 'Surveyor'];
                        let hasAny = false;
                        cats.forEach(cat => {
                            let catMembers = [];
                            if (cat === 'Surveyor') {
                                catMembers = p.surveyorTeam || [];
                            } else {
                                catMembers = (p.team || []).filter(m => {
                                    const isSurveyor = (p.surveyorTeam || []).includes(m);
                                    if (isSurveyor) return false;
                                    const r = calculatedResources.find(res => fuzzyMatchName(res.name, m));
                                    if (cat === 'Lainnya') {
                                        const matchesOther = ['Arsitek', 'Struktur', 'MEP', 'QS', 'Tata Ruang'].some(other => getCategoryFromRole(r?.role) === other);
                                        return !matchesOther;
                                    } else {
                                        return getCategoryFromRole(r?.role) === cat;
                                    }
                                });
                            }
                            if (catMembers.length > 0) {
                                catMembers.sort((a, b) => {
                                    const resA = calculatedResources.find(r => r.name === a);
                                    const resB = calculatedResources.find(r => r.name === b);
                                    return getLPSEHierarchyScore(resA?.role) - getLPSEHierarchyScore(resB?.role);
                                });
                                hasAny = true;
                                const details = p.categoryDetails?.[cat] || {};
                                const progressVal = details.progress || 0;
                                const statusTarget = getMicroStatus(progressVal, details.deadline);
                                addRow([
                                    cat,
                                    `${progressVal}% Tercapai`,
                                    details.deadline ? formatDateIndo(details.deadline) : '-',
                                    statusTarget,
                                    catMembers.join(', '),
                                    "",
                                    "",
                                    ""
                                ]);
                            }
                        });
                        if (!hasAny) {
                            addRow(["Belum ada personil diplot.", "", "", "", "", "", "", ""], 7);
                        }
                    }
                    sumEnd = rowIndex - 1;

                    const totalProyekRow = rowIndex;
                    addRow(["", "", "", "", "TOTAL PROYEK", { t: 'n', f: `SUBTOTAL(9,F${sumStart + 1}:F${sumEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,G${sumStart + 1}:G${sumEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,H${sumStart + 1}:H${sumEnd + 1})` }]);

                    cardRanges.push({ s: { r: startRow, c: 0 }, e: { r: rowIndex - 1, c: 7 } });

                    addRow([]);
                    addRow([]);
                });
            });

            const bagianAEnd = rowIndex - 1;
            addRow([]);
            const totalStartRow = rowIndex;
            addRow(["", "", "", "", "TOTAL KESELURUHAN PROYEK", "Gaji Total", "Gaji Bank", "Gaji Tunai"]);
            addRow(["", "", "", "", "", { t: 'n', f: `SUBTOTAL(9,F${bagianAStart + 1}:F${bagianAEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,G${bagianAStart + 1}:G${bagianAEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,H${bagianAStart + 1}:H${bagianAEnd + 1})` }]);
            merges.push({ s: { r: totalStartRow, c: 4 }, e: { r: totalStartRow + 1, c: 4 } });
            cardRanges.push({ s: { r: totalStartRow, c: 4 }, e: { r: totalStartRow + 1, c: 7 } });
        }
        addRow([]);
    }

    if (options.section !== 'ProyekSaja') {
        addRow(["BAGIAN B: LAPORAN RINCIAN PENUGASAN PEGAWAI"], 7);
        if (filteredResources.length === 0) {
            addRow(["Tidak ada personil untuk kriteria ini."], 7);
        } else {
            const bagianBStart = rowIndex;
            const resourcesBySubTeam = {};
            filteredResources.forEach(res => {
                const activeProjectsForRes = filteredProjects.filter(p => {
                    const inTeam = (p.team || []).some(m => fuzzyMatchName(m, res.name));
                    const isLeader = fuzzyMatchName(p.teamLeader, res.name);
                    const inSurveyor = (p.surveyorTeam || []).some(m => fuzzyMatchName(m, res.name));
                    return (inTeam || isLeader || inSurveyor) && !p.notStarted;
                });
                if (options.projectType !== 'Semua' && activeProjectsForRes.length === 0) return;

                const subTeam = getCategoryFromRole(res.role);
                if (!resourcesBySubTeam[subTeam]) resourcesBySubTeam[subTeam] = [];
                resourcesBySubTeam[subTeam].push({ res, activeProjectsForRes });
            });

            const subTeamKeys = Object.keys(resourcesBySubTeam).sort();
            if (subTeamKeys.length === 0) {
                addRow(["Tidak ada personil yang terlibat di kriteria ini."], 7);
            } else {
                subTeamKeys.forEach(subTeam => {
                    addRow([`Sub Bab: Tim ${subTeam}`], 7);
                    const sortedResources = [...resourcesBySubTeam[subTeam]].sort((a, b) => getLPSEHierarchyScore(a.res.role) - getLPSEHierarchyScore(b.res.role) || a.res.name.localeCompare(b.res.name));
                    sortedResources.forEach(({ res, activeProjectsForRes }) => {
                        const startRow = rowIndex;
                        addRow([`Nama: ${res.name}`, `Peran: ${res.role}`, `Jumlah Proyek: ${activeProjectsForRes.length} Proyek Aktif`, "", "", "", "", ""]);
                        merges.push({ s: { r: rowIndex - 1, c: 2 }, e: { r: rowIndex - 1, c: 4 } });

                        addRow(["Nama Proyek", "Peran/Tim Lapangan", "Man Month", "Deadline Spesifik Tugas", "Status Lapangan", "Gaji Total", "Gaji Bank", "Gaji Tunai"]);

                        if (activeProjectsForRes.length === 0) {
                            addRow(["Sedang tidak memegang proyek aktif (Available).", "", "", "", "", "", "", ""], 7);
                        } else {
                            const categories = ['Perencanaan', 'Pengawasan', 'Manajemen Konstruksi'];
                            const renderRowData = (p) => {
                                const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
                                let deadlineStr = '-';
                                let roleStr = '-';
                                let statusLapangan = '-';
                                let manMonthStr = '-';

                                if (fuzzyMatchName(p.teamLeader, res.name)) {
                                    roleStr = 'Team Leader';
                                    if (isPengawasan) {
                                        deadlineStr = p.deadline ? formatDateIndo(p.deadline) : '-';
                                        const detailsKey = Object.keys(p.pengawasanDetails || {}).find(k => fuzzyMatchName(k, res.name));
                                        const details = detailsKey ? p.pengawasanDetails[detailsKey] : {};
                                        statusLapangan = details.statusTurun || 'Tidak Turun';
                                        manMonthStr = details.manMonth || '-';
                                    } else {
                                        statusLapangan = p.computedStatus || '-';
                                        const cats = ['Arsitek', 'QS', 'Struktur', 'MEP', 'Tata Ruang', 'Surveyor', 'Lainnya'];
                                        let minDate = null;
                                        let maxDate = null;
                                        cats.forEach(cat => {
                                            const d = p.categoryDetails?.[cat];
                                            if (d) {
                                                const startDateSource = d.startDate ? d.startDate : p.spmk;
                                                if (startDateSource) {
                                                    const sd = new Date(startDateSource);
                                                    if (!minDate || sd < minDate) minDate = sd;
                                                }
                                                if (d.deadline) {
                                                    const ed = new Date(d.deadline);
                                                    if (!maxDate || ed > maxDate) maxDate = ed;
                                                }
                                            }
                                        });
                                        if (minDate && maxDate) {
                                            minDate.setHours(0, 0, 0, 0);
                                            maxDate.setHours(0, 0, 0, 0);
                                            const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                                            if (diffDays > 0) {
                                                manMonthStr = parseFloat((diffDays / 30).toFixed(1)).toString();
                                            }
                                        }
                                        deadlineStr = maxDate ? formatDateIndo(maxDate.toISOString().split('T')[0]) : (p.deadline ? formatDateIndo(p.deadline) : '-');
                                    }
                                } else if (isPengawasan) {
                                    const detailsKey = Object.keys(p.pengawasanDetails || {}).find(k => fuzzyMatchName(k, res.name));
                                    const details = detailsKey ? p.pengawasanDetails[detailsKey] : {};
                                    deadlineStr = details.deadline ? formatDateIndo(details.deadline) : '-';
                                    roleStr = details.role || 'Inspector';
                                    statusLapangan = details.statusTurun || 'Tidak Turun';
                                    manMonthStr = details.manMonth || '-';
                                } else {
                                    const effectiveCat = getEffectiveEmpCategory(p, res.name, res.role);
                                    const details = p.categoryDetails?.[effectiveCat] || {};
                                    deadlineStr = details.deadline ? formatDateIndo(details.deadline) : '-';
                                    roleStr = effectiveCat === 'Surveyor' ? 'Tim Surveyor' : effectiveCat;

                                    const startDateSource = details.startDate ? details.startDate : p.spmk;
                                    if (startDateSource && details.deadline) {
                                        const startD = new Date(startDateSource);
                                        const endD = new Date(details.deadline);
                                        startD.setHours(0, 0, 0, 0);
                                        endD.setHours(0, 0, 0, 0);
                                        const diffDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
                                        if (diffDays > 0) {
                                            manMonthStr = parseFloat((diffDays / 30).toFixed(1)).toString();
                                        }
                                    }
                                    statusLapangan = getMicroStatus(details.progress || 0, details.deadline);
                                }

                                return [p.name, roleStr, manMonthStr, deadlineStr, statusLapangan, "", "", ""];
                            };

                            const dataStartRow = rowIndex;

                            if (options.projectType === 'Semua') {
                                const grouped = categories.map(kategoriTipe => {
                                    return {
                                        kategoriTipe,
                                        proyeks: activeProjectsForRes.filter(p => {
                                            const pType = (p.type || '').toLowerCase();
                                            if (kategoriTipe === 'Perencanaan') return pType.includes('perencana');
                                            if (kategoriTipe === 'Pengawasan') return pType === 'pengawasan' || pType === 'supervisi';
                                            if (kategoriTipe === 'Manajemen Konstruksi') return pType.includes('manajemen konstruksi') || pType === 'mk';
                                            return false;
                                        })
                                    };
                                }).filter(cat => cat.proyeks.length > 0);

                                const mappedIds = new Set(grouped.flatMap(g => g.proyeks.map(p => p.id)));
                                const others = activeProjectsForRes.filter(p => !mappedIds.has(p.id));
                                if (others.length > 0) {
                                    grouped.push({ kategoriTipe: 'Lainnya', proyeks: others });
                                }

                                grouped.forEach(cat => {
                                    addRow([cat.kategoriTipe, "", "", "", "", "", "", ""], 7);
                                    cat.proyeks.forEach(p => {
                                        addRow(renderRowData(p));
                                    });
                                });
                            } else {
                                activeProjectsForRes.forEach(p => {
                                    addRow(renderRowData(p));
                                });
                            }

                            const dataEndRow = rowIndex - 1;
                            const totalPegawaiRow = rowIndex;
                            addRow(["", "", "", "", "TOTAL PEGAWAI", { t: 'n', f: `SUBTOTAL(9,F${dataStartRow + 1}:F${dataEndRow + 1})` }, { t: 'n', f: `SUBTOTAL(9,G${dataStartRow + 1}:G${dataEndRow + 1})` }, { t: 'n', f: `SUBTOTAL(9,H${dataStartRow + 1}:H${dataEndRow + 1})` }]);
                        }
                        cardRanges.push({ s: { r: startRow, c: 0 }, e: { r: rowIndex - 1, c: 7 } });

                        addRow([]);
                        addRow([]);
                    });
                });

                const bagianBEnd = rowIndex - 1;
                addRow([]);
                const totalStartRow = rowIndex;
                addRow(["", "", "", "", "TOTAL KESELURUHAN PEGAWAI", "Gaji Total", "Gaji Bank", "Gaji Tunai"]);
                addRow(["", "", "", "", "", { t: 'n', f: `SUBTOTAL(9,F${bagianBStart + 1}:F${bagianBEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,G${bagianBStart + 1}:G${bagianBEnd + 1})` }, { t: 'n', f: `SUBTOTAL(9,H${bagianBStart + 1}:H${bagianBEnd + 1})` }]);
                merges.push({ s: { r: totalStartRow, c: 4 }, e: { r: totalStartRow + 1, c: 4 } });
                cardRanges.push({ s: { r: totalStartRow, c: 4 }, e: { r: totalStartRow + 1, c: 7 } });
            }
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;

    // Add Styling for Borders and Bold
    for (let R = 0; R < rowIndex; ++R) {
        let isEmptyRow = true;
        for (let C = 0; C < 8; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellRef] && ((ws[cellRef].v !== undefined && ws[cellRef].v !== "") || ws[cellRef].f !== undefined)) {
                isEmptyRow = false;
                break;
            }
        }

        if (!isEmptyRow) {
            // Find if this row is part of a card
            let card = cardRanges.find(c => R >= c.s.r && R <= c.e.r);

            for (let C = 0; C < 8; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

                let isBold = false;
                let align = { vertical: "center", wrapText: true };
                let fill = undefined;

                const val = ws[cellRef].v;
                if (typeof val === 'string') {
                    if (val.startsWith('NAMA PROYEK:') || val.startsWith('BAGIAN') || val.startsWith('Sub Bab:') || val.includes('Laporan Eksekutif') || val === 'Rincian Penugasan & Target Sub-Tim') {
                        isBold = true;
                    }
                    if (val.startsWith('NAMA PROYEK:') || val.startsWith('Nama:') || val.startsWith('Peran:') || val.startsWith('Jumlah Proyek:')) {
                        fill = { fgColor: { rgb: "F1F5F9" } }; // Light gray background for card headers
                    }

                    const catSeparators = ['Perencanaan', 'Pengawasan', 'Manajemen Konstruksi', 'Lainnya'];
                    if (catSeparators.includes(val)) {
                        const nextCellRef = XLSX.utils.encode_cell({ r: R, c: 1 });
                        if (!ws[nextCellRef] || ws[nextCellRef].v === "") {
                            isBold = true;
                            align.horizontal = "center";
                            fill = { fgColor: { rgb: "F1F5F9" } };
                        }
                    }

                    const headers = ["Nama Personil", "Peran", "Man Month", "Deadline Spesifik", "Status Lapangan", "Gaji Total", "Gaji Bank", "Gaji Tunai", "Kategori Sub Tim", "Target Progress", "Tenggat Waktu Tim", "Status Target", "Personil Terploting", "Nama Proyek", "Peran/Tim Lapangan", "Deadline Spesifik Tugas"];
                    if (headers.includes(val)) {
                        isBold = true;
                        align.horizontal = "center";
                    }
                    if (val.startsWith("Klien:") || val.startsWith("Team Leader:") || val.startsWith("Tanggal SPMK:") || val.startsWith("Tenggat Kontrak:") || val.startsWith("Status Makro:") || val.startsWith("Nama:") || val.startsWith("Peran:") || val.startsWith("Jumlah Proyek:")) {
                        isBold = true;
                    }
                }

                // Determine borders based on card position
                let bTop, bBottom, bLeft, bRight;
                if (card) {
                    if (C >= card.s.c && C <= card.e.c) {
                        bTop = 'thin'; bBottom = 'thin'; bLeft = 'thin'; bRight = 'thin';
                        if (R === card.s.r) bTop = 'medium';
                        if (R === card.e.r) bBottom = 'medium';
                        if (C === card.s.c) bLeft = 'medium';
                        if (C === card.e.c) bRight = 'medium';
                    }
                } else {
                    bTop = 'medium'; bBottom = 'medium'; bLeft = 'medium'; bRight = 'medium';
                }

                ws[cellRef].s = {
                    font: { bold: isBold },
                    fill: fill,
                    alignment: align
                };

                if (bTop) {
                    ws[cellRef].s.border = {
                        top: { style: bTop, color: { rgb: "000000" } },
                        bottom: { style: bBottom, color: { rgb: "000000" } },
                        left: { style: bLeft, color: { rgb: "000000" } },
                        right: { style: bRight, color: { rgb: "000000" } }
                    };
                }
            }
        }
    }

    // Set column widths for better visibility
    ws['!cols'] = [
        { wch: 35 }, // Nama Proyek
        { wch: 20 }, // Peran
        { wch: 15 }, // Man Month
        { wch: 20 }, // Deadline
        { wch: 15 }, // Status Lapangan
        { wch: 15 }, // Gaji Total
        { wch: 15 }, // Gaji Bank
        { wch: 15 }  // Gaji Tunai
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_${new Date().getTime()}.xlsx`);
};
