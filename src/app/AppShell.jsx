import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import Login from '../auth/Login';
import { AppContext } from './AppContext';
import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileBottomNav from './components/MobileBottomNav';
import CurtainTransition from './components/CurtainTransition';
import ModalContainer from './ModalContainer';
import PrintExecutiveReport from '../features/proyek/PrintExecutiveReport';
import Icon from '../shared/components/Icon';
import { auth } from '../services/firebase';
import { logActivity } from '../services/logService';

function GuestApprovalScreen() {
    const { currentUser, userRole, username } = useAuth();

    const handleLogout = async () => {
        const userData = {
            uid: currentUser?.uid,
            username,
            role: userRole,
            email: currentUser?.email
        };
        await logActivity('LOGOUT', 'Autentikasi', 'Keluar dari sistem', userData);
        auth.signOut();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="text-center text-white bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 max-w-sm">
                <div className="mb-4 text-emerald-500 flex justify-center">
                    <Icon name="clock" size={48} />
                </div>
                <h1 className="text-xl font-bold mb-2">Menunggu Persetujuan</h1>
                <p className="text-sm text-slate-400 mb-6">
                    Akun Anda sedang direview oleh Super Admin. Silakan hubungi Administrator untuk mendapatkan akses.
                </p>
                <button
                    onClick={handleLogout}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors w-full"
                >
                    Keluar
                </button>
            </div>
        </div>
    );
}

function AppContent() {
    const { activeTab } = useContext(AppContext);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <CurtainTransition />
            <PrintExecutiveReport />
            <div
                id="main-ui-wrapper"
                className="flex h-screen text-slate-800 dark:text-slate-200 bg-transparent transition-colors duration-200 relative overflow-hidden print:hidden"
            >
                {/* Glowing Orbs for Glassmorphism Depth */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
                </div>

                <div className="relative z-10 flex w-full h-full">
                    <Sidebar />
                    <main className="flex-1 min-w-0 p-4 lg:p-5 h-screen overflow-y-auto">
                        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
                        <div className="relative z-10 w-full animate-fade-in pb-24 lg:pb-0 overflow-x-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="w-full"
                                >
                                    <AppRoutes activeTab={activeTab} />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </main>
                    <MobileBottomNav
                        mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}
                    />
                </div>
            </div>
            <ModalContainer />
        </>
    );
}

export default function AppShell() {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Login />;
    }

    if (userRole === 'Guest') {
        return <GuestApprovalScreen />;
    }

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
