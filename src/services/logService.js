import { db } from './firebase';

export const logsRef = () => db.ref('pmc_logs');

// Listener Khusus untuk Log Aktivitas & Auto Cleanup 30 Hari (hanya Super Admin yang memicu tulis-ulang)
export const subscribeActivityLogs = (onData, isSuperAdmin) => {
    const ref = logsRef();
    const handler = (snap) => {
        let logsData = snap.val();
        if (logsData) {
            const now = Date.now();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            let hasExpiredLogs = false;

            const logsArray = Object.keys(logsData).map(key => {
                const log = { id: key, ...logsData[key] };
                const logTime = new Date(log.timestamp).getTime();
                if (now - logTime > thirtyDaysMs) {
                    hasExpiredLogs = true;
                    return null;
                }
                return log;
            }).filter(Boolean);

            if (hasExpiredLogs && isSuperAdmin) {
                const validLogsMap = {};
                logsArray.forEach(l => {
                    const { id, ...rest } = l;
                    validLogsMap[id] = rest;
                });
                logsRef().set(validLogsMap);
            }

            onData(logsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } else {
            onData([]);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const logActivity = async (action, menu, details, userData) => {
    try {
        if (!userData) return;
        const timestamp = new Date().toISOString();
        await db.ref('pmc_logs').push({
            userId: userData.uid || 'unknown',
            username: userData.username || userData.email || 'Unknown User',
            role: userData.role || 'Unknown Role',
            action,
            menu,
            details,
            timestamp
        });
    } catch (e) {
        console.error('Gagal mencatat log aktivitas:', e);
    }
};
