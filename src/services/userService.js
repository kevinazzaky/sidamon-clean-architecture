import { db } from './firebase';

export const usersRef = () => db.ref('pmc_users');
export const roleListRef = () => db.ref('pmc_role_list');

// Listener Khusus untuk Manajemen Pengguna
export const subscribeUsers = (onData) => {
    const ref = usersRef();
    const handler = (snap) => {
        const usersData = snap.val();
        if (usersData) {
            let updated = false;
            const newUsersData = { ...usersData };
            Object.keys(newUsersData).forEach(uid => {
                const u = newUsersData[uid];
                if (!u.username && u.email) {
                    u.username = u.name ? u.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '') : u.email.split('@')[0];
                    updated = true;
                }
            });
            if (updated) {
                usersRef().set(newUsersData);
            }
            const usersArray = Object.keys(usersData)
                .map(uid => ({
                    uid,
                    ...usersData[uid]
                }))
                .filter(u => u.role !== 'Deleted');
            onData(usersArray);
        } else {
            onData([]);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const updateUserRole = (uid, newRole) => usersRef().child(uid).update({ role: newRole });

// Soft-delete: role di-set 'Deleted' agar akses langsung dicabut tanpa menghapus histori data.
export const deleteUser = (uid) => usersRef().child(uid).update({ role: 'Deleted' });

// --- Dipakai alur Login/Register & AuthContext ---
export const getUserRecord = async (uid) => {
    const snap = await usersRef().child(uid).once('value');
    return snap.exists() ? { uid, ...snap.val() } : null;
};

export const checkUsernameExists = async (username) => {
    const snapshot = await usersRef().orderByChild('username').equalTo(username).once('value');
    return snapshot.exists();
};

export const createUserRecord = (uid, data) => usersRef().child(uid).set(data);

export const subscribeUserRole = (uid, onData) => {
    const ref = usersRef().child(uid);
    const handler = (snapshot) => onData(snapshot.val());
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

// Jika belum ada satu pun user terdaftar, user ini otomatis jadi Super Admin pertama.
export const claimSuperAdminIfNoUsersExist = async (uid, email) => {
    const snap = await usersRef().once('value');
    if (!snap.exists()) {
        await usersRef().child(uid).set({ role: 'Super Admin', email });
        return true;
    }
    return false;
};

export const subscribeRoleList = (onData) => {
    const ref = roleListRef();
    const handler = (snap) => {
        const roleData = snap.val();
        if (roleData) {
            onData(roleData);
        } else {
            const defaultRoles = {
                Perencanaan: ['Team Leader', 'Tenaga Ahli', 'K3', 'Quantity Surveyor / Cost Estimator', 'Drafter / Operator CAD', 'Surveyor', 'Administrasi'],
                Pengawasan: ['Team Leader', 'Tenaga Ahli', 'Inspector', 'Laboratory Technician', 'Quantity Surveyor', 'K3', 'Administrasi']
            };
            onData(defaultRoles);
            roleListRef().set(defaultRoles);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveRoleList = (newList) => roleListRef().set(newList);
