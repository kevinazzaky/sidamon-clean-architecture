import { useContext } from 'react';
import { AppContext } from './AppContext';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProyekPage from '../features/proyek/ProyekPage';
import TimeSchedulePage from '../features/jadwal/TimeSchedulePage';
import MasterSchedulePage from '../features/jadwal/MasterSchedulePage';
import TimPage from '../features/tim/TimPage';
import GanttPage from '../features/jadwal/GanttPage';
import TenagaAhliPage from '../features/tenaga-ahli/TenagaAhliPage';
import PenugasanPage from '../features/penugasan/PenugasanPage';
import InventoryPage from '../features/inventaris/InventoryPage';
import AdminAsetPage from '../features/inventaris/AdminAsetPage';
import KPIPage from '../features/kpi/KPIPage';
import ManajemenPenggunaPage from '../features/pengguna/ManajemenPenggunaPage';
import LogbookPage from '../features/timesheet/LogbookPage';
import SOPPage from '../features/sop/SOPPage';

// Peta activeTab -> komponen feature (menggantikan switch besar di App.jsx lama)
export default function AppRoutes({ activeTab }) {
    const { canAccessMenu, userRole } = useContext(AppContext);

    return (
        <>
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'proyek' && canAccessMenu('Proyek') && <ProyekPage />}
            {activeTab === 'schedule' && canAccessMenu('Proyek') && <TimeSchedulePage />}
            {activeTab === 'master-schedule' && canAccessMenu('Proyek') && <MasterSchedulePage />}
            {activeTab === 'tim' && canAccessMenu('Proyek') && <TimPage />}
            {activeTab === 'gantt' && canAccessMenu('Proyek') && <GanttPage />}
            {activeTab === 'ahli' && canAccessMenu('Tenaga Ahli') && <TenagaAhliPage />}
            {activeTab === 'penugasan' && canAccessMenu('Tenaga Ahli') && <PenugasanPage />}
            {activeTab === 'inventaris' && canAccessMenu('Inventaris') && <InventoryPage />}
            {activeTab === 'admin-aset' && canAccessMenu('Admin Aset') && <AdminAsetPage />}
            {activeTab === 'kpi' && canAccessMenu('KPI') && <KPIPage />}
            {activeTab === 'pengguna' && canAccessMenu('Manajemen Pengguna') && <ManajemenPenggunaPage />}
            {activeTab === 'logbook' && userRole === 'Super Admin' && <LogbookPage />}
            {activeTab === 'sop' && <SOPPage />}
        </>
    );
}
