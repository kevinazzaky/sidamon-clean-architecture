// Matrix RBAC — data/logika murni, tidak tahu apa-apa soal React/Context.
// Semua fungsi menerima `userRole` sebagai parameter eksplisit.

export const canAccessMenu = (userRole, menuName) => {
    if (!userRole || userRole === 'Guest') return false;
    if (userRole === 'Super Admin') return true;

    if (userRole === 'Manajer Teknis' || userRole === 'Manajer Administrasi' || userRole === 'HRD') {
        if (menuName === 'Manajemen Pengguna') return false;
        if (menuName === 'Admin Aset' && userRole !== 'HRD') return false;
        return true;
    }

    switch (menuName) {
        case 'Proyek':
            return ['Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan', 'Manajer', 'Admin Tender'].includes(userRole);
        case 'Timesheet':
        case 'Time Schedule':
            return ['Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan', 'Manajer'].includes(userRole);

        case 'Alokasi Tim':
        case 'Plotting Jadwal':
            return ['Kordinator Divisi Teknis', 'PIC', 'Manajer'].includes(userRole);

        case 'Tenaga Ahli':
        case 'Manajemen LPSE':
            return ['Manajer', 'Admin Tender'].includes(userRole);

        case 'Rekan Rekanan':
            return ['Manajer'].includes(userRole);

        case 'Manajemen Pengguna':
            return false;

        case 'Inventaris':
            return true;

        case 'Admin Aset':
            return ['Kordinator Aset', 'Manajer'].includes(userRole);

        case 'KPI':
            return ['Manajer'].includes(userRole);

        default:
            return false;
    }
};

export const canCreateProject = (userRole) => {
    return ['Super Admin', 'Manajer Teknis', 'Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan'].includes(userRole);
};

export const canDeleteProject = (userRole) => {
    return ['Super Admin', 'Manajer Teknis', 'Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan'].includes(userRole);
};

export const canEditProjectAdmin = (userRole) => {
    return ['Super Admin', 'Manajer Administrasi'].includes(userRole);
};

export const canEditProjectTechnical = (userRole) => {
    return ['Super Admin', 'Manajer Teknis', 'Kordinator Divisi Teknis', 'PIC', 'Team Leader Pekerjaan'].includes(userRole);
};

export const canEditTeamAllocation = (userRole) => {
    return ['Super Admin', 'Manajer Teknis', 'PIC'].includes(userRole);
};

export const canEditInventory = (userRole) => {
    return ['Super Admin', 'Kordinator Aset', 'HRD'].includes(userRole);
};

export const canEditExperts = (userRole) => {
    return ['Super Admin', 'Manajer Administrasi', 'HRD'].includes(userRole);
};

export const canManageAssignments = (userRole) => {
    return ['Super Admin', 'Manajer Administrasi', 'HRD'].includes(userRole);
};

export const canManageAsset = (userRole) => {
    return ['Super Admin', 'Kordinator Aset', 'HRD'].includes(userRole);
};
