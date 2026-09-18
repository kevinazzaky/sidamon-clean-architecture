import { db } from './firebase';
import { encodeKey, decodeKey } from '../shared/utils/firebaseKeys';
import { fuzzyMatchName, getLinkedResourceName } from '../shared/utils/nameMatch';
import { autoCreateExpertIfMissing } from './expertService';

// pmc_data menyimpan projects & resources (Tim) dalam SATU objek gabungan —
// keduanya harus selalu ditulis lewat titik ini agar read-modify-write tetap atomik.
export const projectDataRef = () => db.ref('pmc_data');

export const ensureSeeded = async (googleScriptUrl) => {
    const ref = projectDataRef();
    const snapshot = await ref.once('value');
    if (!snapshot.exists()) {
        console.log("Firebase kosong. Memulai migrasi otomatis dari Google Sheets...");
        try {
            const response = await fetch(googleScriptUrl);
            const data = await response.json();

            // Transformasi awal saat migrasi
            const initialData = {
                projects: data.projects || [],
                resources: data.resources || [],
                inventory: data.inventory || []
            };

            await ref.set(initialData);
            console.log("Migrasi selesai!");
        } catch (error) {
            console.error("Gagal migrasi:", error);
        }
    }
};

// Pasang Listener Real-time utama untuk projects + resources (decode format tim lama & auto-heal nama)
export const subscribeProjectData = (onData, onError) => {
    const ref = projectDataRef();
    const handler = (snap) => {
        const data = snap.val() || { projects: [], resources: [], inventory: [] };

        // DEKODE TRIK JSON UNTUK DETAIL TIM
        const processedProjects = (data.projects || []).filter(Boolean).map(p => {
            let parsedTeam = [];
            let catDetails = {};
            let leader = "";
            let individualStatus = {};
            let pengawasanDetails = {};
            const rawString = Array.isArray(p.team) ? p.team.join(';') : (p.team || '');

            if (rawString.startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawString);
                    parsedTeam = parsed.members || [];
                    catDetails = parsed.details || {};
                    leader = parsed.leader || "";
                    individualStatus = parsed.individualStatus || {};
                    pengawasanDetails = parsed.pengawasanDetails || {};
                } catch (e) { parsedTeam = p.team || []; }
            } else {
                parsedTeam = p.team || [];
                catDetails = p.categoryDetails || {};
                leader = p.teamLeader || "";
                individualStatus = p.individualStatus || {};
                pengawasanDetails = p.pengawasanDetails || {};
            }

            const finalPengawasan = {};
            for (const k in pengawasanDetails || {}) {
                finalPengawasan[decodeKey(k)] = pengawasanDetails[k];
            }
            const finalIndividual = {};
            for (const k in individualStatus || {}) {
                finalIndividual[decodeKey(k)] = individualStatus[k];
            }

            return { ...p, team: parsedTeam, categoryDetails: catDetails, teamLeader: leader, individualStatus: finalIndividual, pengawasanDetails: finalPengawasan };
        });

        const processedResources = (data.resources || []).filter(Boolean).map(r => {
            let role = r.role || "";
            let level = "Staff";
            let manualPoints = 0;
            if (role.includes("|")) {
                const parts = role.split("|");
                role = parts[0];
                level = parts[1] || "Staff";
                manualPoints = parseInt(parts[2]) || 0;
            }
            return { ...r, role, level, manualPoints };
        });

        // Auto-Heal Project Names: Mencegah bug "Lainnya" akibat perbedaan tanda baca pada nama
        const healedProjects = processedProjects.map(p => {
            const healedP = { ...p };
            const healName = (oldName) => {
                if (!oldName) return oldName;
                const exactMatch = processedResources.find(r => r.name === oldName);
                if (exactMatch) return oldName;
                const fuzzyMatch = processedResources.find(r => fuzzyMatchName(r.name, oldName));
                return fuzzyMatch ? fuzzyMatch.name : oldName;
            };

            healedP.teamLeader = healName(healedP.teamLeader);
            if (healedP.team) healedP.team = healedP.team.map(m => healName(m));

            const newPengawasan = {};
            for (const k in healedP.pengawasanDetails) newPengawasan[healName(k)] = healedP.pengawasanDetails[k];
            healedP.pengawasanDetails = newPengawasan;

            const newIndividual = {};
            for (const k in healedP.individualStatus) newIndividual[healName(k)] = healedP.individualStatus[k];
            healedP.individualStatus = newIndividual;

            return healedP;
        });

        onData({ projects: healedProjects, resources: processedResources });
    };
    ref.on('value', handler, (error) => { if (onError) onError(error); });
    return () => ref.off('value', handler);
};

