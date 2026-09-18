import { db } from './firebase';

export const assignmentsRef = () => db.ref('pmc_assignments');
export const lpseListRef = () => db.ref('pmc_lpse_list');

// Listener Khusus untuk Penugasan Tenaga Ahli
export const subscribeAssignments = (onData) => {
    const ref = assignmentsRef();
    const handler = (snap) => {
        let asgData = snap.val() || [];
        if (!Array.isArray(asgData)) {
            asgData = Object.values(asgData);
        }
        onData(asgData.filter(Boolean));
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveAssignments = (newData) => assignmentsRef().set(newData);

// Listener Khusus untuk LPSE List
export const subscribeLpseList = (onData) => {
    const ref = lpseListRef();
    const handler = (snap) => {
        const lpseData = snap.val();
        if (lpseData && Array.isArray(lpseData)) {
            let updated = false;
            const newData = lpseData.map(item => {
                if (item.startsWith('Kabupaten ')) { updated = true; return item.replace('Kabupaten ', 'LPSE '); }
                if (item.startsWith('Kota ')) { updated = true; return item.replace('Kota ', 'LPSE '); }
                return item;
            });
            if (updated) {
                lpseListRef().set(newData);
            } else {
                onData(lpseData);
            }
        } else {
            // default list dari user request
            const defaultLpse = [
                "LPSE Badung", "LPSE Bangli", "LPSE Buleleng",
                "LPSE Gianyar", "LPSE Jembrana", "LPSE Karangasem",
                "LPSE Klungkung", "LPSE Tabanan", "LPSE Denpasar",
                "LPSE Kemen PU", "LPSE ATR", "LPSE Kemenpar", "LPSE Kemendikbud",
                "LPSE Kemenkumham", "LPSE Kemendag", "LPSE Kemen LHK", "LPSE Kemenkeu",
                "LPSE Polri", "LPSE BPOM", "LPSE Mah-Agung", "LPSE Kemen Perhubungan",
                "LPSE INAPROC Nasional", "Kantor Desa Dauh Puri Kangin",
                "Kantor Desa Dauh Puri Kelod", "Kantor Desa Saba Blahbatuh",
                "Bank BPD", "Bank Mandiri", "LPSE Provinsi Bali"
            ];
            onData(defaultLpse);
            // Set ke firebase jika belum ada
            lpseListRef().set(defaultLpse);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveLpseList = (newList) => lpseListRef().set(newList);
