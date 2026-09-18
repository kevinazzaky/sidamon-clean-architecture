import { fuzzyMatchName } from './nameMatch';

export const calculateComputedStatus = (project) => {
    if (project.isPending) return "Pending";

    const baseStatus = project.status === "On Track" ? "On Progress" : (project.status || "On Progress");
    if (baseStatus === "Done" || project.progress >= 100) return "Done";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // LOGIC NOT STARTED UNTUK PENGAWASAN
    const isPengawasan = project.type?.toLowerCase().includes('pengawas') || project.type?.toLowerCase().includes('manajemen konstruksi');
    if (isPengawasan) {
        if (project.spmk) {
            const spmkDate = new Date(project.spmk);
            spmkDate.setHours(0, 0, 0, 0);
            if (spmkDate > today) return "Not Started";
        } else {
            return "Not Started";
        }
    }

    if (!project.deadline) return baseStatus;

    const deadlineDate = new Date(project.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    if (isNaN(deadlineDate.getTime())) return baseStatus;

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        if (isPengawasan) return "Done";
        return "Terlambat";
    } else if (diffDays <= 7) {
        if (isPengawasan) return "On Progress";
        return "Beresiko";
    }
    return baseStatus;
};

export const getMicroStatus = (progress, deadlineStr) => {
    if (progress >= 100) return "Done";
    if (!deadlineStr) return "Belum Diatur";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dDate = new Date(deadlineStr);
    dDate.setHours(0, 0, 0, 0);

    if (isNaN(dDate.getTime())) return "Belum Diatur";

    const diffTime = dDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Terlambat";
    if (diffDays <= 3) return "Beresiko"; // Risiko Mikro H-3
    return "On Progress";
};

export const getLPSEHierarchyScore = (roleStr) => {
    if (!roleStr) return 99;
    const r = roleStr.toLowerCase();
    if (r.includes('team leader') || r.includes('ketua tim')) return 1;
    if (r.includes('ahli utama')) return 2;
    if (r.includes('ahli madya')) return 3;
    if (r.includes('ahli muda')) return 4;
    if (r.includes('ahli') || r.includes('expert') || r.includes('spesialis')) return 5;
    if (r.includes('inspector') || r.includes('inspektur') || r.includes('pengawas')) return 6;
    if (r.includes('asisten') || r.includes('sub profesional') || r.includes('sub-profesional')) return 7;
    if (r.includes('surveyor') || r.includes('survey')) return 8;
    if (r.includes('drafter') || r.includes('cad') || r.includes('juru gambar')) return 9;
    if (r.includes('pendukung') || r.includes('support')) return 10;
    if (r.includes('administrasi') || r.includes('admin') || r.includes('sekretaris') || r.includes('operator')) return 1000;
    return 50;
};

export const getCategoryFromRole = (roleStr) => {
    if (!roleStr) return 'Lainnya';
    const roleLower = roleStr.toLowerCase();
    if (roleLower.includes('arsitek')) return 'Arsitek';
    if (roleLower === 'qs' || roleLower.includes('quantity')) return 'QS';
    if (roleLower.includes('struktur')) return 'Struktur';
    if (roleLower.includes('mep')) return 'MEP';
    if (roleLower.includes('tata ruang') || roleLower.includes('planologi')) return 'Tata Ruang';
    return 'Lainnya';
};

export const getEffectiveEmpCategory = (project, employeeName, employeeRole) => {
    if (project.type?.toLowerCase().includes('perencana') && project.surveyorTeam?.includes(employeeName)) {
        return 'Surveyor';
    }
    return getCategoryFromRole(employeeRole);
};

