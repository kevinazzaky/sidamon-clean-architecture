import React, { useContext } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppContext } from './AppContext';
import Icon from '../shared/components/Icon';
import AlertModal from '../shared/modals/AlertModal';
import ConfirmModal from '../shared/modals/ConfirmModal';
import PendingModal from '../shared/modals/PendingModal';
import ResumeModal from '../shared/modals/ResumeModal';
import DominoModal from '../shared/modals/DominoModal';
import KPIInfoModal from '../features/kpi/KPIInfoModal';
import CertManagerModal from '../features/tenaga-ahli/CertManagerModal';
import LpseManagerModal from '../features/penugasan/LpseManagerModal';
import RoleManagerModal from '../features/pengguna/RoleManagerModal';
import PrintZoomProjectModal from '../features/proyek/PrintZoomProjectModal';
import ProjectFormModal from '../features/proyek/components/ProjectFormModal';
import InventoryFormModal from '../features/inventaris/components/InventoryFormModal';
import ResourceFormModal from '../features/tim/components/ResourceFormModal';
import ExpertModalForm from '../features/tenaga-ahli/components/ExpertModalForm';
import ExpertCertModalForm from '../features/tenaga-ahli/components/ExpertCertModalForm';
import ExpertTenderModalForm from '../features/tenaga-ahli/components/ExpertTenderModalForm';
import ImportExcelModal from '../features/tenaga-ahli/components/ImportExcelModal';
import AssignmentModalForm from '../features/penugasan/components/AssignmentModalForm';
import { exportProjectExcel } from '../shared/utils/excelExport';

