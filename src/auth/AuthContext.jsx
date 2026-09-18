import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { subscribeUserRole, claimSuperAdminIfNoUsersExist } from '../services/userService';
import * as permissions from './permissions';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // String: "Super Admin", dll.
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                subscribeUserRole(user.uid, (data) => {
                    if (data && data.role) {
                        if (data.role === 'Deleted') {
                            auth.signOut().then(() => {
                                window.dispatchEvent(new CustomEvent('show-alert', { detail: { title: 'Akses Ditolak', message: 'Akun Anda telah dihapus secara permanen dari sistem.' } }));
                            });
                            setUserRole(null);
                            setLoading(false);
                            return;
                        }
                        setUserRole(data.role);
                        setUsername(data.username || data.name || null);
                        setLoading(false);
                    } else {
                        // Auto-assign Super Admin to the first user
                        claimSuperAdminIfNoUsersExist(user.uid, user.email).then(claimed => {
                            if (claimed) {
                                setUserRole('Super Admin');
                            } else {
                                setUserRole('Guest'); // Default local state, do NOT write to DB so deleted users don't resurrect
                            }
                            setLoading(false);
                        });
                    }
                });
            } else {
                setUserRole(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    // Fitur Auto Log Out setelah 30 menit tidak ada aktivitas (1800000 ms)
    useEffect(() => {
        let inactivityTimeout;

        const resetInactivityTimeout = () => {
            if (inactivityTimeout) clearTimeout(inactivityTimeout);
            inactivityTimeout = setTimeout(() => {
                if (auth.currentUser) {
                    auth.signOut().then(() => {
                        window.dispatchEvent(new CustomEvent('show-alert', { detail: { title: 'Sesi Berakhir', message: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit demi keamanan data. Silakan login kembali.' } }));
                    }).catch(console.error);
                }
            }, 1800000);
        };

        if (currentUser) {
            resetInactivityTimeout();
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, resetInactivityTimeout));

            return () => {
                if (inactivityTimeout) clearTimeout(inactivityTimeout);
                events.forEach(event => window.removeEventListener(event, resetInactivityTimeout));
            };
        }
    }, [currentUser]);

    // RBAC Permissions Logic — data/aturannya ada di permissions.js, di sini cuma dibind ke userRole
    const value = {
        currentUser,
        userRole,
        username,
        loading,
        canAccessMenu: (menuName) => permissions.canAccessMenu(userRole, menuName),
        canCreateProject: () => permissions.canCreateProject(userRole),
        canDeleteProject: () => permissions.canDeleteProject(userRole),
        canEditProjectAdmin: () => permissions.canEditProjectAdmin(userRole),
        canEditProjectTechnical: () => permissions.canEditProjectTechnical(userRole),
        canEditTeamAllocation: () => permissions.canEditTeamAllocation(userRole),
        canEditInventory: () => permissions.canEditInventory(userRole),
        canEditExperts: () => permissions.canEditExperts(userRole),
        canManageAssignments: () => permissions.canManageAssignments(userRole),
        canManageAsset: () => permissions.canManageAsset(userRole)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