const cleanProjectKeys = (projects) => projects.map(proj => {
    const newP = { ...proj };
    if (newP.pengawasanDetails) {
        const cleanP = {};
        for (const k in newP.pengawasanDetails) cleanP[encodeKey(k)] = newP.pengawasanDetails[k];
        newP.pengawasanDetails = cleanP;
    }
    if (newP.individualStatus) {
        const cleanI = {};
        for (const k in newP.individualStatus) cleanI[encodeKey(k)] = newP.individualStatus[k];
        newP.individualStatus = cleanI;
    }
    return newP;
});

// Dipakai efek auto-stamp completedAt: hanya menulis ulang array projects.
export const updateProjectsOnly = (projects) => projectDataRef().update({ projects: cleanProjectKeys(projects) });

// CRUD ACTION FIREBASE REALTIME (dipakai untuk 'project' maupun 'resource'/Tim, satu node yang sama)
export const applyCrudAction = async (action, type, payload) => {
    const ref = projectDataRef();
    // Tarik data terbaru dari Firebase sekali saja untuk dimodifikasi
    const snapshot = await ref.once('value');
    const currentData = snapshot.val() || { projects: [], resources: [] };

    let newProjects = currentData.projects || [];
    let newResources = currentData.resources || [];

    // Bersihkan array dari null jika ada
    newProjects = newProjects.filter(Boolean);
    newResources = newResources.filter(Boolean);

    if (action === 'add') {
        payload.id = Date.now().toString();
        if (type === 'project') newProjects.push(payload);
        else newResources.push(payload);
    } else if (action === 'edit') {
        if (type === 'project') {
            newProjects = newProjects.map(p => p.id === payload.id ? payload : p);
        } else {
            newResources = newResources.map(r => r.id === payload.id ? payload : r);
        }
    } else if (action === 'delete') {
        if (type === 'project') {
            newProjects = newProjects.filter(p => p.id !== payload.id);
        } else {
            newResources = newResources.filter(r => r.id !== payload.id);
        }
    }

    const cleanProjects = cleanProjectKeys(newProjects);

    await ref.update({
        projects: cleanProjects,
        resources: newResources
    });

    // Auto create expert if adding a new resource
    if (action === 'add' && type !== 'project') {
        try {
            await autoCreateExpertIfMissing(payload.name);
        } catch (expError) {
            console.error("Failed to auto-create expert from resource:", expError);
        }
    }

    return currentData;
};