export default function ModalContainer() {
    const {
        modalConfig,
        // Alert & Confirm
        alertModal,
        setAlertModal,
        confirmDialog,
        setConfirmDialog,
        // Resume & Pending
        showResumeModal,
        setShowResumeModal,
        resumeProjectData,
        setResumeProjectData,
        handleConfirmResumeProject,
        showPendingModal,
        setShowPendingModal,
        pendingProjectData,
        setPendingProjectData,
        pendingReasonText,
        setPendingReasonText,
        handleTogglePendingSubmit,
        // Domino
        dominoAnalysis,
        setDominoAnalysis,
        // Project Breakdown & Print
        showProjectTypeModal,
        setShowProjectTypeModal,
        showPrintModal,
        setShowPrintModal,
        printOptions,
        setPrintOptions,
        computedProjects,
        calculatedResources,
        setPrintData,
        // Managers
        showCertManager,
        showLpseManager,
        showRoleManager,
        showKPIInfoModal,
        printZoomProject
    } = useContext(AppContext);

    const isInventoryType = modalConfig.type?.startsWith('inventory');

    return (
        <>
            {/* CRUD Data Modals with AnimatePresence */}
            <AnimatePresence>
                {modalConfig.isOpen && modalConfig.type === 'project' && (
                    <ProjectFormModal key="modal-project" />
                )}
                {modalConfig.isOpen && isInventoryType && (
                    <InventoryFormModal key="modal-inventory" />
                )}
                {modalConfig.isOpen && (modalConfig.type === 'resource' || modalConfig.type === 'team') && (
                    <ResourceFormModal key="modal-resource" />
                )}
                {modalConfig.isOpen && modalConfig.type === 'expert' && (
                    <ExpertModalForm key="modal-expert" />
                )}
                {modalConfig.isOpen && modalConfig.type === 'expert_cert' && (
                    <ExpertCertModalForm key="modal-expert-cert" />
                )}
                {modalConfig.isOpen && modalConfig.type === 'expert_tender' && (
                    <ExpertTenderModalForm key="modal-expert-tender" />
                )}
                {modalConfig.isOpen && modalConfig.type === 'import_expert' && (
                    <ImportExcelModal key="modal-import" />
                )}
                {modalConfig.isOpen && modalConfig.type === 'assignment' && (
                    <AssignmentModalForm key="modal-assignment" />
                )}
            </AnimatePresence>

            {/* Resume Project Modal */}
            {showResumeModal && (
                <ResumeModal
                    showResumeModal={showResumeModal}
                    resumeProjectData={resumeProjectData}
                    setShowResumeModal={setShowResumeModal}
                    setResumeProjectData={setResumeProjectData}
                    onConfirm={handleConfirmResumeProject}
                />
            )}

            {/* Pending Project Modal */}
            {showPendingModal && (
                <PendingModal
                    showPendingModal={showPendingModal}
                    pendingProjectData={pendingProjectData}
                    pendingReasonText={pendingReasonText}
                    setShowPendingModal={setShowPendingModal}
                    setPendingProjectData={setPendingProjectData}
                    setPendingReasonText={setPendingReasonText}
                    onSubmit={handleTogglePendingSubmit}
                />
            )}

            {/* Domino Delay Analysis Modal */}
            {dominoAnalysis && (
                <DominoModal
                    dominoAnalysis={dominoAnalysis}
                    setDominoAnalysis={setDominoAnalysis}
                />
            )}

            {/* KPI Info Modal */}
            {showKPIInfoModal && <KPIInfoModal />}

            {/* Confirm Dialog */}
            <ConfirmModal
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
            />

            {/* Print Zoom Project Modal */}
            {printZoomProject && <PrintZoomProjectModal />}

            {/* Project Type Breakdown Modal */}
            {showProjectTypeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Icon name="briefcase" size={20} className="text-blue-500" /> Detail Tipe Proyek
                            </h3>
                            <button
                                onClick={() => setShowProjectTypeModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(
                                (computedProjects || []).reduce((acc, p) => {
                                    let type = p.type || "Lainnya";
                                    if (type.trim().toLowerCase() === "perencana") type = "Perencanaan";
                                    if (type.trim().toLowerCase() === "pengawas") type = "Pengawasan";
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {})
                            ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{type}</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full text-xs">{count} Proyek</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-3 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-black text-sm text-slate-800 dark:text-slate-200">Total Keseluruhan</span>
                                <span className="font-black text-slate-800 dark:text-slate-200">{(computedProjects || []).length} Proyek</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowProjectTypeModal(false)}
                                className="px-4 py-2 w-full rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Export Options Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Opsi Ekspor Laporan</h3>
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipe Proyek</label>
                                <select
                                    value={printOptions?.projectType || 'Semua'}
                                    onChange={(e) => setPrintOptions && setPrintOptions({ ...printOptions, projectType: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="Semua">Semua Tipe Proyek</option>
                                    <option value="Perencanaan">Hanya Perencanaan</option>
                                    <option value="Pengawasan">Hanya Pengawasan</option>
                                    <option value="Manajemen Konstruksi">Hanya Manajemen Konstruksi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cakupan Laporan</label>
                                <select
                                    value={printOptions?.section || 'Semua'}
                                    onChange={(e) => setPrintOptions && setPrintOptions({ ...printOptions, section: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="Semua">Lengkap (Status Proyek & Penugasan Pegawai)</option>
                                    <option value="ProyekSaja">Hanya Laporan Status Proyek Saja</option>
                                    <option value="PegawaiSaja">Hanya Rincian Penugasan Pegawai Saja</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setShowPrintModal(false);
                                    exportProjectExcel(computedProjects, calculatedResources, printOptions);
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Icon name="file-text" size={16} /> Ekspor Excel
                            </button>
                            <button
                                onClick={() => {
                                    setShowPrintModal(false);
                                    if (setPrintData) setPrintData({ type: 'custom', options: printOptions });
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Icon name="printer" size={16} /> Cetak PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cert, LPSE, Role, and Alert Modals */}
            <CertManagerModal />
            <LpseManagerModal />
            <RoleManagerModal />
            <AlertModal alertModal={alertModal} setAlertModal={setAlertModal} />
        </>
    );
}