export const calculateLeaderKPI = (employee, allProjects) => {
    const isKordinator = employee.level?.startsWith('Kordinator Divisi');
    const kordinatorDivisi = isKordinator ? employee.level.replace('Kordinator Divisi ', 'Divisi ') : null;

    const ledProjects = allProjects.filter(p => fuzzyMatchName(p.teamLeader, employee.name));
    const subProjects = allProjects.filter(p => (p.team || []).some(m => fuzzyMatchName(m, employee.name)));
    const kontrolProjects = isKordinator ? allProjects.filter(p => p.type?.toLowerCase().includes('perencana') && p.divisiKontrol === kordinatorDivisi) : [];

    // Gabungkan proyek dan hapus duplikat
    const involvedProjectsMap = new Map();
    ledProjects.forEach(p => involvedProjectsMap.set(p.id, p));
    subProjects.forEach(p => involvedProjectsMap.set(p.id, p));
    kontrolProjects.forEach(p => involvedProjectsMap.set(p.id, p));
    const allInvolvedProjects = Array.from(involvedProjectsMap.values());

    const involvedProjects = allInvolvedProjects.filter(p => {
        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
        if (isPengawasan) {
            const statusTurun = p.pengawasanDetails?.[employee.name]?.statusTurun || 'Tidak Turun';
            if (statusTurun === 'Tidak Turun') return false;
        }
        return true;
    });

    const activeProjects = involvedProjects.filter(p => p.status !== "Done" && p.computedStatus !== "Done" && p.computedStatus !== "Pending");
    const totalActive = activeProjects.length;

    let score = 100;
    let delayedCount = 0;
    let atRiskCount = 0;
    let totalProgress = 0;
    let doneOnTimeBonus = 0;
    let staffDoneBonus = 0;

    involvedProjects.forEach(p => {
        const isLeader = fuzzyMatchName(p.teamLeader, employee.name) || (isKordinator && p.divisiKontrol === kordinatorDivisi);
        const empCat = getEffectiveEmpCategory(p, employee.name, employee.role);

        if (isLeader) {
            if (p.computedStatus === "Terlambat" && p.status !== "Done") {
                delayedCount++;
                score -= 10;
            } else if (p.computedStatus === "Beresiko" && p.status !== "Done") {
                atRiskCount++;
            }

            if (p.status === "Done" && p.computedStatus !== "Terlambat") {
                doneOnTimeBonus++;
                score += 20;
            }

            if (p.status !== "Done" && p.computedStatus !== "Done") {
                totalProgress += Number(p.progress || 0);
            }
        } else {
            // STAFF LOGIC (MICRO)
            let pProgress = 0;
            let pStatus = "On Progress";
            const microProgress = p.categoryDetails?.[empCat]?.progress ? Number(p.categoryDetails[empCat].progress) : 0;
            const individualDone = (p.individualStatus && p.individualStatus[employee.name] === true) || microProgress === 100;

            if (individualDone) {
                pProgress = 100;
                pStatus = "Done";
            } else if (p.categoryDetails && p.categoryDetails[empCat]) {
                const micro = p.categoryDetails[empCat];
                pProgress = microProgress;
                pStatus = getMicroStatus(pProgress, micro.deadline);
            } else {
                pProgress = Number(p.progress || 0);
                pStatus = p.computedStatus;
            }

            if (pStatus === "Terlambat" && p.status !== "Done") {
                delayedCount++;
                score -= 5;
            } else if (pStatus === "Beresiko" && p.status !== "Done") {
                atRiskCount++;
            }

            if (p.status === "Done" && p.computedStatus !== "Terlambat") {
                staffDoneBonus++;
                score += 15;
            }

            if (p.status !== "Done" && p.computedStatus !== "Done") {
                totalProgress += pProgress;
            }
        }
    });

    const avgProgress = totalActive > 0 ? totalProgress / totalActive : 0;
    const isOverloaded = (totalActive * 25) > 100;

    if (isOverloaded) {
        if (delayedCount === 0) score += ((totalActive - 4) * 10);
        else score -= 10;
    }
    score += (employee.manualPoints || 0);

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    let kpiStatus = "Sangat Baik";
    if (score < 60) kpiStatus = "Perlu Perhatian";
    else if (score < 80) kpiStatus = "Cukup";

    return {
        score: (totalActive === 0 && doneOnTimeBonus === 0 && staffDoneBonus === 0 && !(employee.manualPoints)) ? 100 : Math.round(score),
        delayed: delayedCount,
        atRisk: atRiskCount,
        avgProgress: Math.round(avgProgress),
        status: kpiStatus,
        isOverloaded,
        totalProjects: totalActive,
        rating: employee.rating || 3,
        bonusDone: doneOnTimeBonus,
        bonusDoneLeader: doneOnTimeBonus,
        bonusDoneStaff: staffDoneBonus
    };
};

export const calculateEmployeeKPI = (employee, allProjects) => {
    const allInvolvedProjects = allProjects.filter(p => {
        const members = Array.isArray(p.team) ? p.team : [];
        return members.includes(employee.name);
    });

    const involvedProjects = allInvolvedProjects.filter(p => {
        const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');
        if (isPengawasan) {
            const statusTurun = p.pengawasanDetails?.[employee.name]?.statusTurun || 'Tidak Turun';
            if (statusTurun === 'Tidak Turun') return false;
        }
        return true;
    });

    const activeProjects = involvedProjects.filter(p => p.status !== "Done" && p.computedStatus !== "Done" && p.computedStatus !== "Pending");

    const totalProjects = activeProjects.length;

    let delayedCount = 0;
    let atRiskCount = 0;
    let totalProgress = 0;
    let doneOnTimeBonus = 0;
    let score = 100;

    involvedProjects.forEach(p => {
        const empCat = getEffectiveEmpCategory(p, employee.name, employee.role);
        let pProgress = 0;
        let pStatus = "On Progress";
        const microProgress = p.categoryDetails?.[empCat]?.progress ? Number(p.categoryDetails[empCat].progress) : 0;
        const individualDone = (p.individualStatus && p.individualStatus[employee.name] === true) || microProgress === 100;

        if (individualDone) {
            pProgress = 100;
            pStatus = "Done";
        } else if (p.categoryDetails && p.categoryDetails[empCat]) {
            const micro = p.categoryDetails[empCat];
            pProgress = microProgress;
            pStatus = getMicroStatus(pProgress, micro.deadline);
        } else {
            pProgress = Number(p.progress || 0);
            pStatus = p.computedStatus;
        }

        if (p.status === "Done" && p.computedStatus !== "Terlambat") {
            doneOnTimeBonus++;
            score += 15;
        }

        if (p.status !== "Done" && p.computedStatus !== "Done") {
            totalProgress += pProgress;
        }

        if (pStatus === "Terlambat" && p.status !== "Done") delayedCount++;
        else if (pStatus === "Beresiko" && p.status !== "Done") atRiskCount++;
    });

    const avgProgress = totalProjects > 0 ? (totalProgress / totalProjects) : 0;
    const isOverloaded = (totalProjects * 25) > 100;

    score -= (delayedCount * 5);

    if (isOverloaded) {
        if (delayedCount === 0) {
            score += ((totalProjects - 4) * 10);
        } else {
            score -= 10;
        }
    }
    score += (employee.manualPoints || 0);

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    let kpiStatus = "Sangat Baik";
    if (score < 60) kpiStatus = "Perlu Perhatian";
    else if (score < 80) kpiStatus = "Cukup";

    return {
        score: (totalProjects === 0 && doneOnTimeBonus === 0 && !(employee.manualPoints)) ? 100 : Math.round(score),
        delayed: delayedCount,
        atRisk: atRiskCount,
        avgProgress: Math.round(avgProgress),
        status: kpiStatus,
        isOverloaded,
        totalProjects,
        rating: employee.rating || 3,
        bonusDone: doneOnTimeBonus
    };
};