// =========================================================================
// SINKRONISASI OTOMATIS: PENUGASAN → LIST PROYEK (PENGAWASAN)
// Fungsi ini otomatis membuat/memperbarui/menghapus proyek di List Proyek
// saat user menyimpan data di menu Penugasan Tenaga Ahli.
// Field `sourceAssignmentId` dipakai sebagai penghubung antar data.
// =========================================================================
export const syncAssignmentToProject = async (assignment, action, experts, resources) => {
    const ref = projectDataRef();
    try {
        const snapshot = await ref.once('value');
        const currentData = snapshot.val() || { projects: [], resources: [] };
        let allProjects = (currentData.projects || []).filter(Boolean);

        if (action === 'delete') {
            // Hapus proyek yang terhubung
            const linkedProject = allProjects.find(p => p.sourceAssignmentId === assignment.id);
            if (linkedProject) {
                allProjects = allProjects.filter(p => p.sourceAssignmentId !== assignment.id);
                const cleanProjects = cleanProjectKeys(allProjects);
                await ref.update({ projects: cleanProjects });
            }
            return;
        }

        // Buat atau perbarui proyek dari data assignment
        const expertNames = [...new Set((assignment.experts || []).map(exp => {
            const expertObj = experts.find(e => e.id === exp.expertId);
            return expertObj ? getLinkedResourceName(expertObj, typeof resources !== 'undefined' ? resources : []) : null;
        }).filter(Boolean))];

        // Bangun pengawasanDetails baru dengan mempertahankan plotting manual dari List Proyek
        const existingProject = allProjects.find(p => p.sourceAssignmentId === assignment.id);

        let existingMembers = [];
        if (existingProject) {
            const rawString = Array.isArray(existingProject.team) ? existingProject.team.join(';') : (existingProject.team || '');
            if (rawString.startsWith('{')) {
                try { existingMembers = JSON.parse(rawString).members || []; } catch (e) { }
            } else {
                existingMembers = existingProject.team || [];
            }
        }

        const existingPengawasanDetails = existingProject ? (() => {
            const raw = existingProject.pengawasanDetails || {};
            const decoded = {};
            for (const k in raw) decoded[decodeKey(k)] = raw[k];
            return decoded;
        })() : {};

        // Gabungkan member dari assignment dan member manual
        const finalMembers = [...new Set([...existingMembers, ...expertNames])];
        const newPengawasanDetails = {};

        // 1. Masukkan semua orang yang sudah ada (manual plot) beserta statusnya
        finalMembers.forEach(name => {
            const existingDetail = existingPengawasanDetails[name] || {};
            newPengawasanDetails[encodeKey(name)] = {
                role: existingDetail.role || 'Inspector',
                manMonth: existingDetail.manMonth || '',
                statusTurun: existingDetail.statusTurun || 'Tidak Turun',
                deadline: existingDetail.deadline || '',
            };
        });

        // 2. Timpa/Update data spesifik dari assignment (Sertifikat/Ahli yang resmi dikontrak)
        (assignment.experts || []).forEach(exp => {
            const expertObj = experts.find(e => e.id === exp.expertId);
            if (!expertObj) return;
            const name = expertObj.linkedResourceName || expertObj.name;
            const existingDetail = existingPengawasanDetails[name] || {};
            newPengawasanDetails[encodeKey(name)] = {
                role: exp.role || existingDetail.role || 'Inspector',
                manMonth: exp.manMonth || existingDetail.manMonth || '',
                statusTurun: existingDetail.statusTurun || 'Tidak Turun',
                deadline: existingDetail.deadline || '',
            };
        });

        // Serialisasi team data ke JSON string (sesuai format sistem)
        const teamDataObj = {
            members: finalMembers,
            details: {},
            leader: '',
            individualStatus: existingProject ? (existingProject.individualStatus || {}) : {},
            pengawasanDetails: newPengawasanDetails
        };

        const projectPayload = existingProject ? {
            ...existingProject,
            name: assignment.jobName || 'Tanpa Nama',
            client: assignment.clientName || assignment.lpseName || '',
            type: assignment.projectType || 'Pengawasan',
            spmk: assignment.startDate || '',
            deadline: assignment.endDate || '',
            team: JSON.stringify(teamDataObj).replace(/;/g, ','),
        } : {
            name: assignment.jobName || 'Tanpa Nama',
            client: assignment.clientName || assignment.lpseName || '',
            type: assignment.projectType || 'Pengawasan',
            status: 'On Progress',
            spmk: assignment.startDate || '',
            deadline: assignment.endDate || '',
            sourceAssignmentId: assignment.id,
            description: '',
            descriptionUpdatedAt: '',
            notStarted: false,
            isPending: false,
            team: JSON.stringify(teamDataObj).replace(/;/g, ','),
        };

        let updatedProjects;
        if (existingProject) {
            // EDIT: perbarui proyek yang sudah ada
            projectPayload.id = existingProject.id;
            updatedProjects = allProjects.map(p => p.sourceAssignmentId === assignment.id ? projectPayload : p);
        } else {
            // ADD: buat proyek baru
            projectPayload.id = 'sync-' + assignment.id;
            updatedProjects = [...allProjects, projectPayload];
        }

        await ref.update({ projects: updatedProjects });
    } catch (err) {
        console.error("Sync Assignment to Project Error:", err);
    }
};
