
import { useAuth } from '../auth/useAuth';
import Login from '../auth/Login';

import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment, useContext } from 'react';

import { AppContext } from './AppContext';
import AppRoutes from './AppRoutes';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '../../LGIHT TRANSPARAN (1).PNG';
import logoSidamon from '../assets/logo-sidamon.png';
import { auth } from '../services/firebase';
import { logActivity } from '../services/logService';
import * as XLSX from 'xlsx-js-style';
import Icon from '../shared/components/Icon';
import TeamCheckboxGroup from '../shared/components/TeamCheckboxGroup';
import TeamVisionaryMultiSelect from '../shared/components/TeamVisionaryMultiSelect';
import MobileMenuItem from '../shared/components/MobileMenuItem';
import SidebarItem from '../shared/components/SidebarItem';
import BottomNavItem from '../shared/components/BottomNavItem';
import MetricCard from '../shared/components/MetricCard';
import StatusBadge from '../shared/components/StatusBadge';
import ErrorBanner from '../shared/components/ErrorBanner';
import { fuzzyMatchName, getLinkedResourceName } from '../shared/utils/nameMatch';
import { formatDateTimeIndo, formatDateIndo } from '../shared/utils/dateHelpers';
import { calculateComputedStatus, getMicroStatus, getLPSEHierarchyScore, getCategoryFromRole, getEffectiveEmpCategory, calculateLeaderKPI, calculateEmployeeKPI } from '../shared/utils/projectCalculations';
import { exportProjectExcel } from '../shared/utils/excelExport';
import AlertModal from '../shared/modals/AlertModal';
import ConfirmModal from '../shared/modals/ConfirmModal';
import PendingModal from '../shared/modals/PendingModal';
import ResumeModal from '../shared/modals/ResumeModal';
import DominoModal from '../shared/modals/DominoModal';
import KPIInfoModal from '../features/kpi/KPIInfoModal';
import CertManagerModal from '../features/tenaga-ahli/CertManagerModal';
import LpseManagerModal from '../features/penugasan/LpseManagerModal';
import RoleManagerModal from '../features/pengguna/RoleManagerModal';
import PrintExecutiveReport from '../features/proyek/PrintExecutiveReport';
import PrintZoomProjectModal from '../features/proyek/PrintZoomProjectModal';
import * as projectService from '../services/projectService';
import * as expertService from '../services/expertService';
import * as inventoryService from '../services/inventoryService';
import * as lpseService from '../services/lpseService';
import * as userService from '../services/userService';
import * as sopService from '../services/sopService';
import { subscribeActivityLogs } from '../services/logService';

let expertSaveTimeout = null;
let assignmentSaveTimeout = null;

const ModalForm = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);

    if (!modalConfig.isOpen) return null;
    if (
        modalConfig.type === "expert" ||
        modalConfig.type === "expert_cert" ||
        modalConfig.type === "expert_tender" ||
        modalConfig.type === "assignment" ||
        modalConfig.type === "import_expert"
    )
        return null;
    const isProject = modalConfig.type === "project";
    const isInventory =
        modalConfig.type === "inventory" ||
        modalConfig.type === "inventory-borrow" ||
        modalConfig.type === "inventory-return" ||
        modalConfig.type === "inventory-extend" ||
        modalConfig.type === "inventory-cart";
    const [formData, setFormData] = useState(() => {
        const offset = new Date().getTimezoneOffset() * 6e4;
        const defaultBorrowDate = new Date(Date.now() - offset)
            .toISOString()
            .split("T")[0];
        if (modalConfig.data) {
            const data = {
                ...modalConfig.data,
                adjustmentInput: 0,
            };
            if (modalConfig.mode === "borrow" && !data.borrowDate) {
                data.borrowDate = defaultBorrowDate;
            }
            if (
                modalConfig.type === "project" &&
                data.type === "Perencanaan" &&
                data.surveyorTeam &&
                data.surveyorTeam.length > 0
            ) {
                data.team = (data.team || []).filter(
                    (m) => !data.surveyorTeam.includes(m),
                );
            }
            return data;
        }
        if (isProject)
            return {
                name: "",
                client: "",
                type: "Perencanaan",
                status: "On Progress",
                progress: 0,
                deadline: "",
                spmk: "",
                description: "",
                descriptionUpdatedAt: "",
                team: [],
                surveyorTeam: [],
                categoryDetails: {},
                teamLeader: "",
                pengawasanDetails: {},
            };
        if (isInventory)
            return {
                id: "",
                name: "",
                type: "Alat Ukur",
                condition: "Baik",
                status: "Tersedia",
                borrower: "",
                borrowDate: modalConfig.mode === "borrow-cart" ? defaultBorrowDate : "",
                returnDate: "",
                projectAssigned: "",
            };
        return {
            name: "",
            role: "Arsitek",
            level: "Staff",
            rating: 3,
            manualPoints: 0,
            adjustmentInput: 0,
        };
    });
    const [searchTeam, setSearchTeam] = useState("");
    const [freelanceInput, setFreelanceInput] = useState("");
    const handleAddFreelance = (e) => {
        e.preventDefault();
        const name = freelanceInput.trim();
        if (!name) return;
        if (!(formData.team || []).includes(name)) {
            setFormData((prev) => ({
                ...prev,
                team: [...(prev.team || []), name],
            }));
        }
        setFreelanceInput("");
    };
    const handleEditFreelance = (oldName) => {
        const newName = window.prompt("Edit nama personil freelance:", oldName);
        if (newName && newName.trim() !== "" && newName !== oldName) {
            const finalName = newName.trim();
            if ((formData.team || []).includes(finalName)) {
                alert("Nama personil sudah ada di dalam tim.");
                return;
            }
            setFormData((prev) => {
                const newTeam = (prev.team || []).map((t) =>
                    t === oldName ? finalName : t,
                );
                const newPengawasanDetails = {
                    ...(prev.pengawasanDetails || {}),
                };
                if (newPengawasanDetails[oldName]) {
                    newPengawasanDetails[finalName] = newPengawasanDetails[oldName];
                    delete newPengawasanDetails[oldName];
                }
                return {
                    ...prev,
                    team: newTeam,
                    pengawasanDetails: newPengawasanDetails,
                };
            });
        }
    };
    const handleFreelanceKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddFreelance(e);
        }
    };
    const handleAutoPlotting = () => {
        let recommendedTeam = [];
        let recommendedLeader = "";
        const checkPengawasan =
            formData.type === "Pengawasan" ||
            formData.type === "Manajemen Konstruksi";
        const findBestPerson = (roleKeyword, excludeList, requiredLevel = null) => {
            let candidates = resources.filter(
                (r) =>
                    r.role.toLowerCase().includes(roleKeyword.toLowerCase()) &&
                    !excludeList.includes(r.name),
            );
            if (requiredLevel) {
                candidates = candidates.filter((r) => r.level === requiredLevel);
            }
            if (candidates.length === 0) return null;
            let bestCandidate = null;
            let highestScore = -99999;
            candidates.forEach((cand) => {
                const activeProjCount = computedProjects.filter(
                    (p) =>
                        p.computedStatus !== "Done" &&
                        p.computedStatus !== "Pending" &&
                        (p.team || []).some(m => fuzzyMatchName(m, cand.name)),
                ).length;
                const workload = activeProjCount * 25;
                const isLeaderMode = cand.level === "Team Leader";
                const kpiResult = isLeaderMode
                    ? calculateLeaderKPI(cand, computedProjects)
                    : calculateEmployeeKPI(cand, computedProjects);
                let score = kpiResult.score;
                if (workload >= 100) {
                    score -= 1e3;
                } else {
                    score -= workload * 0.5;
                }
                score += (cand.rating || 0) * 10;
                if (score > highestScore) {
                    highestScore = score;
                    bestCandidate = cand.name;
                }
            });
            return bestCandidate;
        };
        if (!checkPengawasan) {
            const leader = findBestPerson(
                "Team Leader",
                recommendedTeam,
                "Team Leader",
            );
            if (leader) recommendedLeader = leader;
            const rolesToFill = [
                "Arsitek",
                "Struktur",
                "MEP",
                "Estimator",
                "Drafter",
            ];
            rolesToFill.forEach((role) => {
                const best = findBestPerson(role, recommendedTeam);
                if (best) recommendedTeam.push(best);
            });
        } else {
            const rolesToFill = ["Inspector", "Site Engineer", "Quantity Surveyor"];
            rolesToFill.forEach((role) => {
                const best = findBestPerson(role, recommendedTeam);
                if (best) recommendedTeam.push(best);
            });
        }
        setFormData((prev) => ({
            ...prev,
            teamLeader: recommendedLeader,
            team: recommendedTeam,
        }));
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            let newData = {
                ...prev,
                [name]: value,
            };
            if (name === "spmk") {
                if (newData.pengawasanDetails) {
                    let updatedDetails = {
                        ...newData.pengawasanDetails,
                    };
                    Object.keys(updatedDetails).forEach((member) => {
                        const manMonth = updatedDetails[member].manMonth;
                        if (value && manMonth) {
                            const manMonthVal = parseFloat(manMonth);
                            if (!isNaN(manMonthVal)) {
                                const date = new Date(value);
                                date.setDate(date.getDate() + Math.round(manMonthVal * 30) - 1);
                                if (date.getDay() === 6) date.setDate(date.getDate() - 1);
                                else if (date.getDay() === 0) date.setDate(date.getDate() - 2);
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                const dd = String(date.getDate()).padStart(2, "0");
                                updatedDetails[member] = {
                                    ...updatedDetails[member],
                                    deadline: `${yyyy}-${mm}-${dd}`,
                                };
                            }
                        } else if (!value) {
                            updatedDetails[member] = {
                                ...updatedDetails[member],
                                deadline: "",
                            };
                        }
                    });
                    newData.pengawasanDetails = updatedDetails;
                }
            }
            return newData;
        });
    };
    const handleCategoryDetailChange = (category, field, value) => {
        setFormData((prev) => ({
            ...prev,
            categoryDetails: {
                ...prev.categoryDetails,
                [category]: {
                    ...(prev.categoryDetails?.[category] || {}),
                    [field]: value,
                },
            },
        }));
    };
    const handleAddTask = (category, taskName) => {
        if (!taskName.trim()) return;
        setFormData((prev) => {
            const currentCat = prev.categoryDetails?.[category] || {
                progress: 0,
                deadline: "",
                tasks: [],
                completedTasks: [],
            };
            const currentTasks = currentCat.tasks || [];
            if (currentTasks.includes(taskName.trim())) return prev;
            const newTasks = [...currentTasks, taskName.trim()];
            const completed = currentCat.completedTasks || [];
            const newProgress =
                newTasks.length > 0
                    ? Math.round((completed.length / newTasks.length) * 100)
                    : 0;
            return {
                ...prev,
                categoryDetails: {
                    ...prev.categoryDetails,
                    [category]: {
                        ...currentCat,
                        tasks: newTasks,
                        progress: newProgress,
                    },
                },
            };
        });
    };
    const handleRemoveTask = (category, taskName) => {
        setFormData((prev) => {
            const currentCat = prev.categoryDetails?.[category] || {
                progress: 0,
                deadline: "",
                tasks: [],
                completedTasks: [],
            };
            const newTasks = (currentCat.tasks || []).filter((t) => t !== taskName);
            const newCompleted = (currentCat.completedTasks || []).filter(
                (t) => t !== taskName,
            );
            const newProgress =
                newTasks.length > 0
                    ? Math.round((newCompleted.length / newTasks.length) * 100)
                    : 0;
            return {
                ...prev,
                categoryDetails: {
                    ...prev.categoryDetails,
                    [category]: {
                        ...currentCat,
                        tasks: newTasks,
                        completedTasks: newCompleted,
                        progress: newProgress,
                    },
                },
            };
        });
    };
    const handleToggleTask = (category, taskName) => {
        setFormData((prev) => {
            const currentCat = prev.categoryDetails?.[category] || {
                progress: 0,
                deadline: "",
                tasks: [],
                completedTasks: [],
            };
            const currentCompleted = currentCat.completedTasks || [];
            const isCompleted = currentCompleted.includes(taskName);
            const newCompleted = isCompleted
                ? currentCompleted.filter((t) => t !== taskName)
                : [...currentCompleted, taskName];
            const totalTasks = currentCat.tasks || [];
            const newProgress =
                totalTasks.length > 0
                    ? Math.round((newCompleted.length / totalTasks.length) * 100)
                    : 0;
            return {
                ...prev,
                categoryDetails: {
                    ...prev.categoryDetails,
                    [category]: {
                        ...currentCat,
                        completedTasks: newCompleted,
                        progress: newProgress,
                    },
                },
            };
        });
    };
    const handlePengawasanDetailChange = (memberName, field, value) => {
        setFormData((prev) => {
            const currentDetail = prev.pengawasanDetails?.[memberName] || {
                role: "Inspector",
                deadline: "",
                manMonth: "",
                statusTurun: "Tidak Turun",
            };
            let newDetail = {
                ...currentDetail,
                [field]: value,
            };

            if (field === "role") {
                const existingDetails = Object.values(prev.pengawasanDetails || {});
                const match = existingDetails.find(d => d.role === value && d.manMonth);
                if (match) {
                    newDetail.manMonth = match.manMonth;
                    if (match.deadline) newDetail.deadline = match.deadline;
                }
            }

            if (field === "manMonth") {
                if (prev.spmk && newDetail.manMonth) {
                    const manMonthVal = parseFloat(newDetail.manMonth);
                    if (!isNaN(manMonthVal)) {
                        const date = new Date(prev.spmk);
                        date.setDate(date.getDate() + Math.round(manMonthVal * 30) - 1);
                        if (date.getDay() === 6) date.setDate(date.getDate() - 1);
                        else if (date.getDay() === 0) date.setDate(date.getDate() - 2);
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        newDetail.deadline = `${yyyy}-${mm}-${dd}`;
                    }
                } else if (!newDetail.manMonth) {
                    newDetail.deadline = "";
                }
            }
            return {
                ...prev,
                pengawasanDetails: {
                    ...prev.pengawasanDetails,
                    [memberName]: newDetail,
                },
            };
        });
    };
    const surveyorTeamList = formData.surveyorTeam || [];
    const isPerencanaanForm = formData.type?.toLowerCase().includes("perencana");
    const activeCategories = Array.from(
        new Set(
            (formData.team || [])
                .map((memberName) => {
                    if (isPerencanaanForm && surveyorTeamList.includes(memberName))
                        return null;
                    const res = resources.find((r) => fuzzyMatchName(r.name, memberName));
                    return res ? getCategoryFromRole(res.role) : "Lainnya";
                })
                .filter((cat) => cat !== null),
        ),
    );
    if (surveyorTeamList.length > 0) {
        activeCategories.push("Surveyor");
    }
    const computedTotalProgress = useMemo(() => {
        if (!isProject || activeCategories.length === 0) return 0;
        let total = 0;
        activeCategories.forEach((cat) => {
            total += parseInt(formData.categoryDetails?.[cat]?.progress) || 0;
        });
        return Math.round(total / activeCategories.length);
    }, [formData.categoryDetails, activeCategories, isProject]);
    const handleResetTo100 = () => {
        const dummyEmp = {
            ...formData,
        };
        let calculated = null;
        if (formData.level === "Team Leader") {
            calculated = calculateLeaderKPI(dummyEmp, computedProjects);
        } else {
            calculated = calculateEmployeeKPI(dummyEmp, computedProjects);
        }
        const gap = 100 - calculated.score;
        setFormData((prev) => ({
            ...prev,
            adjustmentInput: gap,
        }));
    };
    const handleResetToAuto = () => {
        const gap = -(formData.manualPoints || 0);
        setFormData((prev) => ({
            ...prev,
            adjustmentInput: gap,
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        let finalPayload = {
            ...formData,
        };
        if (isInventory) {
            if (modalConfig.mode === "borrow-cart") {
                handleInventoryAction("borrow-cart", {
                    selectedIds: modalConfig.data,
                    data: {
                        borrower: finalPayload.borrower,
                        borrowDate:
                            finalPayload.borrowDate || new Date().toISOString().split("T")[0],
                        returnDate: finalPayload.returnDate,
                        projectAssigned: finalPayload.projectAssigned,
                    },
                });
                return;
            } else if (modalConfig.mode === "borrow") {
                finalPayload.status = "Menunggu Verifikasi";
                if (!finalPayload.borrowDate)
                    finalPayload.borrowDate = new Date().toISOString().split("T")[0];
            } else if (modalConfig.mode === "return") {
                finalPayload.status = "Menunggu Verifikasi Pengembalian";
            } else if (modalConfig.mode === "extend") {
                finalPayload.status = "Menunggu Verifikasi Perpanjangan";
                finalPayload.newReturnDate = finalPayload.returnDate;
                finalPayload.returnDate = modalConfig.data.returnDate;
            }
            handleInventoryAction(modalConfig.mode, finalPayload);
            return;
        }
        if (isProject) {
            finalPayload.progress = computedTotalProgress;
            const oldDesc = modalConfig.data ? modalConfig.data.description : "";
            if (finalPayload.description && finalPayload.description !== oldDesc) {
                finalPayload.descriptionUpdatedAt = new Date().toISOString();
            } else if (!finalPayload.description) {
                finalPayload.descriptionUpdatedAt = "";
            } else {
                finalPayload.descriptionUpdatedAt = modalConfig.data
                    ? modalConfig.data.descriptionUpdatedAt
                    : "";
            }
            const activeCats = new Set(
                (finalPayload.team || []).map((memberName) => {
                    const res = resources.find((r) => fuzzyMatchName(r.name, memberName));
                    return res ? getCategoryFromRole(res.role) : "Lainnya";
                }),
            );
            if (
                finalPayload.type === "Perencanaan" &&
                finalPayload.surveyorTeam &&
                finalPayload.surveyorTeam.length > 0
            ) {
                activeCats.add("Surveyor");
                finalPayload.team = Array.from(
                    new Set([...(finalPayload.team || []), ...finalPayload.surveyorTeam]),
                );
            }
            const cleanDetails = {};
            activeCats.forEach((cat) => {
                if (finalPayload.categoryDetails && finalPayload.categoryDetails[cat]) {
                    cleanDetails[cat] = finalPayload.categoryDetails[cat];
                }
            });

            if (finalPayload.type === "Pengawasan" || finalPayload.type === "Manajemen Konstruksi") {
                if (!finalPayload.pengawasanDetails) finalPayload.pengawasanDetails = {};
                const assignment = typeof assignments !== 'undefined' ? assignments.find((a) => a.id === finalPayload.sourceAssignmentId) : null;
                const originalNames = (assignment?.experts || []).map((exp) => {
                    const expertObj = typeof experts !== 'undefined' ? experts.find((e) => e.id === exp.expertId) : null;
                    if (!expertObj) return null;
                    return getLinkedResourceName(expertObj, typeof resources !== 'undefined' ? resources : []);
                }).filter(Boolean);

                (finalPayload.team || []).forEach((memberName) => {
                    if (!finalPayload.pengawasanDetails[memberName]) {
                        const isOriginalSyncedMember = finalPayload.sourceAssignmentId ? originalNames.includes(memberName) : false;
                        finalPayload.pengawasanDetails[memberName] = {
                            role: "Inspector",
                            deadline: "",
                            manMonth: "",
                            statusTurun: isOriginalSyncedMember ? "Tidak Turun" : "Turun",
                        };
                    }
                });
            }

            const teamDataObj = {
                members: finalPayload.team || [],
                details: cleanDetails,
                leader: finalPayload.teamLeader || "",
                individualStatus: finalPayload.individualStatus || {},
                pengawasanDetails: finalPayload.pengawasanDetails || {},
            };
            finalPayload.team = JSON.stringify(teamDataObj).replace(/;/g, ",");
        } else {
            const newManualPoints =
                (finalPayload.manualPoints || 0) + (finalPayload.adjustmentInput || 0);
            finalPayload.role = `${finalPayload.role}|${finalPayload.level}|${newManualPoints}`;
        }
        handleCrudAction(modalConfig.mode, modalConfig.type, finalPayload);
    };
    const filteredResources = resources.filter(
        (res) =>
            res.name.toLowerCase().includes(searchTeam.toLowerCase()) ||
            res.role.toLowerCase().includes(searchTeam.toLowerCase()),
    );
    const isPengawasanForm =
        formData.type === "Pengawasan" || formData.type === "Manajemen Konstruksi";
    const isSyncedProject =
        modalConfig.mode === "edit" && Boolean(formData.sourceAssignmentId);
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center sm:p-4 fade-in">
            <div
                className={`bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl border border-transparent dark:border-slate-700/50 w-full ${isProject ? "sm:max-w-4xl" : "sm:max-w-2xl"} overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[95vh] pb-4 sm:pb-0`}
            >
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {modalConfig.mode === "add"
                            ? "Tambah "
                            : modalConfig.mode === "borrow"
                                ? "Pinjam "
                                : "Edit "}
                        {isProject
                            ? "Data Proyek Terpadu"
                            : isInventory
                                ? "Data Inventaris"
                                : "Data Personil"}
                    </h3>
                    <button
                        onClick={closeModal}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    <form id="crudForm" onSubmit={handleSubmit} className="space-y-5">
                        {isProject && isSyncedProject && (
                            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300">
                                <Icon name="link" size={14} className="mt-0.5 shrink-0" />
                                <span>
                                    <strong>Proyek Tersinkronisasi:</strong> Data utama (Nama,
                                    Klien, Tipe, Tim) dikelola otomatis melalui menu{" "}
                                    <strong>Penugasan Tenaga Ahli</strong>. Anda hanya dapat
                                    mengubah status <strong>Turun/Tidak Turun</strong> personil di
                                    sini.
                                </span>
                            </div>
                        )}
                        {isProject ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Nama Proyek
                                        </label>
                                        <input
                                            required={true}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={isSyncedProject}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                            placeholder="Cth: Perencanaan RSUD"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Klien / Owner
                                        </label>
                                        <input
                                            required={true}
                                            name="client"
                                            value={formData.client}
                                            onChange={handleChange}
                                            disabled={isSyncedProject}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                            placeholder="Cth: Dinas PUPR"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tipe Proyek
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            disabled={isSyncedProject}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <option value="Perencanaan">Perencanaan</option>
                                            {modalConfig.mode === "edit" &&
                                                formData.type === "Pengawasan" && (
                                                    <option value="Pengawasan">Pengawasan</option>
                                                )}
                                            <option value="Manajemen Konstruksi">
                                                Manajemen Konstruksi
                                            </option>
                                        </select>
                                    </div>
                                    {isPerencanaanForm && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                Divisi Kontrol
                                            </label>
                                            <select
                                                name="divisiKontrol"
                                                value={formData.divisiKontrol || ""}
                                                onChange={handleChange}
                                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200"
                                            >
                                                <option value="">-- Pilih Divisi --</option>
                                                <option value="Divisi Jalan">Divisi Jalan</option>
                                                <option value="Divisi Gedung">Divisi Gedung</option>
                                                <option value="Divisi SDA">Divisi SDA</option>
                                                <option value="Divisi Perijinan">
                                                    Divisi Perijinan
                                                </option>
                                                <option value="Divisi Tata Ruang">
                                                    Divisi Tata Ruang
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Status Proyek (Makro)
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200"
                                        >
                                            <option value="On Progress">On Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                        <Icon name="file-text" size={12} /> Deskripsi / Update
                                        Proyek
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description || ""}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors resize-none dark:text-slate-200"
                                        placeholder="Tuliskan update terkini proyek ini... Cth: Sudah masuk tahap DED, menunggu approval dari klien untuk revisi arsitektur."
                                    />
                                </div>
                                <div className="flex flex-col gap-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {(isPengawasanForm || isPerencanaanForm) && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                Tgl SPMK Proyek
                                            </label>
                                            <div className="relative w-full">
                                                <div className="flex items-center justify-between w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 min-h-[42px] text-slate-700 dark:text-slate-200">
                                                    <span>
                                                        {formData.spmk
                                                            ? formatDateIndo(formData.spmk)
                                                            : "Pilih tanggal..."}
                                                    </span>
                                                    <Icon
                                                        name="calendar-clock"
                                                        size={16}
                                                        className="text-slate-400"
                                                    />
                                                </div>
                                                <input
                                                    type="date"
                                                    name="spmk"
                                                    className={`absolute inset-0 w-full h-full opacity-0 ${isSyncedProject ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                    value={formData.spmk || ""}
                                                    onChange={handleChange}
                                                    disabled={isSyncedProject}
                                                    onClick={(e) =>
                                                        !isSyncedProject &&
                                                        e.target.showPicker &&
                                                        e.target.showPicker()
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Tenggat Waktu Kontrak Akhir
                                        </label>
                                        <div className="relative w-full">
                                            <div className="flex items-center justify-between w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 min-h-[42px] text-slate-700 dark:text-slate-200">
                                                <span>
                                                    {formData.deadline
                                                        ? formatDateIndo(formData.deadline)
                                                        : "Pilih tanggal..."}
                                                </span>
                                                <Icon
                                                    name="calendar-clock"
                                                    size={16}
                                                    className="text-slate-400"
                                                />
                                            </div>
                                            <input
                                                type="date"
                                                name="deadline"
                                                className={`absolute inset-0 w-full h-full opacity-0 ${isSyncedProject ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                value={formData.deadline || ""}
                                                onChange={handleChange}
                                                disabled={isSyncedProject}
                                                onClick={(e) =>
                                                    !isSyncedProject &&
                                                    e.target.showPicker &&
                                                    e.target.showPicker()
                                                }
                                            />
                                        </div>
                                    </div>
                                    {!isPengawasanForm && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                Progress Keseluruhan Proyek (%)
                                            </label>
                                            <input
                                                type="number"
                                                readOnly={true}
                                                value={computedTotalProgress}
                                                className="block w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm outline-none cursor-not-allowed appearance-none m-0"
                                                title="Nilai ini dihitung otomatis"
                                            />
                                            <p className="text-[9px] text-slate-500 mt-1">
                                                Dihitung otomatis dari rata-rata progress sub-tim.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                    {(!isSyncedProject || isPengawasanForm) && (
                                        <>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    Penugasan Personil
                                                </label>
                                                {!isPengawasanForm && (
                                                    <button
                                                        type="button"
                                                        onClick={handleAutoPlotting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                                                    >
                                                        <Icon
                                                            name="zap"
                                                            size={14}
                                                            className="text-amber-300 fill-amber-300"
                                                        />{" "}
                                                        Auto-Assign AI
                                                    </button>
                                                )}
                                            </div>
                                            {!isPengawasanForm && (
                                                <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
                                                    <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                                                        <Icon
                                                            name="star"
                                                            size={14}
                                                            className="text-amber-500"
                                                        />{" "}
                                                        Pilih Team Leader Proyek
                                                    </label>
                                                    <select
                                                        name="teamLeader"
                                                        value={formData.teamLeader || ""}
                                                        onChange={handleChange}
                                                        className="w-full p-2.5 border border-amber-200 dark:border-amber-700/50 rounded-xl text-sm outline-none focus:border-amber-500 bg-white dark:bg-slate-800 shadow-sm font-semibold text-slate-700 dark:text-slate-200"
                                                    >
                                                        <option value="">
                                                            -- Tidak Ada Team Leader --
                                                        </option>
                                                        {resources
                                                            .filter((r) => r.level === "Team Leader")
                                                            .map((r) => (
                                                                <option value={r.name}>
                                                                    {r.name} ({r.role})
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            )}
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                {isPengawasanForm
                                                    ? "Daftar Personil Tim Pengawasan"
                                                    : "Anggota Sub-Tim"}
                                            </label>
                                            <div className="relative mb-3">
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Icon name="search" size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama personil untuk ditugaskan..."
                                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all shadow-sm dark:text-slate-200"
                                                    value={searchTeam}
                                                    onChange={(e) => setSearchTeam(e.target.value)}
                                                />
                                            </div>
                                            <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 max-h-48 overflow-y-auto">
                                                {(() => {
                                                    const expertsData = (typeof experts !== 'undefined' ? experts : []).filter(e => {
                                                        if (!searchTeam) return true;
                                                        return e.name?.toLowerCase().includes(searchTeam.toLowerCase()) ||
                                                            e.bidangIlmu?.toLowerCase().includes(searchTeam.toLowerCase());
                                                    }).map((e, idx) => ({
                                                        id: e.id || `expert-${idx}`,
                                                        name: e.name,
                                                        role: e.bidangIlmu || 'Tenaga Ahli'
                                                    }));

                                                    if (isPengawasanForm) {
                                                        if (resources.length === 0 && expertsData.length === 0) {
                                                            return <p className="text-xs text-slate-400 italic">Belum ada data tim atau tenaga ahli. Tambahkan di menu terkait.</p>;
                                                        }
                                                        if (filteredResources.length === 0 && expertsData.length === 0) {
                                                            return <p className="text-xs text-slate-400 italic">Pencarian tidak ditemukan.</p>;
                                                        }
                                                        return (
                                                            <>
                                                                {filteredResources.length > 0 && (
                                                                    <TeamCheckboxGroup
                                                                        title="Pilih Pegawai Internal (Alokasi Tim)"
                                                                        roleFilter={(r) => true}
                                                                        isOptional={true}
                                                                        filteredResources={filteredResources}
                                                                        formData={formData}
                                                                        setFormData={setFormData}
                                                                    />
                                                                )}
                                                                {expertsData.length > 0 && (
                                                                    <div className={filteredResources.length > 0 ? "mt-4" : ""}>
                                                                        <TeamCheckboxGroup
                                                                            title="Pilih Tenaga Ahli (Dari Database)"
                                                                            roleFilter={(r) => true}
                                                                            isOptional={true}
                                                                            filteredResources={expertsData}
                                                                            formData={formData}
                                                                            setFormData={setFormData}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    } else {
                                                        if (resources.length === 0) {
                                                            return (
                                                                <p className="text-xs text-slate-400 italic">
                                                                    Belum ada data tim. Tambahkan di menu Alokasi Tim.
                                                                </p>
                                                            );
                                                        }
                                                        if (filteredResources.length === 0) {
                                                            return (
                                                                <p className="text-xs text-slate-400 italic">
                                                                    Pencarian tidak ditemukan.
                                                                </p>
                                                            );
                                                        }
                                                        return (
                                                            <>
                                                                <TeamCheckboxGroup
                                                                    title="Tim Arsitek"
                                                                    roleFilter={(r) =>
                                                                        r.role.toLowerCase().includes("arsitek")
                                                                    }
                                                                    isOptional={false}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                                <TeamCheckboxGroup
                                                                    title="Tim Quantity Surveyor (QS)"
                                                                    roleFilter={(r) =>
                                                                        r.role.toLowerCase() === "qs" ||
                                                                        r.role.toLowerCase().includes("quantity")
                                                                    }
                                                                    isOptional={false}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                                <TeamCheckboxGroup
                                                                    title="Tim Struktur"
                                                                    roleFilter={(r) =>
                                                                        r.role.toLowerCase().includes("struktur")
                                                                    }
                                                                    isOptional={true}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                                <TeamCheckboxGroup
                                                                    title="Tim MEP"
                                                                    roleFilter={(r) =>
                                                                        r.role.toLowerCase().includes("mep")
                                                                    }
                                                                    isOptional={true}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                                <TeamCheckboxGroup
                                                                    title="Tim Tata Ruang"
                                                                    roleFilter={(r) =>
                                                                        r.role.toLowerCase().includes("tata ruang") ||
                                                                        r.role.toLowerCase().includes("planologi")
                                                                    }
                                                                    isOptional={true}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                                <TeamCheckboxGroup
                                                                    title="Lainnya"
                                                                    roleFilter={(r) =>
                                                                        !r.role.toLowerCase().includes("arsitek") &&
                                                                        !(
                                                                            r.role.toLowerCase() === "qs" ||
                                                                            r.role.toLowerCase().includes("quantity")
                                                                        ) &&
                                                                        !r.role.toLowerCase().includes("struktur") &&
                                                                        !r.role.toLowerCase().includes("mep") &&
                                                                        !(
                                                                            r.role.toLowerCase().includes("tata ruang") ||
                                                                            r.role.toLowerCase().includes("planologi")
                                                                        )
                                                                    }
                                                                    isOptional={true}
                                                                    filteredResources={filteredResources}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                            </>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            {!isPengawasanForm && resources.length > 0 && (
                                                <div className="mt-4 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                        Penugasan Ekstra (Opsional)
                                                    </label>
                                                    <TeamVisionaryMultiSelect
                                                        title="Tim Surveyor (Sub Tim Khusus Lintas Jabatan)"
                                                        filteredResources={resources}
                                                        formData={formData}
                                                        setFormData={setFormData}
                                                        teamField="surveyorTeam"
                                                    />
                                                </div>
                                            )}

                                        </>
                                    )}
                                    {isPengawasanForm && (formData.team || []).length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/50">
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                                                <Icon
                                                    name="user-check"
                                                    size={16}
                                                    className="text-emerald-600 dark:text-emerald-400"
                                                />{" "}
                                                Rincian Penugasan Personil Pengawasan
                                            </label>
                                            <div className="space-y-2 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 bg-emerald-50/30 dark:bg-emerald-900/10">
                                                {formData.team.map((member) => {
                                                    const isOriginalSyncedMember = (() => {
                                                        if (!isSyncedProject) return false;
                                                        const assignment = assignments.find(a => a.id === formData.sourceAssignmentId);
                                                        if (!assignment) return false;
                                                        const originalNames = (assignment.experts || []).map(exp => {
                                                            const expertObj = experts.find(e => e.id === exp.expertId);
                                                            if (!expertObj) return null;
                                                            return getLinkedResourceName(expertObj, typeof resources !== 'undefined' ? resources : []);
                                                        }).filter(Boolean);
                                                        return originalNames.includes(member);
                                                    })();
                                                    const detail = formData.pengawasanDetails?.[
                                                        member
                                                    ] || {
                                                        role: "Inspector",
                                                        deadline: "",
                                                        manMonth: "",
                                                        spmk: "",
                                                        statusTurun: isOriginalSyncedMember ? "Tidak Turun" : "Turun",
                                                    };
                                                    return (
                                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-3 shadow-sm">
                                                            <div className="border-b border-slate-100 dark:border-slate-700 pb-2 flex justify-between items-center">
                                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                    {member}
                                                                </h4>
                                                                {!isOriginalSyncedMember && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData((prev) => ({
                                                                                ...prev,
                                                                                team: (prev.team || []).filter(
                                                                                    (t) => t !== member,
                                                                                ),
                                                                            }));
                                                                        }}
                                                                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md border border-red-100 dark:border-red-800/50"
                                                                    >
                                                                        <Icon name="trash-2" size={12} /> Hapus
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[4fr_3fr_3fr] gap-3">
                                                                <div className="flex flex-col justify-end">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                                            Peran / Jabatan
                                                                        </label>
                                                                        {member === formData.team[0] && (
                                                                            <button type="button" onClick={() => setShowRoleManager(true)} className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-0.5" title="Kelola Daftar Jabatan">
                                                                                <Icon name="settings" size={10} /> Kelola
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <select
                                                                        className={`block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 ${isOriginalSyncedMember ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                        value={detail.role || "Inspector"}
                                                                        onChange={(e) =>
                                                                            handlePengawasanDetailChange(
                                                                                member,
                                                                                "role",
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        disabled={isOriginalSyncedMember}
                                                                    >
                                                                        <option value="">-- Pilih Jabatan --</option>
                                                                        {(roleList['Pengawasan'] || []).map(r => (
                                                                            <option key={r} value={r}>{r}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="flex flex-col justify-end">
                                                                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase whitespace-nowrap">
                                                                        Status
                                                                    </label>
                                                                    <select
                                                                        className="block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                                                        value={detail.statusTurun || (isOriginalSyncedMember ? "Tidak Turun" : "Turun")}
                                                                        onChange={(e) =>
                                                                            handlePengawasanDetailChange(
                                                                                member,
                                                                                "statusTurun",
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="Turun">Turun</option>
                                                                        <option value="Tidak Turun">
                                                                            Tidak Turun
                                                                        </option>
                                                                        <option value="Belum Diketahui">
                                                                            Belum Diketahui
                                                                        </option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex flex-col justify-end">
                                                                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase whitespace-nowrap">
                                                                        Lama (Man/Month)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className={`block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 ${isOriginalSyncedMember ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                        value={detail.manMonth || ""}
                                                                        onChange={(e) =>
                                                                            handlePengawasanDetailChange(
                                                                                member,
                                                                                "manMonth",
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        placeholder="Cth: 1.5"
                                                                        disabled={isOriginalSyncedMember}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!isPengawasanForm && activeCategories.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                                            <Icon
                                                name="target"
                                                size={16}
                                                className="text-blue-600 dark:text-blue-400"
                                            />{" "}
                                            Target Khusus Per Sub-Tim
                                        </label>
                                        <div className="space-y-2 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 bg-blue-50/30 dark:bg-blue-900/10">
                                            {[
                                                "Arsitek",
                                                "QS",
                                                "Struktur",
                                                "MEP",
                                                "Tata Ruang",
                                                "Surveyor",
                                                "Lainnya",
                                            ].map((cat) => {
                                                if (!activeCategories.includes(cat)) return null;
                                                const details = formData.categoryDetails?.[cat] || {
                                                    progress: 0,
                                                    deadline: "",
                                                };
                                                const catMembers =
                                                    cat === "Surveyor"
                                                        ? formData.surveyorTeam || []
                                                        : formData.team.filter((m) => {
                                                            if (
                                                                isPerencanaanForm &&
                                                                (formData.surveyorTeam || []).includes(m)
                                                            )
                                                                return false;
                                                            const r = resources.find((x) => fuzzyMatchName(x.name, m));
                                                            return r && getCategoryFromRole(r.role) === cat;
                                                        });
                                                return (
                                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-3 shadow-sm">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="w-full sm:w-1/4 sm:border-r border-slate-100 dark:border-slate-700 sm:pr-2">
                                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                    <Icon
                                                                        name="target"
                                                                        size={14}
                                                                        className="text-blue-500"
                                                                    />{" "}
                                                                    {cat}
                                                                </h4>
                                                                <p
                                                                    className="text-[9px] text-slate-500 truncate mt-0.5"
                                                                    title={catMembers.join(", ")}
                                                                >
                                                                    {catMembers.join(", ")}
                                                                </p>
                                                            </div>
                                                            <div className="w-full sm:w-1/4">
                                                                {(details.tasks || []).length > 0 ? (
                                                                    <>
                                                                        <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">
                                                                            Progress Terkunci (%)
                                                                        </label>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                                                    style={{
                                                                                        width: `${details.progress || 0}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                                {details.progress || 0}%
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase">
                                                                                Progress Manual
                                                                            </label>
                                                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                                                {details.progress || 0}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="relative w-full h-[34px] flex items-center">
                                                                            <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center">
                                                                                <div
                                                                                    className="absolute top-0 left-0 h-full bg-green-500 rounded-lg pointer-events-none"
                                                                                    style={{
                                                                                        width: `${details.progress || 0}%`,
                                                                                    }}
                                                                                />
                                                                                <div
                                                                                    className="absolute w-4 h-4 bg-white border-[3px] border-green-500 rounded-full shadow pointer-events-none"
                                                                                    style={{
                                                                                        left: `calc(${details.progress || 0}% - 8px)`,
                                                                                    }}
                                                                                />
                                                                                <input
                                                                                    type="range"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    value={details.progress || 0}
                                                                                    onChange={(e) =>
                                                                                        handleCategoryDetailChange(
                                                                                            cat,
                                                                                            "progress",
                                                                                            parseInt(e.target.value),
                                                                                        )
                                                                                    }
                                                                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer m-0 z-10"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="w-full sm:w-1/4 sm:border-r border-slate-100 dark:border-slate-700 sm:pr-2">
                                                                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">
                                                                    Tanggal Mulai
                                                                </label>
                                                                <div className="relative w-full">
                                                                    <div className="flex items-center justify-between w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-colors min-h-[34px] text-slate-700 dark:text-slate-200">
                                                                        <span>
                                                                            {details.startDate
                                                                                ? formatDateIndo(details.startDate)
                                                                                : "Pilih..."}
                                                                        </span>
                                                                        <Icon
                                                                            name="calendar-clock"
                                                                            size={14}
                                                                            className="text-slate-400"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="date"
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                        value={details.startDate || ""}
                                                                        onChange={(e) =>
                                                                            handleCategoryDetailChange(
                                                                                cat,
                                                                                "startDate",
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        onClick={(e) =>
                                                                            e.target.showPicker &&
                                                                            e.target.showPicker()
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="w-full sm:w-1/4">
                                                                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">
                                                                    Deadline Tim
                                                                </label>
                                                                <div className="relative w-full">
                                                                    <div className="flex items-center justify-between w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-colors min-h-[34px] text-slate-700 dark:text-slate-200">
                                                                        <span>
                                                                            {details.deadline
                                                                                ? formatDateIndo(details.deadline)
                                                                                : "Pilih tanggal..."}
                                                                        </span>
                                                                        <Icon
                                                                            name="calendar-clock"
                                                                            size={14}
                                                                            className="text-slate-400"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="date"
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                        value={details.deadline || ""}
                                                                        onChange={(e) =>
                                                                            handleCategoryDetailChange(
                                                                                cat,
                                                                                "deadline",
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        onClick={(e) =>
                                                                            e.target.showPicker &&
                                                                            e.target.showPicker()
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50 mt-1">
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                                                                Custom Micro-Tasks
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder={
                                                                    cat === "QS"
                                                                        ? "Ketik tugas baru (Cth: RAB) lalu tekan Enter..."
                                                                        : cat === "Struktur"
                                                                            ? "Ketik tugas baru (Cth: Perhitungan Struktur Kolom) lalu tekan Enter..."
                                                                            : cat === "MEP"
                                                                                ? "Ketik tugas baru (Cth: Perhitungan sanitair) lalu tekan Enter..."
                                                                                : "Ketik tugas baru (Cth: Denah Lantai 1) lalu tekan Enter..."
                                                                }
                                                                className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md mb-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 dark:text-slate-200 transition-colors"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        handleAddTask(cat, e.target.value);
                                                                        e.target.value = "";
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                                                                {(details.tasks || []).length === 0 ? (
                                                                    <p className="text-[10px] text-slate-400 italic">
                                                                        Belum ada tugas. Tambahkan tugas agar
                                                                        progres dapat dihitung.
                                                                    </p>
                                                                ) : (
                                                                    (details.tasks || []).map((task, idx) => {
                                                                        const isChecked = (
                                                                            details.completedTasks || []
                                                                        ).includes(task);
                                                                        return (
                                                                            <div
                                                                                className={`flex items-center justify-between p-1.5 rounded-md border text-xs transition-all ${isChecked ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50" : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}
                                                                            >
                                                                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                                        checked={isChecked}
                                                                                        onChange={() =>
                                                                                            handleToggleTask(cat, task)
                                                                                        }
                                                                                    />
                                                                                    <span
                                                                                        className={`${isChecked ? "text-blue-800 dark:text-blue-300 line-through opacity-70" : "text-slate-700 dark:text-slate-200 font-medium"}`}
                                                                                    >
                                                                                        {task}
                                                                                    </span>
                                                                                </label>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleRemoveTask(cat, task)
                                                                                    }
                                                                                    className="text-slate-400 hover:text-red-500 transition-colors px-1 ml-2 flex-shrink-0"
                                                                                    title="Hapus Tugas"
                                                                                >
                                                                                    <Icon name="x" size={12} />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : isInventory ? (
                            modalConfig.mode === "borrow" ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Nama Peminjam
                                        </label>
                                        <input
                                            required={true}
                                            type="text"
                                            name="borrower"
                                            value={formData.borrower || ''}
                                            onChange={handleChange}
                                            placeholder="Masukkan nama peminjam..."
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tanggal Dipinjam
                                        </label>
                                        <input
                                            type="date"
                                            required={true}
                                            name="borrowDate"
                                            value={formData.borrowDate}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tanggal Pengembalian
                                        </label>
                                        <input
                                            type="date"
                                            required={true}
                                            name="returnDate"
                                            value={formData.returnDate}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Proyek (Opsional)
                                        </label>
                                        <input
                                            name="projectAssigned"
                                            value={formData.projectAssigned}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                            placeholder="Cth: Perencanaan RSUD"
                                        />
                                    </div>
                                </div>
                            ) : modalConfig.mode === "borrow-cart" ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-2">
                                        <p className="text-xs text-indigo-800 dark:text-indigo-300">
                                            Anda akan meminjam{" "}
                                            <strong className="font-bold">
                                                {modalConfig.data?.length || 0} alat sekaligus
                                            </strong>
                                            . Data formulir ini akan diaplikasikan ke semua alat yang
                                            Anda pilih.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Nama Peminjam
                                        </label>
                                        <input
                                            required={true}
                                            type="text"
                                            name="borrower"
                                            value={formData.borrower || ''}
                                            onChange={handleChange}
                                            placeholder="Masukkan nama peminjam..."
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tanggal Dipinjam
                                        </label>
                                        <input
                                            type="date"
                                            required={true}
                                            name="borrowDate"
                                            value={formData.borrowDate}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tanggal Pengembalian
                                        </label>
                                        <input
                                            type="date"
                                            required={true}
                                            name="returnDate"
                                            value={formData.returnDate}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Proyek (Opsional)
                                        </label>
                                        <input
                                            name="projectAssigned"
                                            value={formData.projectAssigned}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                            placeholder="Cth: Perencanaan RSUD"
                                        />
                                    </div>
                                </div>
                            ) : modalConfig.mode === "extend" ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-slate-200 dark:border-amber-800/50 rounded-xl mb-2">
                                        <p className="text-xs text-amber-800 dark:text-amber-300">
                                            Perpanjang masa pinjam untuk alat{" "}
                                            <strong className="font-bold">{formData.name}</strong>{" "}
                                            yang sedang dipinjam oleh{" "}
                                            <strong className="font-bold">{formData.borrower}</strong>
                                            .
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Tanggal Pengembalian Baru
                                        </label>
                                        <input
                                            type="date"
                                            required={true}
                                            name="returnDate"
                                            value={formData.returnDate}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            ) : modalConfig.mode === "return" ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-2">
                                        <p className="text-xs text-indigo-800 dark:text-indigo-300">
                                            Anda akan mengembalikan alat{" "}
                                            <strong className="font-bold">{formData.name}</strong>{" "}
                                            yang dipinjam oleh{" "}
                                            <strong className="font-bold">{formData.borrower}</strong>
                                            . Silakan perbarui kondisi terakhir alat ini.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Kondisi Alat Saat Dikembalikan
                                        </label>
                                        <select
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        >
                                            <option value="Baik">Baik</option>
                                            <option value="Rusak Ringan">Rusak Ringan</option>
                                            <option value="Rusak Berat">Rusak Berat</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {modalConfig.mode !== "edit" && (
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                                ID / Kode Alat
                                            </label>
                                            <input
                                                required={true}
                                                name="id"
                                                value={formData.id}
                                                onChange={handleChange}
                                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                                placeholder="Cth: INV-2023-001"
                                            />
                                        </div>
                                    )}
                                    <div
                                        className={`col-span-2 ${modalConfig.mode !== "edit" ? "sm:col-span-1" : ""}`}
                                    >
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Nama Alat
                                        </label>
                                        <input
                                            required={true}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                            placeholder="Cth: Drone DJI Mavic"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Kategori
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        >
                                            <option value="Alat Ukur">Alat Ukur</option>
                                            <option value="Kendaraan">Kendaraan</option>
                                            <option value="Elektronik">Elektronik</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Kondisi
                                        </label>
                                        <select
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        >
                                            <option value="Baik">Baik</option>
                                            <option value="Rusak Ringan">Rusak Ringan</option>
                                            <option value="Rusak Berat">Rusak Berat</option>
                                        </select>
                                    </div>
                                </div>
                            )
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Nama Personil
                                    </label>
                                    <input
                                        required={true}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                        placeholder="Cth: Ir. Budi Santoso"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tim
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    >
                                        <option value="Arsitek">Arsitek</option>
                                        <option value="QS">Quantity Surveyor (QS)</option>
                                        <option value="Struktur">Struktur</option>
                                        <option value="MEP">MEP</option>
                                        <option value="Tata Ruang">Tata Ruang</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Tingkat Jabatan
                                    </label>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                    >
                                        <option value="Staff">Staff (Anggota)</option>
                                        <option value="Team Leader">Team Leader</option>
                                        <option value="PIC">PIC</option>
                                        <option value="Kordinator Divisi Jalan">
                                            Kordinator Divisi Jalan
                                        </option>
                                        <option value="Kordinator Divisi Gedung">
                                            Kordinator Divisi Gedung
                                        </option>
                                        <option value="Kordinator Divisi SDA">
                                            Kordinator Divisi SDA
                                        </option>
                                        <option value="Kordinator Divisi Perijinan">
                                            Kordinator Divisi Perijinan
                                        </option>
                                        <option value="Kordinator Divisi Tata Ruang">
                                            Kordinator Divisi Tata Ruang
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                        Rating Kinerja (1-5)
                                    </label>
                                    <div className="flex gap-2 items-center p-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        rating: star,
                                                    })
                                                }
                                                className={`transition-colors focus:outline-none ${star <= (formData.rating || 3) ? "text-amber-500" : "text-slate-200 dark:text-slate-700"}`}
                                            >
                                                <Icon name="star" size={28} />
                                            </button>
                                        ))}
                                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                                            Bintang {formData.rating || 3}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Tambah / Kurang Skor KPI (+/-)
                                        </label>
                                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                            Nilai ini akan langsung ditambahkan secara relatif ke skor
                                            terakhir. Contoh: Jika skor 60 dan Anda isi 40, skor
                                            menjadi 100.
                                        </p>
                                        <div className="flex flex-wrap gap-3 items-center mt-2">
                                            <input
                                                type="number"
                                                name="adjustmentInput"
                                                value={
                                                    formData.adjustmentInput === "" ||
                                                        isNaN(formData.adjustmentInput)
                                                        ? ""
                                                        : formData.adjustmentInput !== void 0
                                                            ? formData.adjustmentInput
                                                            : 0
                                                }
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        adjustmentInput:
                                                            e.target.value === ""
                                                                ? ""
                                                                : parseInt(e.target.value),
                                                    })
                                                }
                                                className="w-24 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-center outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleResetTo100}
                                                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Icon name="target" size={12} />
                                                Reset ke 100
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleResetToAuto}
                                                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                                title="Hapus semua penyesuaian manual dan kembalikan ke perhitungan murni otomatis proyek."
                                            >
                                                <Icon name="refresh-ccw" size={12} />
                                                Hapus Manual
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl mt-4">
                                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                                        💡 <strong className="font-bold">Info Cerdas:</strong>{" "}
                                        Jumlah proyek dan Persentase Beban Kerja orang ini tidak
                                        perlu diinput manual. Sistem akan otomatis menghitungnya
                                        berdasarkan seberapa banyak proyek yang ia tangani di menu
                                        List Proyek.
                                    </p>
                                </div>
                            </>
                        )}
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <button
                        onClick={closeModal}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        form="crudForm"
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70"
                    >
                        {loading ? (
                            <Icon name="refresh-ccw" className="animate-spin" size={16} />
                        ) : (
                            <Icon name="save" size={16} />
                        )}
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

const ExpertModalForm = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);


    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && modalConfig.data) return { ...modalConfig.data };
        return { id: '', name: '', phone: '', status: 'Tersedia', jenjang: '', bidangIlmu: '', perusahaan: '', linkedResourceName: '', keterangan: '' };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleExpertAction(isEdit ? 'edit' : 'add', formData);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Data Tenaga Ahli' : 'Tambah Tenaga Ahli'}</h3>
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="expertForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / WhatsApp</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenjang & Bidang Ilmu</label>
                            <input type="text" placeholder="Cth: SMA, S1 Teknik Sipil Thn 1997" value={formData.bidangIlmu || ''} onChange={e => setFormData({ ...formData, bidangIlmu: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Perusahaan / Instansi</label>
                            <select value={formData.perusahaan || ''} onChange={e => setFormData({ ...formData, perusahaan: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                <option value="">-- Pilih Perusahaan --</option>
                                <option value="PT. Gaharu Sempana">PT. Gaharu Sempana</option>
                                <option value="PT. Kencana Adhi Karma">PT. Kencana Adhi Karma</option>
                                <option value="CV. Cipta Asri Disain">CV. Cipta Asri Disain</option>
                                <option value="CV. Tataring Bali">CV. Tataring Bali</option>
                                <option value="Freelance">Freelance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Icon name="link" size={14} className="text-indigo-500" /> Hubungkan dgn Personil Internal (Opsional)</label>
                            <input type="text" list="internal-resources-list" placeholder="-- Ketik untuk mencari personil atau biarkan kosong --" value={formData.linkedResourceName || ''} onChange={e => setFormData({ ...formData, linkedResourceName: e.target.value })} className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-indigo-50/30 dark:bg-indigo-900/10 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                            <datalist id="internal-resources-list">
                                {resources.map(r => (
                                    <option key={r.id || r.name} value={r.name}>{r.name} ({r.role})</option>
                                ))}
                            </datalist>
                            <p className="text-[10px] text-slate-500 mt-1">Pilih ini jika nama Tenaga Ahli di kontrak berbeda dengan nama di menu Alokasi Tim agar tetap terbaca & tersinkron pada beban kerja.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Icon name="file-text" size={14} className="text-slate-500" /> Keterangan</label>
                            <textarea rows="3" value={formData.keterangan || ''} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Tambahkan keterangan tambahan (opsional)..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all resize-none"></textarea>
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                    <button form="expertForm" type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2">
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const ExpertCertModalForm = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);


    const { expertId, certIndex, cert } = modalConfig.data || {};
    const expert = experts.find(e => e.id === expertId);
    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && cert) return { ...cert };
        return { certName: '', certLevel: 'Ahli Muda', issuedDate: '', expiredDate: '' };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expert) return;
        let newCerts = [...(expert.certificates || [])];
        if (isEdit) {
            newCerts[certIndex] = formData;
        } else {
            newCerts.push(formData);
        }
        handleExpertAction('update_certificates', { ...expert, certificates: newCerts });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-6 relative overflow-hidden">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Sertifikat' : 'Tambah Sertifikat'}</h3>
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="p-6">
                    <form id="expertCertForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nama Sertifikat</label>
                                <button type="button" onClick={() => setShowCertManager(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1">
                                    <Icon name="settings" size={12} /> Kelola Daftar
                                </button>
                            </div>
                            <input type="text" required list="cert-options" value={formData.certName} onChange={e => setFormData({ ...formData, certName: e.target.value })} placeholder="Cth: SKA Ahli Teknik Bangunan Gedung" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                            <datalist id="cert-options">
                                {certList.map((cert, idx) => <option key={idx} value={cert} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat / Kualifikasi</label>
                            <select value={formData.certLevel} onChange={e => setFormData({ ...formData, certLevel: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                <option value="Ahli Muda">Ahli Muda</option>
                                <option value="Ahli Madya">Ahli Madya</option>
                                <option value="Ahli Utama">Ahli Utama</option>
                                <option value="Level 1">Level 1</option>
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3">Level 3</option>
                                <option value="Level 4">Level 4</option>
                                <option value="Level 5">Level 5</option>
                                <option value="Level 6">Level 6</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tgl Terbit</label>
                                <input type="date" required value={formData.issuedDate} onChange={e => setFormData({ ...formData, issuedDate: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tgl Berakhir</label>
                                <input type="date" required value={formData.expiredDate} onChange={e => setFormData({ ...formData, expiredDate: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                    <button form="expertCertForm" type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2">
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const ExpertTenderModalForm = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);


    const { expertId, tenderIndex, tender } = modalConfig.data || {};
    const expert = experts.find(e => e.id === expertId);
    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && tender) return { ...tender };
        return { lpseName: '', position: 'Team Leader', status: 'Aktif' };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expert) return;

        // Validation rule
        if (formData.status === 'Aktif' || formData.status === 'Menunggu Pengumuman') {
            const existingActive = (expert.tenders || []).find((t, idx) =>
                (!isEdit || idx !== tenderIndex) &&
                t.lpseName.trim().toLowerCase() === formData.lpseName.trim().toLowerCase() &&
                (t.status === 'Aktif' || t.status === 'Menunggu Pengumuman')
            );

            if (existingActive) {
                setAlertModal({ isOpen: true, title: 'Kapasitas Penuh', message: `Gagal menyimpan! Tenaga Ahli ini sudah memiliki tender aktif/menunggu di ${existingActive.lpseName}. Sesuai aturan, tidak boleh dipasang pada lebih dari 1 tender aktif di LPSE yang sama.` });
                return;
            }
        }

        let newTenders = [...(expert.tenders || [])];
        if (isEdit) {
            newTenders[tenderIndex] = formData;
        } else {
            newTenders.push(formData);
        }
        handleExpertAction('update_tenders', { ...expert, tenders: newTenders });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModalConfig({ isOpen: false, type: null, mode: null, data: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-6 relative overflow-hidden">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Riwayat Tender' : 'Plotting Tender LPSE'}</h3>
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="p-6">
                    <form id="expertTenderForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama / Instansi LPSE</label>
                            <div className="flex gap-2 items-center">
                                <input type="text" list="lpse-options" required value={formData.lpseName} onChange={e => setFormData({ ...formData, lpseName: e.target.value })} placeholder="Cth: LPSE Kementerian PUPR" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                <datalist id="lpse-options">
                                    {lpseList.map((lpse, idx) => <option key={idx} value={lpse} />)}
                                </datalist>
                                <button type="button" onClick={() => setShowLpseManager(true)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors shrink-0" title="Kelola Daftar LPSE">
                                    <Icon name="settings" size={18} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Posisi / Jabatan yang Ditawarkan</label>
                            <input type="text" required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Cth: Team Leader / Ahli Struktur" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Tender</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                <option value="Menunggu Pengumuman">Menunggu Pengumuman</option>
                                <option value="Aktif">Aktif (Sedang Proses)</option>
                                <option value="Menang">Menang</option>
                                <option value="Kalah">Kalah / Gugur</option>
                                <option value="Selesai">Selesai / Riwayat</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                    <button form="expertTenderForm" type="submit" disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2">
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const AssignmentModalForm = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);



    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && modalConfig.data) {
            return { ...modalConfig.data, experts: modalConfig.data.experts || [], termins: modalConfig.data.termins || [] };
        }
        return { jobName: '', projectType: 'Pengawasan', contractType: 'Waktu Penugasan', tenderType: 'Tender', lpseName: '', startDate: '', duration: '', contractValue: '', company: '', experts: [], termins: [] };
    });

    // Auto hitung end date jika start date & durasi diisi
    const [endDate, setEndDate] = useState('');
    

    useEffect(() => {
        if (formData.startDate && formData.duration) {
            const start = new Date(formData.startDate);
            const days = parseInt(formData.duration, 10);
            if (!isNaN(days)) {
                const end = new Date(start);
                end.setDate(start.getDate() + days);
                setEndDate(end.toISOString().split('T')[0]);
            } else {
                setEndDate('');
            }
        } else {
            setEndDate('');
        }
    }, [formData.startDate, formData.duration]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.jobName || !formData.lpseName) {
            setAlertModal({ isOpen: true, title: 'Validasi Form', message: 'Harap lengkapi informasi pekerjaan!' });
            return;
        }
        if (!formData.experts || formData.experts.length === 0) {
            setAlertModal({ isOpen: true, title: 'Validasi Form', message: 'Harap plot minimal 1 tenaga ahli ke pekerjaan ini!' });
            return;
        }

        for (let i = 0; i < formData.experts.length; i++) {
            const exp = formData.experts[i];
            if (!exp.expertId || !exp.manMonth) {
                setAlertModal({ isOpen: true, title: 'Validasi Form', message: `Harap lengkapi data personil (Tenaga Ahli dan Man Month) di baris ke-${i + 1}` });
                return;
            }

            // Cek aturan perundang-undangan LPSE
            const expertObj = experts.find(e => e.id === exp.expertId);
            const expertName = expertObj ? expertObj.name : 'Tenaga Ahli';

            const existingAssignmentsInSameLpse = assignments.filter(asg => {
                if (isEdit && asg.id === formData.id) return false;
                if ((asg.lpseName || '').trim().toLowerCase() !== (formData.lpseName || '').trim().toLowerCase()) return false;

                // Abaikan pekerjaan yang sudah expired / lewat dari hari ini
                if (asg.endDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const asgEnd = new Date(asg.endDate);
                    asgEnd.setHours(0, 0, 0, 0);
                    if (asgEnd < today) {
                        return false; // Pekerjaan sudah selesai dan dianggap hilang, jadi tidak masuk kuota
                    }
                }

                // Cek overlapping tanggal (jika tanggal akhir pekerjaan lama sudah lewat dari tanggal mulai pekerjaan baru, maka aman dan tidak masuk perhitungan kuota)
                if (formData.startDate && endDate && asg.startDate && asg.endDate) {
                    const newStart = new Date(formData.startDate);
                    const newEnd = new Date(endDate);
                    const asgStart = new Date(asg.startDate);
                    const asgEnd = new Date(asg.endDate);

                    // Reset time to 00:00:00 to prevent edge case issues
                    newStart.setHours(0, 0, 0, 0);
                    newEnd.setHours(0, 0, 0, 0);
                    asgStart.setHours(0, 0, 0, 0);
                    asgEnd.setHours(0, 0, 0, 0);

                    if (newStart > asgEnd || newEnd < asgStart) {
                        return false; // Tidak tumpang tindih, boleh diplot
                    }
                }

                return (asg.experts || []).some(e => e.expertId === exp.expertId);
            });

            const countWaktuPenugasan = existingAssignmentsInSameLpse.filter(asg => (asg.contractType || 'Waktu Penugasan') === 'Waktu Penugasan').length;
            const countLumsum = existingAssignmentsInSameLpse.filter(asg => asg.contractType === 'Lumsum').length;

            if (countWaktuPenugasan >= 1) {
                setAlertModal({ isOpen: true, title: 'Kapasitas Penuh', message: `Gagal menyimpan! ${expertName} sudah memiliki 1 pekerjaan Waktu Penugasan di ${formData.lpseName}.\n\nSesuai aturan, Tenaga Ahli tidak dapat di-plot di pekerjaan baru (Waktu Penugasan / Lumsum) pada LPSE yang sama.` });
                return;
            }
            if (countLumsum >= 3) {
                setAlertModal({ isOpen: true, title: 'Kapasitas Penuh', message: `Gagal menyimpan! ${expertName} sudah memiliki 3 pekerjaan Lumsum di ${formData.lpseName}.\n\nSesuai aturan, Tenaga Ahli telah mencapai batas maksimal 3 pekerjaan dan tidak dapat di-plot di pekerjaan baru pada LPSE yang sama.` });
                return;
            }

            if ((formData.contractType || 'Waktu Penugasan') === 'Waktu Penugasan') {
                if (countLumsum > 0) {
                    setAlertModal({ isOpen: true, title: 'Melanggar Batas Aturan', message: `Gagal menyimpan! ${expertName} sudah memiliki pekerjaan Lumsum di ${formData.lpseName}.\n\nTenaga ahli tidak dapat ditambahkan ke pekerjaan Waktu Penugasan karena tidak dapat digabungkan dengan kontrak Lumsum yang sudah berjalan.` });
                    return;
                }
            }
        }
        const cleanedExperts = formData.experts.map(exp => {
            const { expertSearchTemp, ...rest } = exp;
            return rest;
        });

        const payload = { ...formData, experts: cleanedExperts, endDate };
        handleAssignmentAction(isEdit ? 'edit' : 'add', payload);
    };

    const handleAddExpertRow = () => {
        setFormData(prev => ({
            ...prev,
            experts: [...(prev.experts || []), { expertId: '', role: '', certificateName: '', additionalCertificates: [], manMonth: '', billingRate: '' }]
        }));
    };

    const handleRemoveExpertRow = (index) => {
        setFormData(prev => {
            const newExperts = [...prev.experts];
            newExperts.splice(index, 1);
            return { ...prev, experts: newExperts };
        });
    };

    const toRoman = (num) => {
        const roman = ["O", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
        return roman[num] || num;
    };

    const handleAddTerminRow = () => {
        setFormData(prev => {
            const termins = prev.termins || [];
            const newLabel = `Termin ${toRoman(termins.length + 1)}`;
            return {
                ...prev,
                termins: [...termins, { label: newLabel, status: 'Belum Diajukan', date: '', nominal: '', percentage: '', notes: '' }]
            };
        });
    };

    const handleRemoveTerminRow = (index) => {
        setFormData(prev => {
            const newTermins = [...(prev.termins || [])];
            newTermins.splice(index, 1);
            // Rename labels to stay sequential with Roman numerals
            newTermins.forEach((t, i) => {
                t.label = `Termin ${toRoman(i + 1)}`; 
            });
            return { ...prev, termins: newTermins };
        });
    };

    const handleExpertRowChange = (index, field, value) => {
        setFormData(prev => {
            const newExperts = [...prev.experts];
            newExperts[index] = { ...newExperts[index], [field]: value };

            // Reset certificate when expert changes
            if (field === 'expertId') {
                newExperts[index].certificateName = '';
                newExperts[index].additionalCertificates = [];
            }

            return { ...prev, experts: newExperts };
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center fade-in p-4">
            <div className="glass-card rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden transform scale-in border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Penugasan' : 'Tambah Penugasan'}</h3>
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="assignmentForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* SEKSI INFORMASI PEKERJAAN */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Informasi Pekerjaan</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pekerjaan</label>
                                    <input type="text" required value={formData.jobName} onChange={e => setFormData({ ...formData, jobName: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Klien / Owner Proyek</label>
                                    <input type="text" value={formData.clientName || ''} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder={formData.lpseName || 'Cth: Dinas PUPR Provinsi Bali'} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                    <p className="text-[10px] text-slate-400 mt-1">Jika kosong, akan menggunakan nama LPSE. Tampil di List Proyek.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">LPSE / Instansi</label>
                                    <div className="flex gap-2 items-center">
                                        <input type="text" list="assignment-lpse-options" required value={formData.lpseName} onChange={e => setFormData({ ...formData, lpseName: e.target.value })} placeholder="Cth: LPSE Provinsi Bali" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                        <datalist id="assignment-lpse-options">
                                            {lpseList.map((lpse, idx) => <option key={idx} value={lpse} />)}
                                        </datalist>
                                        <button type="button" onClick={() => setShowLpseManager(true)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors shrink-0" title="Kelola Daftar LPSE">
                                            <Icon name="settings" size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Perusahaan</label>
                                    <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Cth: PT. XYZ" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nilai Kontrak</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
                                        <input
                                            type="text"
                                            value={formData.contractValue || ''}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                const formatted = val ? new Intl.NumberFormat('id-ID').format(val) : '';
                                                setFormData({ ...formData, contractValue: formatted });
                                            }}
                                            placeholder="0"
                                            className="w-full pl-9 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Banner info sinkronisasi otomatis */}
                            {(formData.projectType === 'Pengawasan' || formData.projectType === 'Manajemen Konstruksi') && (
                                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300">
                                    <Icon name="link" size={14} className="mt-0.5 shrink-0" />
                                    <span><strong>Sinkronisasi Otomatis Aktif:</strong> Menyimpan data ini akan otomatis membuat/memperbarui entri proyek di menu <strong>List Proyek</strong>. Status Turun/Tidak Turun tetap bisa diubah dari List Proyek.</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Proyek</label>
                                    <select required value={formData.projectType || 'Pengawasan'} onChange={e => setFormData({ ...formData, projectType: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                        <option value="Pengawasan">Pengawasan</option>
                                        <option value="Perencanaan">Perencanaan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Kontrak</label>
                                    <select required value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                        <option value="Waktu Penugasan">Waktu Penugasan</option>
                                        <option value="Lumsum">Lumsum</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Paket</label>
                                    <select required value={formData.tenderType} onChange={e => setFormData({ ...formData, tenderType: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                        <option value="Tender">Tender</option>
                                        <option value="PL">PL</option>
                                        <option value="RO">RO</option>
                                        <option value="PBG">PBG</option>
                                        <option value="SLF">SLF</option>
                                        <option value="PBG & SLF">PBG & SLF</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SPMK (Tanggal)</label>
                                    <div className="relative w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
                                        <div className="absolute inset-0 p-2.5 flex items-center justify-between pointer-events-none">
                                            <span className={`text-sm ${formData.startDate ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                                                {formData.startDate ? formatDateIndo(formData.startDate) : "Pilih Tanggal"}
                                            </span>
                                            <Icon name="calendar" size={16} className="text-slate-400" />
                                        </div>
                                        <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-2.5 opacity-0 cursor-pointer outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Durasi Kontrak (Hari)</label>
                                    <input type="number" min="1" required value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="Cth: 90" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Akhir Kontrak Induk</label>
                                    <div className="relative w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
                                        <div className="absolute inset-0 p-2.5 flex items-center justify-between pointer-events-none">
                                            <span className={`text-sm ${endDate ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                                                {endDate ? formatDateIndo(endDate) : "Pilih Tanggal"}
                                            </span>
                                            <Icon name="calendar" size={16} className="text-slate-400" />
                                        </div>
                                        <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 opacity-0 cursor-pointer outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        {/* SEKSI PENGAMPRAHAN TERMIN */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Progress Pengamprahan Termin</h4>
                                <button type="button" onClick={handleAddTerminRow} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    <Icon name="plus" size={14} /> Tambah Termin
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(formData.termins || []).map((termin, index) => {
                                    const canEditTermin = userRole === 'Super Admin' || userRole === 'Manajer Administrasi';
                                    return (
                                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 relative group">
                                            <div className="flex items-center md:col-span-2 justify-between">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{termin.label}</span>
                                                <button type="button" onClick={() => handleRemoveTerminRow(index)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded md:hidden group-hover:block transition-all opacity-0 group-hover:opacity-100" title="Hapus Termin">
                                                    <Icon name="trash-2" size={14} />
                                                </button>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                                                <select
                                                    disabled={!canEditTermin}
                                                    value={termin.status}
                                                    onChange={(e) => {
                                                        const newTermins = [...formData.termins];
                                                        newTermins[index].status = e.target.value;
                                                        setFormData({ ...formData, termins: newTermins });
                                                    }}
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <option value="Belum Diajukan">Belum Diajukan</option>
                                                    <option value="Selesai">Selesai</option>
                                                    <option value="Tertunda">Tertunda</option>
                                                </select>
                                            </div>
                                            {(termin.status === 'Selesai' || termin.status === 'Tertunda') && (
                                                <>
                                                    <div className="md:col-span-3">
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal</label>
                                                        <input
                                                            disabled={!canEditTermin}
                                                            type="date"
                                                            value={termin.date}
                                                            onChange={(e) => {
                                                                const newTermins = [...formData.termins];
                                                                newTermins[index].date = e.target.value;
                                                                setFormData({ ...formData, termins: newTermins });
                                                            }}
                                                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nominal & %</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                disabled={!canEditTermin}
                                                                type="text"
                                                                placeholder="Rp"
                                                                value={termin.nominal}
                                                                onChange={(e) => {
                                                                    const newTermins = [...formData.termins];
                                                                    // Format rupiah
                                                                    let val = e.target.value.replace(/[^0-9]/g, '');
                                                                    if (val) {
                                                                        val = parseInt(val, 10).toLocaleString('id-ID');
                                                                    }
                                                                    newTermins[index].nominal = val;
                                                                    setFormData({ ...formData, termins: newTermins });
                                                                }}
                                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                            />
                                                            <input
                                                                disabled={!canEditTermin}
                                                                type="number"
                                                                placeholder="%"
                                                                min="0"
                                                                max="100"
                                                                value={termin.percentage}
                                                                onChange={(e) => {
                                                                    const newTermins = [...formData.termins];
                                                                    newTermins[index].percentage = e.target.value;
                                                                    setFormData({ ...formData, termins: newTermins });
                                                                }}
                                                                className="w-16 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SEKSI PLOTTING TENAGA AHLI */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Plotting Tenaga Ahli</h4>
                                <button type="button" onClick={handleAddExpertRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    <Icon name="plus" size={14} /> Tambah Personil
                                </button>
                            </div>

                            {(formData.experts || []).length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                    <p className="text-sm text-slate-500">Belum ada tenaga ahli yang diplot pada pekerjaan ini.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.experts.map((expPlot, idx) => {
                                        const selectedExpertObj = experts.find(e => e.id === expPlot.expertId);
                                        const availableCerts = selectedExpertObj?.certificates || [];

                                        return (
                                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 relative group">
                                                <div className="md:col-span-4 lg:col-span-3">
                                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama</label>
                                                    <input
                                                        type="text"
                                                        list={`expert-list-${idx}`}
                                                        required
                                                        value={expPlot.expertSearchTemp !== undefined ? expPlot.expertSearchTemp : (selectedExpertObj ? selectedExpertObj.name : '')}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const matched = experts.find(ex => ex.name === val);
                                                            setFormData(prev => {
                                                                const newExperts = [...prev.experts];
                                                                if (matched) {
                                                                    newExperts[idx] = { ...newExperts[idx], expertId: matched.id, expertSearchTemp: undefined, certificateName: '', additionalCertificates: [] };
                                                                } else {
                                                                    newExperts[idx] = { ...newExperts[idx], expertId: '', expertSearchTemp: val };
                                                                }
                                                                return { ...prev, experts: newExperts };
                                                            });
                                                        }}
                                                        placeholder="Cari atau ketik nama..."
                                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                                    />
                                                    <datalist id={`expert-list-${idx}`}>
                                                        {experts.map(e => <option key={e.id} value={e.name} />)}
                                                    </datalist>
                                                </div>
                                                <div className="md:col-span-4 lg:col-span-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500">Jabatan</label>
                                                        {idx === 0 && (
                                                            <button type="button" onClick={() => setShowRoleManager(true)} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1" title="Kelola Daftar Jabatan">
                                                                <Icon name="settings" size={12} /> Kelola
                                                            </button>
                                                        )}
                                                    </div>
                                                    <select required value={expPlot.role || ''} onChange={e => handleExpertRowChange(idx, 'role', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                                        <option value="">-- Pilih Jabatan --</option>
                                                        {(roleList[formData.projectType || 'Pengawasan'] || []).map(r => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 lg:col-span-2">
                                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Man Month</label>
                                                    <input type="text" required value={expPlot.manMonth} onChange={e => handleExpertRowChange(idx, 'manMonth', e.target.value)} placeholder="Cth: 1.5" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all" />
                                                </div>
                                                <div className="md:col-span-2 lg:col-span-4">
                                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Billing Rate</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">Rp</span>
                                                        <input
                                                            type="text"
                                                            value={expPlot.billingRate || ''}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                const formatted = val ? new Intl.NumberFormat('id-ID').format(val) : '';
                                                                handleExpertRowChange(idx, 'billingRate', formatted);
                                                            }}
                                                            placeholder="0"
                                                            className="w-full pl-8 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-12 flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sertifikat Utama</label>
                                                        <select value={expPlot.certificateName || ''} onChange={e => handleExpertRowChange(idx, 'certificateName', e.target.value)} className="w-full md:w-1/2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                                            <option value="">-- Tidak Pakai / Kosong --</option>
                                                            {availableCerts.map((c, i) => {
                                                                const isExpired = c.expiredDate && new Date(c.expiredDate) < new Date();
                                                                return (
                                                                    <option key={`cert1-${i}`} value={c.certName} disabled={isExpired} className={isExpired ? "text-slate-400" : ""}>
                                                                        {c.certName} ({c.certLevel}) {isExpired ? '(EXPIRED)' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                    {(expPlot.additionalCertificates || []).map((addCert, cIdx) => (
                                                        <div key={`add-cert-${cIdx}`} className="flex gap-2 w-full md:w-1/2">
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sertifikat Tambahan {cIdx + 1}</label>
                                                                <select value={addCert || ''} onChange={e => {
                                                                    const newAdditional = [...(expPlot.additionalCertificates || [])];
                                                                    newAdditional[cIdx] = e.target.value;
                                                                    handleExpertRowChange(idx, 'additionalCertificates', newAdditional);
                                                                }} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-inner transition-all">
                                                                    <option value="">-- Pilih Sertifikat --</option>
                                                                    {availableCerts.map((c, i) => {
                                                                        const isExpired = c.expiredDate && new Date(c.expiredDate) < new Date();
                                                                        return (
                                                                            <option key={`addcert-${cIdx}-${i}`} value={c.certName} disabled={isExpired} className={isExpired ? "text-slate-400" : ""}>
                                                                                {c.certName} ({c.certLevel}) {isExpired ? '(EXPIRED)' : ''}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                            </div>
                                                            <div className="pt-5">
                                                                <button type="button" onClick={() => {
                                                                    const newAdditional = [...(expPlot.additionalCertificates || [])];
                                                                    newAdditional.splice(cIdx, 1);
                                                                    handleExpertRowChange(idx, 'additionalCertificates', newAdditional);
                                                                }} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg" title="Hapus Sertifikat">
                                                                    <Icon name="trash" size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => {
                                                        const newAdditional = [...(expPlot.additionalCertificates || []), ''];
                                                        handleExpertRowChange(idx, 'additionalCertificates', newAdditional);
                                                    }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold self-start flex items-center gap-1 hover:underline">
                                                        <Icon name="plus" size={12} /> Tambah Sertifikat Tambahan
                                                    </button>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveExpertRow(idx)} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Hapus Baris">
                                                    <Icon name="x" size={14} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                    <button form="assignmentForm" type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-70 flex items-center gap-2">
                        {loading ? <Icon name="refresh-ccw" className="animate-spin" size={16} /> : <Icon name="save" size={16} />} Simpan
                    </button>
                </div>

            </div>
        </div>
    );
}

const ImportExcelModal = () => {
    const { modalConfig, setModalConfig, projects, setProjects, inventory, setInventory, resources, setResources, experts, setExperts, assignments, setAssignments, lpseList, setLpseList, certList, setCertList, roleList, setRoleList, showRoleManager, setShowRoleManager, handleCrudAction, handleExpertAction, handleAssignmentAction, currentUser, userRole, canAccessMenu, alertModal, setAlertModal, adminAsetFormData, setAdminAsetFormData, closeModal, handleInventoryAction, handleImportExcel, loading, setLoading, setShowLpseManager, setShowCertManager } = useContext(AppContext);



    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setImportModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-md p-8 relative overflow-hidden">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Import Data Excel</h3>
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Silakan download template format Excel yang didukung sistem terlebih dahulu untuk menghindari kesalahan input.</p>

                    <button onClick={() => {
                        const ws_data = [
                            ["Nama Personil", "No HP", "Status", "Jenjang dan Bidang Ilmu", "Perusahaan", "Sertifikat Keahlian", "Jenjang", "Masa Berlaku"],
                            ["Contoh: Budi Santoso", "08123456789", "Tersedia", "S1 Teknik Sipil", "PT. Maju Jaya", "Ahli Teknik Bangunan Gedung", "Madya", "2027-12-31"]
                        ];
                        const ws = XLSX.utils.aoa_to_sheet(ws_data);
                        ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Template");
                        XLSX.writeFile(wb, "Template_Import_Tenaga_Ahli.xlsx");
                    }} className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Icon name="download" size={18} /> Download Template Excel
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold">ATAU</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    </div>

                    <label className="w-full cursor-pointer px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors shadow-md">
                        <Icon name="upload" size={18} /> Pilih File & Import
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => {
                            setModalConfig({ isOpen: false, type: null });
                            handleImportExcel(e);
                        }} className="hidden" />
                    </label>
                </div>
            </motion.div>
        </div>
    );
}

function AppShell() {
    const { currentUser, userRole, username, canAccessMenu, canCreateProject, canDeleteProject, canEditProjectAdmin, canEditProjectTechnical, canEditTeamAllocation, canEditExperts, canManageAssignments, canManageAsset } = useAuth();

    const handleLogout = async () => {
        const userData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
        await logActivity('LOGOUT', 'Autentikasi', 'Keluar dari sistem', userData);
        auth.signOut();
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [activityLogs, setActivityLogs] = useState([]);

    const [showCurtain, setShowCurtain] = useState(false);
    const [animateCurtain, setAnimateCurtain] = useState(false);

    const [sopDocuments, setSopDocuments] = useState([]);
    const [loadingSOP, setLoadingSOP] = useState(true);
    const [uploadingSOP, setUploadingSOP] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const fileInputRef = useRef(null);
    const canManageSOP = userRole?.toLowerCase() === 'super admin' || userRole?.toLowerCase() === 'manajer';

    useEffect(() => {
        if (!currentUser) {
            // Reset state when logged out so it triggers again on next login
            setAnimateCurtain(false);
            setShowCurtain(false);
        } else if (currentUser && userRole !== 'Guest' && !animateCurtain) {
            setShowCurtain(true);
            setTimeout(() => setAnimateCurtain(true), 50);
            setTimeout(() => {
                setShowCurtain(false);
            }, 1500); // Animation duration
        }
    }, [currentUser, userRole, animateCurtain]);

    // Fallback: If user loses access to current tab, redirect to dashboard
    useEffect(() => {
        if (userRole) {
            if (activeTab === 'proyek' && !canAccessMenu('Proyek')) setActiveTab('dashboard');
            if (activeTab === 'tim' && !canAccessMenu('Alokasi Tim')) setActiveTab('dashboard');
            if (activeTab === 'gantt' && !canAccessMenu('Plotting Jadwal')) setActiveTab('dashboard');
            if (activeTab === 'ahli' && !canAccessMenu('Tenaga Ahli')) setActiveTab('dashboard');
            if (activeTab === 'penugasan' && !canAccessMenu('Manajemen LPSE')) setActiveTab('dashboard');
            if (activeTab === 'pengguna' && !canAccessMenu('Manajemen Pengguna')) setActiveTab('dashboard');
            if (activeTab === 'admin-aset' && !canAccessMenu('Admin Aset')) setActiveTab('dashboard');
            if (activeTab === 'kpi' && !canAccessMenu('KPI')) setActiveTab('dashboard');
        }
    }, [userRole, activeTab]);


    useEffect(() => {
        const handleShowAlert = (e) => {
            setAlertModal({ isOpen: true, title: e.detail.title, message: e.detail.message });
        };
        window.addEventListener('show-alert', handleShowAlert);
        return () => window.removeEventListener('show-alert', handleShowAlert);
    }, []);

    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [activeScheduleProject, setActiveScheduleProject] = useState(null);
    const [scheduleZoom, setScheduleZoom] = useState('month');
    const [scheduleFilterUser, setScheduleFilterUser] = useState('Semua');
    const [scheduleCollapsedCats, setScheduleCollapsedCats] = useState({});

    const [chartAnimate, setChartAnimate] = useState(false);

    useEffect(() => {
        if (activeScheduleProject) {
            setChartAnimate(false);
            setTimeout(() => setChartAnimate(true), 100);
        }
    }, [activeScheduleProject]);
    const [scheduleViewType, setScheduleViewType] = useState('timeline');
    const [projects, setProjects] = useState([]);
    const [resources, setResources] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [experts, setExperts] = useState([]);
    const [borrowCart, setBorrowCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLive, setIsLive] = useState(false);

    // Admin Aset States
    const [adminAsetFilter, setAdminAsetFilter] = useState('Semua');
    const [adminAsetSearch, setAdminAsetSearch] = useState('');
    const [adminAsetModal, setAdminAsetModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [adminAsetConfirm, setAdminAsetConfirm] = useState({ isOpen: false, item: null, action: null });
    const [adminAsetFormData, setAdminAsetFormData] = useState({});

    const [printData, setPrintData] = useState(null);
    const [printZoomProject, setPrintZoomProject] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printOptions, setPrintOptions] = useState({ projectType: 'Semua', section: 'Semua' });

    // Pending Modal States
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingProjectData, setPendingProjectData] = useState(null);
    const [pendingReasonText, setPendingReasonText] = useState('');

    // Resume Modal States
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeProjectData, setResumeProjectData] = useState(null);

    // Alert Modal States

    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        if (savedMode) return savedMode === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    React.useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Online State
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);


    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Perhatian', message: '' });


    // Old URL Web App Google Apps Script (Digunakan sekali saat migrasi otomatis)
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEt5puRB26FO6mGfnxVvofBJaDwLtH3O0yd-Ugsugn2D2KezKpi_ynGz7hw24kpLIpRQ/exec';
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, mode: 'add', data: null });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
    const [lpseList, setLpseList] = useState([]);
    const [showLpseManager, setShowLpseManager] = useState(false);
    const [assignments, setAssignments] = useState([]);

    const handleUpdateLpseList = (newList) => {
        lpseService.saveLpseList(newList);
        setLpseList(newList);
    };

    const [certList, setCertList] = useState([]);
    const [roleList, setRoleList] = useState({
        Perencanaan: ['Team Leader', 'Tenaga Ahli', 'K3', 'Quantity Surveyor / Cost Estimator', 'Drafter / Operator CAD', 'Surveyor', 'Administrasi'],
        Pengawasan: ['Team Leader', 'Tenaga Ahli', 'Inspector', 'Laboratory Technician', 'Quantity Surveyor', 'K3', 'Administrasi']
    });
    const [showRoleManager, setShowRoleManager] = useState(false);

    const [showCertManager, setShowCertManager] = useState(false);
    const handleUpdateCertList = (newList) => {
        expertService.saveCertList(newList);
        setCertList(newList);
    };
    const [showKPIInfoModal, setShowKPIInfoModal] = useState(false);
    const [showProjectTypeModal, setShowProjectTypeModal] = useState(false);

    // State pencarian
    const [searchTeamTab, setSearchTeamTab] = useState("");
    const [searchProjectTab, setSearchProjectTab] = useState("");
    const [filterProjectType, setFilterProjectType] = useState("Semua Tipe");
    const [searchKPITab, setSearchKPITab] = useState("");
    const [searchGanttTab, setSearchGanttTab] = useState("");
    const [searchInvTab, setSearchInvTab] = useState("");
    const [searchExpertTab, setSearchExpertTab] = useState("");
    const [expertPage, setExpertPage] = useState(1);
    const [searchAssignmentTab, setSearchAssignmentTab] = useState("");
    const [assignmentTabFilter, setAssignmentTabFilter] = useState("active");
    const [projectPage, setProjectPage] = useState(1);
    const [dominoAnalysis, setDominoAnalysis] = useState(null);

    const projectsPerPage = 5;

    // State untuk melihat detail pegawai
    const [viewingEmployee, setViewingEmployee] = useState(null);

    // =========================================================================
    // KECERDASAN SISTEM
    // =========================================================================
    const computedProjects = useMemo(() => {
        return projects.map(p => {
            let effectiveCatDetails = { ...p.categoryDetails };
            const individualStatus = p.individualStatus || {};
            let activeCategories = [];

            if (p.team && p.team.length > 0) {
                const catMembers = {};
                p.team.forEach(m => {
                    const res = resources.find(r => fuzzyMatchName(r.name, m));
                    const cat = res ? getCategoryFromRole(res.role) : 'Lainnya';
                    if (!catMembers[cat]) catMembers[cat] = [];
                    catMembers[cat].push(m);
                });

                if (p.surveyorTeam && p.surveyorTeam.length > 0) {
                    catMembers['Surveyor'] = p.surveyorTeam;
                }

                activeCategories = Object.keys(catMembers);
                activeCategories.forEach(cat => {
                    const members = catMembers[cat];
                    const total = members.length;
                    const completedCount = members.filter(m => individualStatus[m]).length;
                    const notCompletedCount = total - completedCount;

                    const manualProgress = effectiveCatDetails[cat] ? Number(effectiveCatDetails[cat].progress || 0) : 0;

                    if (total > 0 && completedCount > 0) {
                        const effectiveProg = Math.round(((completedCount * 100) + (notCompletedCount * manualProgress)) / total);
                        if (!effectiveCatDetails[cat]) effectiveCatDetails[cat] = {};
                        effectiveCatDetails[cat] = { ...effectiveCatDetails[cat], progress: effectiveProg };
                    }
                });
            }

            let effectiveTotalProgress = Number(p.progress || 0);
            if (activeCategories.length > 0) {
                let sum = 0;
                activeCategories.forEach(cat => {
                    sum += Number(effectiveCatDetails[cat]?.progress || 0);
                });
                effectiveTotalProgress = Math.round(sum / activeCategories.length);
            }

            const newP = {
                ...p,
                categoryDetails: effectiveCatDetails,
                progress: effectiveTotalProgress
            };
            newP.computedStatus = calculateComputedStatus(newP);
            return newP;
        });
    }, [projects, resources]);

    const calculatedResources = useMemo(() => {
        const mapped = resources.map(res => {
            let numProjects = 0;
            let numActiveProjects = 0;
            const empCat = getCategoryFromRole(res.role);

            computedProjects.forEach(p => {
                if (p.notStarted) return;
                if (p.computedStatus !== 'Done') {
                    const isPengawasan = p.type?.toLowerCase().includes('pengawas') || p.type?.toLowerCase().includes('manajemen konstruksi');

                    if (isPengawasan) {
                        const statusTurun = p.pengawasanDetails?.[res.name]?.statusTurun;
                        if (statusTurun === 'Tidak Turun') return;
                    }

                    if (fuzzyMatchName(p.teamLeader, res.name)) {
                        numProjects++;
                        if (p.computedStatus !== 'Pending') numActiveProjects++;
                    } else if ((p.team || []).some(m => fuzzyMatchName(m, res.name))) {
                        let isIndividuallyDone = p.individualStatus?.[res.name] === true;

                        if (isPengawasan) {
                            const pengawasanDeadline = p.pengawasanDetails?.[res.name]?.deadline;
                            if (pengawasanDeadline && pengawasanDeadline < new Date().toISOString().split('T')[0]) {
                                isIndividuallyDone = true;
                            }
                            if (!isIndividuallyDone) {
                                numProjects++;
                                if (p.computedStatus !== 'Pending') numActiveProjects++;
                            }
                        } else {
                            const effectiveCat = getEffectiveEmpCategory(p, res.name, res.role);
                            const microProgress = p.categoryDetails?.[effectiveCat]?.progress ? Number(p.categoryDetails[effectiveCat].progress) : 0;
                            if (microProgress < 100 && !isIndividuallyDone) {
                                numProjects++;
                                if (p.computedStatus !== 'Pending') numActiveProjects++;
                            }
                        }
                    }
                }
            });
            const workload = numActiveProjects * 25; // 25% per active project (pending not included)
            return { ...res, projects: numProjects, workload };
        });

        return mapped.sort((a, b) => b.workload - a.workload);
    }, [computedProjects, resources]);

    const atRiskProjectsCount = computedProjects.filter(p => p.computedStatus === 'Beresiko').length;
    const lateProjectsCount = computedProjects.filter(p => p.computedStatus === 'Terlambat').length;
    const completedProjectsCount = computedProjects.filter(p => p.computedStatus === 'Done').length;

    useEffect(() => {
        if (!firebaseDbRef || !computedProjects.length) return;
        let hasUpdates = false;
        const now = new Date().toISOString();
        const updatedProjects = projects.map(p => {
            const cp = computedProjects.find(c => c.id === p.id);
            if (!cp) return p;
            const isDone = cp.computedStatus === 'Done' || cp.status === 'Done';
            if (isDone && !p.completedAt) {
                hasUpdates = true;
                return { ...p, completedAt: now };
            } else if (!isDone && p.completedAt) {
                hasUpdates = true;
                const newP = { ...p };
                delete newP.completedAt;
                return newP;
            }
            return p;
        });
        if (hasUpdates) {
            projectService.updateProjectsOnly(updatedProjects);
        }
    }, [computedProjects]);


    // FETCH DATA FROM FIREBASE
    const firebaseDbRef = projectService.projectDataRef();

    const initFirebaseListener = () => {
        if (!firebaseDbRef) return;
        setLoading(true);
        setErrorMsg("");

        projectService.ensureSeeded(GOOGLE_SCRIPT_URL).then(() => {
            // Pasang Listener Khusus untuk Inventaris (dipisah dari pmc_data agar tidak tertimpa sync)
            inventoryService.subscribeInventory(setInventory);

            // Listener Khusus untuk SOP
            sopService.subscribeSopDocuments((docs) => {
                setSopDocuments(docs);
                setLoadingSOP(false);
            });

            // Listener Khusus untuk Manajemen Pengguna
            userService.subscribeUsers(setUsersList);

            // Listener Khusus untuk Tenaga Ahli (dipisah dari pmc_data)
            expertService.subscribeExperts(setExperts);

            // Listener Khusus untuk Penugasan Tenaga Ahli
            lpseService.subscribeAssignments(setAssignments);

            // Listener Khusus untuk Log Aktivitas & Auto Cleanup 30 Hari
            subscribeActivityLogs(setActivityLogs, userRole === 'Super Admin');

            // Listener Khusus untuk LPSE List
            lpseService.subscribeLpseList(setLpseList);

            // Listener Khusus untuk Cert List
            expertService.subscribeCertList(setCertList);

            // Listener Khusus untuk Role List
            userService.subscribeRoleList(setRoleList);

            // Pasang Listener Real-time
            projectService.subscribeProjectData(
                ({ projects, resources }) => {
                    setProjects(projects);
                    setResources(resources);
                    setIsLive(true);
                    setLoading(false);
                },
                (error) => {
                    console.error("Firebase Read Error:", error);
                    setErrorMsg("Koneksi Firebase terputus.");
                    setIsLive(false);
                    setLoading(false);
                }
            );
        }).catch((error) => {
            console.error("Firebase Initial Read Error:", error);
            let msg = "Koneksi Firebase gagal.";
            if (error.code === 'PERMISSION_DENIED') {
                msg = "Akses ditolak. Masa aktif test mode Firebase Anda sepertinya sudah habis. Harap perbarui rules database di konsol Firebase.";
            }
            setErrorMsg(msg);
            setIsLive(false);
            setLoading(false);
        });
    };


    const fetchFromGoogleSheets = () => {
        // Dipanggil oleh tombol refresh manual (Hanya memicu loading animasi sebentar)
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    useEffect(() => { initFirebaseListener(); }, []);

    // Mengganti Tab dan me-reset view
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab !== 'schedule') {
            setActiveScheduleProject(null);
        }
        setViewingEmployee(null);
        setSidebarOpen(false);

        // Reset semua filter pencarian saat pindah tab agar data tidak terlihat 'hilang'
        setSearchTeamTab("");
        setSearchProjectTab("");
        setSearchKPITab("");
        setSearchGanttTab("");
        setSearchInvTab("");
        setSearchExpertTab("");
        setSearchAssignmentTab("");
    }; const handleAnalyzeDomino = (project) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let globalDelayDays = 0;
        if (project.deadline) {
            const deadlineDate = new Date(project.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            globalDelayDays = Math.ceil((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const impactedEmployees = [];
        let maxDelay = globalDelayDays > 0 ? globalDelayDays : 0;

        if (project.team && Array.isArray(project.team)) {
            project.team.forEach(memberName => {
                const isIndividuallyDone = project.individualStatus?.[memberName] === true;
                if (!isIndividuallyDone) {
                    const res = resources.find(r => fuzzyMatchName(r.name, memberName));
                    let memberDeadlineStr = null;

                    if (res) {
                        const effectiveCat = getEffectiveEmpCategory(project, res.name, res.role);
                        if (project.categoryDetails?.[effectiveCat]?.deadline) {
                            memberDeadlineStr = project.categoryDetails[effectiveCat].deadline;
                        }
                    }
                    if (!memberDeadlineStr) memberDeadlineStr = project.deadline;

                    if (!memberDeadlineStr) return;

                    const memberDeadlineDate = new Date(memberDeadlineStr);
                    memberDeadlineDate.setHours(0, 0, 0, 0);

                    const delayDays = Math.ceil((today.getTime() - memberDeadlineDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Jika secara individu tidak terlambat, lewati
                    if (delayDays <= 0) return;

                    if (delayDays > maxDelay) maxDelay = delayDays;

                    const futureProjects = [];
                    computedProjects.forEach(fp => {
                        if (fp.id === project.id) return;
                        if (fp.computedStatus === 'Done') return;
                        if (fp.team && fp.team.includes(memberName)) {
                            const fpIndvDone = fp.individualStatus?.[memberName] === true;
                            if (!fpIndvDone) {
                                let fpDeadlineStr = null;
                                if (res) {
                                    const fpEffectiveCat = getEffectiveEmpCategory(fp, res.name, res.role);
                                    if (fp.categoryDetails?.[fpEffectiveCat]?.deadline) {
                                        fpDeadlineStr = fp.categoryDetails[fpEffectiveCat].deadline;
                                    }
                                }
                                if (!fpDeadlineStr) fpDeadlineStr = fp.deadline;

                                if (fpDeadlineStr) {
                                    const fDate = new Date(fpDeadlineStr);
                                    fDate.setHours(0, 0, 0, 0);
                                    if (!isNaN(fDate.getTime()) && fDate >= today) {
                                        const remaining = Math.ceil((fDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        // Jika sisa waktu proyek masa depan lebih kecil atau sama dengan hari keterlambatan individu ini
                                        if (remaining <= delayDays + 3) { // buffer 3 hari
                                            futureProjects.push({
                                                name: fp.name,
                                                deadlineStr: fpDeadlineStr,
                                                remainingDays: remaining,
                                                clashDays: delayDays - remaining
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });

                    if (futureProjects.length > 0) {
                        impactedEmployees.push({
                            name: memberName,
                            futureProjects,
                            delayDays: delayDays // Simpan keterlambatan spesifik individu
                        });
                    }
                }
            });
        }

        if (impactedEmployees.length === 0 && globalDelayDays <= 0) {
            window.dispatchEvent(new CustomEvent('show-alert', {
                detail: {
                    title: 'Proyek Aman',
                    message: 'Tidak ada indikasi keterlambatan pada proyek ini maupun pada individu yang terlibat.',
                    type: 'success'
                }
            }));
            return;
        }

        setDominoAnalysis({
            project,
            delayDays: maxDelay,
            impactedEmployees
        });
    };
    const handleTogglePendingSubmit = () => {
        if (!canEditProjectTechnical()) {
            window.dispatchEvent(new CustomEvent('show-alert', { detail: { title: 'Akses Ditolak', message: 'Anda tidak memiliki akses untuk mengubah status proyek.' } }));
            return;
        }
        if (!pendingProjectData) return;

        const now = new Date();
        const dateStr = formatDateTimeIndo(now.toISOString());

        const updatedProject = {
            ...pendingProjectData,
            isPending: true,
            pendingReason: pendingReasonText,
            pendingDate: dateStr
        };

        handleCrudAction('edit', 'project', updatedProject);
        setShowPendingModal(false);
        setPendingProjectData(null);
        setPendingReasonText("");
    };

    const handleResumeProject = (project) => {
        setResumeProjectData(project);
        setShowResumeModal(true);
    };

    const handleConfirmResumeProject = () => {
        if (!resumeProjectData) return;
        const updatedProject = {
            ...resumeProjectData,
            isPending: false,
            pendingReason: "",
            pendingDate: ""
        };
        handleCrudAction('edit', 'project', updatedProject);
        setShowResumeModal(false);
        setResumeProjectData(null);
    };

    // CRUD ACTION INVENTORY
    const handleInventoryAction = async (action, payload) => {
        setLoading(true);
        setErrorMsg("");
        try {
            let newData = [...inventory];

            if (action === 'add') {
                newData.push(payload);
            } else if (action === 'borrow-cart') {
                newData = newData.map(item => {
                    if (payload.selectedIds.includes(item.id)) {
                        return { ...item, status: 'Menunggu Verifikasi', ...payload.data };
                    }
                    return item;
                });
                setBorrowCart([]);
            } else if (action === 'edit' || action === 'borrow' || action === 'return' || action === 'extend') {
                newData = newData.map(item => item.id === payload.id ? payload : item);
            } else if (action === 'delete') {
                newData = newData.filter(item => item.id !== payload.id);
            }

            await inventoryService.saveInventory(newData);

            // --- Hook Audit Trail ---
            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let itemName = payload?.itemName || payload?.name || 'Item';
            let actionDetail = action === 'borrow-cart' ? 'Memproses keranjang peminjaman' : `${actionLabel} data inventaris: ${itemName}`;
            logActivity(actionLabel, 'Logistik & Inventaris', actionDetail, uData);
            // ------------------------

            setInventory(newData);
            setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });
        } catch (error) {
            console.error("Firebase Inventory Write Error:", error);
            setErrorMsg("Gagal menyimpan data inventaris.");
        }
        setLoading(false);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            setLoading(true);
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const expertsMap = new Map();

                data.forEach(row => {
                    const name = row['Nama Personil'] || row['Nama'] || row['Nama Lengkap'] || row['Name'];
                    if (!name) return;

                    const nameStr = name.toString().trim();
                    const nameKey = nameStr.toLowerCase().replace(/\s+/g, ' ');

                    if (!expertsMap.has(nameKey)) {
                        const existingExpert = experts.find(e => {
                            if (!e || !e.name) return false;
                            return e.name.trim().toLowerCase().replace(/\s+/g, ' ') === nameKey;
                        });

                        // Kategori is removed from template, default to existing or 'Internal'
                        const category = row['Kategori'] || row['Category'] || (existingExpert ? existingExpert.category : 'Internal');
                        const phone = row['Kontak'] || row['No HP'] || row['No. HP'] || row['Telepon'] || (existingExpert ? existingExpert.phone : '');
                        const status = row['Status'] || (existingExpert ? existingExpert.status : 'Tersedia');

                        // Merge Jenjang Pendidikan and Bidang Ilmu
                        const jenjangBidang = row['Jenjang dan Bidang Ilmu'] || row['Bidang Ilmu'] || row['Jurusan'];
                        let parsedBidangIlmu = existingExpert ? existingExpert.bidangIlmu : '';
                        let parsedJenjang = existingExpert ? existingExpert.jenjang : '';

                        if (jenjangBidang) {
                            parsedBidangIlmu = jenjangBidang.toString().trim();
                            // If old template was used with split columns, try to capture it. Otherwise leave jenjang empty.
                            parsedJenjang = row['Jenjang Pendidikan'] ? row['Jenjang Pendidikan'].toString().trim() : '';
                        } else {
                            parsedJenjang = row['Jenjang Pendidikan'] || (existingExpert ? existingExpert.jenjang : '');
                        }

                        const perusahaan = row['Perusahaan'] || row['Instansi'] || row['Asal Perusahaan'] || (existingExpert ? existingExpert.perusahaan : '');

                        expertsMap.set(nameKey, {
                            id: existingExpert ? existingExpert.id : 'exp-' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name: existingExpert ? existingExpert.name : nameStr,
                            category: category.toString(),
                            phone: phone.toString(),
                            status: status.toString(),
                            jenjang: parsedJenjang.toString(),
                            bidangIlmu: parsedBidangIlmu.toString(),
                            perusahaan: perusahaan.toString(),
                            certificates: existingExpert ? [...(existingExpert.certificates || [])] : [],
                            tenders: existingExpert ? [...(existingExpert.tenders || [])] : []
                        });
                    }

                    const currentExpert = expertsMap.get(nameKey);

                    // Parse Certificate Data
                    const certName = row['Sertifikat Keahlian'];
                    const certLevel = row['Jenjang'];
                    const rawDate = row['Masa Berlaku'];

                    let expiredDateStr = '';
                    if (rawDate) {
                        if (typeof rawDate === 'number') {
                            // Excel serial date to JS Date (UTC)
                            const utc_days = Math.floor(rawDate - 25569);
                            const date_info = new Date(utc_days * 86400 * 1000);
                            expiredDateStr = `${date_info.getUTCFullYear()}-${String(date_info.getUTCMonth() + 1).padStart(2, '0')}-${String(date_info.getUTCDate()).padStart(2, '0')}`;
                        } else {
                            const parsed = new Date(rawDate);
                            if (!isNaN(parsed.getTime())) {
                                expiredDateStr = parsed.toISOString().split('T')[0];
                            } else {
                                // fallback for DD/MM/YYYY
                                const parts = rawDate.toString().split(/[-/]/);
                                if (parts.length === 3) {
                                    expiredDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                }
                            }
                        }
                    }

                    if (certName) {
                        const certNameStr = certName.toString().trim();
                        const cKey = certNameStr.toLowerCase().replace(/\s+/g, ' ');
                        const newLevelStr = certLevel ? certLevel.toString().trim() : 'Ahli Muda';
                        const lKey = newLevelStr.toLowerCase().replace(/\s+/g, ' ');

                        const existingCertIndex = currentExpert.certificates.findIndex(c => {
                            const xcKey = c.certName ? c.certName.toLowerCase().replace(/\s+/g, ' ') : '';
                            const xlKey = c.certLevel ? c.certLevel.toLowerCase().replace(/\s+/g, ' ') : '';
                            return xcKey === cKey && xlKey === lKey;
                        });

                        if (existingCertIndex !== -1) {
                            // Update expired date if same name and same level
                            if (expiredDateStr) {
                                currentExpert.certificates[existingCertIndex].expiredDate = expiredDateStr;
                            }
                        } else {
                            // Add new certificate if name is new, or same name but different level
                            currentExpert.certificates.push({
                                certName: certNameStr,
                                certLevel: newLevelStr,
                                issuedDate: '',
                                expiredDate: expiredDateStr
                            });
                        }
                    }
                });

                const importedData = Array.from(expertsMap.values());

                if (importedData.length > 0) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Konfirmasi Sinkronisasi',
                        message: `Ditemukan ${importedData.length} data tenaga ahli (baru/update) dari Excel. Lanjutkan sinkronisasi ke database?`,
                        type: 'info',
                        onConfirm: async () => {
                            setLoading(true);
                            try {
                                const newExperts = [...experts];

                                importedData.forEach(importedExp => {
                                    const index = newExperts.findIndex(e => e.id === importedExp.id);
                                    if (index !== -1) {
                                        newExperts[index] = importedExp;
                                    } else {
                                        newExperts.push(importedExp);
                                    }
                                });

                                await expertService.saveExperts(newExperts);
                                setExperts(newExperts);
                                setAlertModal({ isOpen: true, title: 'Sukses', message: 'Sinkronisasi data tenaga ahli berhasil diselesaikan!' });
                            } catch (err) {
                                console.error(err);
                                setAlertModal({ isOpen: true, title: 'Error', message: 'Gagal sinkronisasi data.' });
                            } finally {
                                setLoading(false);
                            }
                        }
                    });
                } else {
                    setAlertModal({ isOpen: true, title: 'Informasi', message: 'Tidak ada data valid yang ditemukan. Pastikan Excel Anda memiliki kolom "Nama Personil".' });
                }
            } catch (err) {
                console.error('Import error:', err);
                setAlertModal({ isOpen: true, title: 'Error', message: 'Gagal membaca atau memproses file Excel.' });
            } finally {
                setLoading(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    // CRUD ACTION EXPERTS
    const handleExpertAction = (action, payload) => {
        // setLoading(true);
        setErrorMsg("");
        try {
            let newData = [...experts];

            if (action === 'add') {
                payload.id = 'exp-' + Date.now().toString();
                if (!payload.certificates) payload.certificates = [];
                if (!payload.tenders) payload.tenders = [];
                newData.push(payload);
            } else if (action === 'edit' || action === 'update_certificates' || action === 'update_tenders') {
                newData = newData.map(item => item.id === payload.id ? payload : item);
            } else if (action === 'delete') {
                newData = newData.filter(item => item.id !== payload.id);
            }

            if (expertSaveTimeout) clearTimeout(expertSaveTimeout);
            expertSaveTimeout = setTimeout(() => {
                expertService.saveExperts(newData).catch(e => console.error(e));
            }, 800);
            setExperts(newData);

            // --- Hook Audit Trail ---
            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let expName = payload?.name || 'Pakar';
            if (actionLabel.startsWith('UPDATE_')) actionLabel = 'EDIT';
            let actionDetail = `${actionLabel} data tenaga ahli: ${expName}`;
            logActivity(actionLabel, 'Tenaga Ahli', actionDetail, uData);
            // ------------------------
            if (action !== 'delete') setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });
        } catch (error) {
            console.error("Firebase Expert Write Error:", error);
            setErrorMsg("Gagal menyimpan data tenaga ahli.");
        }
        // setLoading(false);
    };


    // CRUD ACTION ASSIGNMENTS
    const handleAssignmentAction = (action, payload) => {
        setErrorMsg("");
        try {
            let newData = [...assignments];

            if (action === 'add') {
                payload.id = 'asg-' + Date.now().toString();
                newData.push(payload);
            } else if (action === 'edit') {
                newData = newData.map(item => item.id === payload.id ? payload : item);
            } else if (action === 'delete') {
                newData = newData.filter(item => item.id !== payload.id);
            }

            if (assignmentSaveTimeout) clearTimeout(assignmentSaveTimeout);
            assignmentSaveTimeout = setTimeout(() => {
                lpseService.saveAssignments(newData).catch(error => {
                    console.error("Firebase Assignment Write Error:", error);
                });
            }, 800);

            setAssignments(newData);

            // --- Hook Audit Trail ---
            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let asgName = payload?.jobName || 'Penugasan';
            let actionDetail = `${actionLabel} data penugasan: ${asgName}`;
            logActivity(actionLabel, 'Penugasan', actionDetail, uData);
            // ------------------------

            if (action !== 'delete') setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });

            // Sinkronisasi otomatis ke List Proyek (hanya untuk tipe Pengawasan)
            const projectType = (payload.projectType || 'Pengawasan').toLowerCase();
            if (projectType.includes('pengawas') || projectType.includes('manajemen konstruksi')) {
                projectService.syncAssignmentToProject(payload, action, experts, resources);
            }
        } catch (error) {
            console.error("Local Assignment Update Error:", error);
        }
    };

    // CRUD ACTION FIREBASE REALTIME
    const handleCrudAction = async (action, type, payload) => {
        setLoading(true);
        setErrorMsg("");
        try {
            const currentData = await projectService.applyCrudAction(action, type, payload);

            // --- Hook Audit Trail ---
            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let menuLabel = type === 'project' ? 'Data Proyek' : 'Data Tim/Resource';

            let targetName = payload.nama || payload.name;
            if (action === 'delete') {
                const targetObj = type === 'project'
                    ? (currentData.projects || []).find(p => p && p.id === payload.id)
                    : (currentData.resources || []).find(r => r && r.id === payload.id);
                if (targetObj) targetName = targetObj.nama || targetObj.name;
            }
            targetName = targetName || 'Unknown';

            let actionDetail = `${actionLabel} data ${type}: ${targetName}`;
            logActivity(actionLabel, menuLabel, actionDetail, uData);
            // ------------------------

            closeModal();
            // Tidak perlu memanggil fetch ulang, karena on('value') akan otomatis merender state seketika!
        } catch (error) {
            console.error("Error Action Firebase:", error);
            setErrorMsg(error.message || "Terjadi kesalahan saat menyimpan data ke Firebase.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleIndividualStatus = (projectId, employeeName, newStatus) => {
        setConfirmDialog({
            isOpen: true,
            type: newStatus ? 'info' : 'danger',
            title: newStatus ? 'Konfirmasi Selesai' : 'Batalkan Status Selesai',
            message: newStatus
                ? `Tandai tugas khusus untuk ${employeeName} sebagai Selesai di proyek ini?`
                : `Batalkan status Selesai untuk ${employeeName}?`,
            onConfirm: async () => {
                const project = projects.find(p => p.id === projectId);
                if (!project) return;

                const newIndividualStatus = { ...(project.individualStatus || {}) };
                if (newStatus) {
                    newIndividualStatus[employeeName] = true;
                } else {
                    delete newIndividualStatus[employeeName];
                }

                const teamDataObj = {
                    members: project.team || [],
                    details: project.categoryDetails || {},
                    leader: project.teamLeader || "",
                    individualStatus: newIndividualStatus
                };

                const updatedPayload = { ...project, team: JSON.stringify(teamDataObj) };

                delete updatedPayload.categoryDetails;
                delete updatedPayload.individualStatus;
                delete updatedPayload.teamLeader;
                delete updatedPayload.computedStatus;

                await handleCrudAction('edit', 'project', updatedPayload);
            }
        });
    };

    const handleToggleNotStarted = (projectId, newNotStartedStatus) => {
        setConfirmDialog({
            isOpen: true,
            type: newNotStartedStatus ? 'warning' : 'info',
            title: newNotStartedStatus ? 'Tandai Proyek Belum Mulai' : 'Mulai Proyek',
            message: newNotStartedStatus
                ? 'Tandai proyek ini sebagai "Belum Mulai"? Proyek ini tidak akan dihitung dalam beban kerja dan tidak muncul dalam Rincian Penugasan Pegawai.'
                : 'Tandai proyek ini sebagai "Sudah Mulai"? Proyek ini akan kembali dihitung dalam beban kerja dan muncul dalam KPI personil.',
            onConfirm: async () => {
                const project = projects.find(p => p.id === projectId);
                if (!project) return;

                const teamDataObj = {
                    members: project.team || [],
                    details: project.categoryDetails || {},
                    leader: project.teamLeader || "",
                    individualStatus: project.individualStatus || {},
                    pengawasanDetails: project.pengawasanDetails || {}
                };

                const updatedPayload = { ...project, team: JSON.stringify(teamDataObj), notStarted: newNotStartedStatus };

                delete updatedPayload.categoryDetails;
                delete updatedPayload.individualStatus;
                delete updatedPayload.teamLeader;
                delete updatedPayload.computedStatus;
                delete updatedPayload.pengawasanDetails;

                await handleCrudAction('edit', 'project', updatedPayload);
            }
        });
    };

    const openModal = (type, mode, data = null) => {
        if (userRole === 'Manajer') {
            window.dispatchEvent(new CustomEvent('show-alert', { detail: { title: 'Akses Ditolak', message: 'Role Manajer hanya dapat melihat data (View Only).' } }));
            return;
        }
        let parsedData = data;
        if (type === 'project' && data) {
            let normalizedStatus = data.status === "On Track" ? "On Progress" : data.status;

            if (data.deadline) {
                try {
                    const d = new Date(data.deadline);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        parsedData = { ...data, deadline: `${yyyy}-${mm}-${dd}`, status: normalizedStatus };
                    } else {
                        parsedData = { ...data, status: normalizedStatus };
                    }
                } catch (e) { parsedData = { ...data, status: normalizedStatus }; }
            } else {
                parsedData = { ...data, status: normalizedStatus };
            }
        }
        setModalConfig({ isOpen: true, type, mode, data: parsedData });
    };

    const closeModal = () => setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });

    const handleDelete = (type, id) => {
        if (userRole === 'Manajer') {
            window.dispatchEvent(new CustomEvent('show-alert', { detail: { title: 'Akses Ditolak', message: 'Role Manajer hanya dapat melihat data (View Only).' } }));
            return;
        }
        setConfirmDialog({
            isOpen: true,
            type: 'danger',
            title: 'Hapus Data Permanen',
            message: 'Apakah Anda yakin ingin menghapus data ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
            onConfirm: () => {
                handleCrudAction('delete', type, { id });
            }
        });
    };

    const handleFileUploadSOP = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Hanya file PDF yang diizinkan!');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setAlertModal({ isOpen: true, title: 'Batas Ukuran', message: 'Ukuran file terlalu besar! Untuk penyimpanan Database gratis, maksimal file adalah 2MB.' });
            return;
        }

        setUploadingSOP(true);
        const fileId = Date.now().toString();
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Data = reader.result;
                    
                    // Save metadata and base64 to Realtime Database
                    const newDoc = {
                        title: file.name.replace('.pdf', ''),
                        fileName: file.name,
                        url: base64Data, // Menyimpan file langsung sebagai teks Base64
                        uploadDate: new Date().toISOString(),
                        uploadedBy: username || currentUser?.email || 'Unknown',
                        size: file.size
                    };

                    await sopService.uploadSopDocument(newDoc);
                    logActivity('UPLOAD_DOC', 'Dokumen', `Mengunggah dokumen: ${file.name}`, { uid: currentUser?.uid, username, role: userRole });
                    
                    // Reset input
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setAlertModal({ isOpen: true, title: 'Berhasil', message: 'SOP berhasil disimpan ke dalam Database!' });
                } catch (err) {
                    console.error('Error saving SOP data:', err);
                    setAlertModal({ isOpen: true, title: 'Gagal', message: 'Gagal menyimpan data SOP: ' + err.message });
                } finally {
                    setUploadingSOP(false);
                }
            };
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                setAlertModal({ isOpen: true, title: 'Gagal', message: 'Gagal membaca file.' });
                setUploadingSOP(false);
            };


        } catch (error) {
            console.error('Initial error starting upload:', error);
            setAlertModal({ isOpen: true, title: 'Gagal', message: 'Terjadi kesalahan pada inisialisasi unggahan: ' + error.message });
            setUploadingSOP(false);
        }
    };

    const handleDeleteSOP = (doc) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus Dokumen',
            message: `Yakin ingin menghapus dokumen SOP "${doc.title}"?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await sopService.deleteSopDocument(doc.id);
                    logActivity('DELETE_DOC', 'Dokumen', `Menghapus dokumen: ${doc.title}`, { uid: currentUser?.uid, username, role: userRole });
                } catch (error) {
                    console.error('Error deleting SOP:', error);
                    setAlertModal({ isOpen: true, title: 'Gagal', message: 'Gagal menghapus SOP: ' + error.message });
                }
            }
        });
    };

    const handleDownloadPdf = (pdf) => {
        try {
            if (!pdf.url.startsWith('data:')) {
                window.open(pdf.url, '_blank');
                return;
            }
            
            // Konversi Base64 ke Blob untuk kompabilitas iOS Safari
            const dataURI = pdf.url;
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = pdf.fileName || `${pdf.title}.pdf`;
            document.body.appendChild(a);
            
            if (isIOS) {
                // Untuk iOS terkadang click() untuk download blob tidak merespon, 
                // window.location.assign memicu preview native Safari
                window.location.assign(blobUrl);
            } else {
                a.click();
            }
            
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            
        } catch (e) {
            console.error('Download error:', e);
            setAlertModal({ isOpen: true, title: 'Gagal', message: 'Gagal mengunduh dokumen.' });
        }
    };

    // Extracted ExpertModalForm to top level;

    // Extracted ExpertCertModalForm to top level;

    // Extracted ExpertTenderModalForm to top level;

    // --- IMPORT EXCEL MODAL ---
    // Extracted ImportExcelModal to top level;

    // --- ASSIGNMENT MODAL FORM ---
    // Extracted AssignmentModalForm to top level;

    // Extracted ModalForm to top level;

    // --- KOMPONEN TAB: TIME SCHEDULE (GANTT CHART) ---
    const appContextValue = {
        modalConfig,
        setModalConfig,
        projects,
        setProjects,
        inventory,
        setInventory,
        resources,
        setResources,
        experts,
        setExperts,
        assignments,
        setAssignments,
        lpseList,
        setLpseList,
        certList,
        setCertList,
        roleList,
        setRoleList,
        showRoleManager,
        setShowRoleManager,
        handleCrudAction,
        handleExpertAction,
        handleAssignmentAction,

        currentUser,
        userRole,
        canAccessMenu,
        alertModal,
        setAlertModal,
        adminAsetFormData,
        setAdminAsetFormData,
        closeModal,
        handleInventoryAction,
        handleImportExcel,
        loading,
        setLoading,
        setShowLpseManager,
        setShowCertManager,

        // SOP
        canManageSOP,
        fileInputRef,
        handleFileUploadSOP,
        uploadingSOP,
        loadingSOP,
        sopDocuments,
        handleDownloadPdf,
        selectedPdf,
        setSelectedPdf,
        handleDeleteSOP,

        // KPI
        computedProjects,
        searchKPITab,
        setSearchKPITab,
        setShowKPIInfoModal,
        showKPIInfoModal,

        // Tenaga Ahli
        searchExpertTab,
        setSearchExpertTab,
        expertPage,
        setExpertPage,
        canEditExperts,
        setConfirmDialog,
        showCertManager,
        handleUpdateCertList,

        // Inventaris & Admin Aset
        searchInvTab,
        setSearchInvTab,
        borrowCart,
        setBorrowCart,
        adminAsetFilter,
        setAdminAsetFilter,
        adminAsetSearch,
        setAdminAsetSearch,
        canManageAsset,
        adminAsetModal,
        setAdminAsetModal,
        adminAsetConfirm,
        setAdminAsetConfirm,

        // Tim
        errorMsg,
        openModal,
        handleDelete,
        viewingEmployee,
        setViewingEmployee,
        calculatedResources,
        searchTeamTab,
        setSearchTeamTab,
        canEditTeamAllocation,
        setPrintData,
        handleToggleIndividualStatus,

        // Penugasan
        assignmentTabFilter,
        setAssignmentTabFilter,
        searchAssignmentTab,
        setSearchAssignmentTab,
        canManageAssignments,
        showLpseManager,
        handleUpdateLpseList,

        // Logbook
        activityLogs,

        // Pengguna
        usersList,

        // Jadwal
        searchGanttTab,
        setSearchGanttTab,
        activeScheduleProject,
        setActiveScheduleProject,
        setActiveTab,
        scheduleZoom,
        setScheduleZoom,
        scheduleFilterUser,
        setScheduleFilterUser,
        scheduleCollapsedCats,
        setScheduleCollapsedCats,
        chartAnimate,

        // Proyek
        canCreateProject,
        handleAnalyzeDomino,
        handleResumeProject,
        handleToggleNotStarted,
        darkMode,
        printZoomProject,
        setPrintZoomProject,

        // Dashboard
        username,
        setShowProjectTypeModal,
        completedProjectsCount,
        atRiskProjectsCount,
        lateProjectsCount
    };
    return (
        <AppContext.Provider value={appContextValue}>
            <>
                {showCurtain && (
                    <div className="fixed inset-0 z-[9999] flex pointer-events-none overflow-hidden">
                        <div className={`w-1/2 h-full bg-slate-900 border-r border-[#158ed4]/30 flex items-center justify-end pr-8 transition-transform duration-1000 ease-[cubic-bezier(0.83,0,0.17,1)] ${animateCurtain ? '-translate-x-full' : 'translate-x-0'}`}>
                            <div className="text-white text-5xl font-black">SIDA</div>
                        </div>
                        <div className={`w-1/2 h-full bg-slate-900 border-l border-[#158ed4]/30 flex items-center justify-start pl-8 transition-transform duration-1000 ease-[cubic-bezier(0.83,0,0.17,1)] ${animateCurtain ? 'translate-x-full' : 'translate-x-0'}`}>
                            <div className="text-[#158ed4] text-5xl font-black">MON.</div>
                        </div>
                    </div>
                )}
                {!currentUser ? <Login /> : userRole === 'Guest' ? (
                    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                        <div className="text-center text-white bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 max-w-sm">
                            <div className="mb-4 text-emerald-500 flex justify-center">
                                <Icon name="clock" size={48} />
                            </div>
                            <h1 className="text-xl font-bold mb-2">Menunggu Persetujuan</h1>
                            <p className="text-sm text-slate-400 mb-6">Akun Anda sedang direview oleh Super Admin. Silakan hubungi Administrator untuk mendapatkan akses.</p>
                            <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors w-full">Keluar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <PrintExecutiveReport />
                        <div id="main-ui-wrapper" className="flex h-screen text-slate-800 dark:text-slate-200 bg-transparent transition-colors duration-200 relative overflow-hidden print:hidden">
                            {/* Subtle Glowing Orbs for Glassmorphism Depth */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
                                <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60"></div>
                            </div>

                            <div className="relative z-10 flex w-full h-full">
                                <PrintZoomProjectModal />
                                <PendingModal showPendingModal={showPendingModal} pendingProjectData={pendingProjectData} pendingReasonText={pendingReasonText} setShowPendingModal={setShowPendingModal} setPendingProjectData={setPendingProjectData} setPendingReasonText={setPendingReasonText} onSubmit={handleTogglePendingSubmit} />
                                <ConfirmModal confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
                                <DominoModal dominoAnalysis={dominoAnalysis} setDominoAnalysis={setDominoAnalysis} />

                                <KPIInfoModal />
                                {showProjectTypeModal && (
                                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                        <div className="glass-card p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <Icon name="briefcase" size={20} className="text-blue-500" /> Detail Tipe Proyek
                                                </h3>
                                                <button onClick={() => setShowProjectTypeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Icon name="x" size={20} /></button>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(
                                                    computedProjects.reduce((acc, p) => {
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
                                                    <span className="font-black text-slate-800 dark:text-slate-200">{computedProjects.length} Proyek</span>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end">
                                                <button onClick={() => setShowProjectTypeModal(false)} className="px-4 py-2 w-full rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">Tutup</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showPrintModal && (
                                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                        <div className="glass-card p-6 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Opsi Ekspor Laporan</h3>
                                                <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Icon name="x" size={20} /></button>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipe Proyek</label>
                                                    <select value={printOptions.projectType} onChange={(e) => setPrintOptions({ ...printOptions, projectType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                                        <option value="Semua">Semua Tipe Proyek</option>
                                                        <option value="Perencanaan">Hanya Perencanaan</option>
                                                        <option value="Pengawasan">Hanya Pengawasan</option>
                                                        <option value="Manajemen Konstruksi">Hanya Manajemen Konstruksi</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cakupan Laporan</label>
                                                    <select value={printOptions.section} onChange={(e) => setPrintOptions({ ...printOptions, section: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                                        <option value="Semua">Lengkap (Status Proyek & Penugasan Pegawai)</option>
                                                        <option value="ProyekSaja">Hanya Laporan Status Proyek Saja</option>
                                                        <option value="PegawaiSaja">Hanya Rincian Penugasan Pegawai Saja</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end gap-3">
                                                <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Batal</button>
                                                <button onClick={() => {
                                                    setShowPrintModal(false);
                                                    exportProjectExcel(computedProjects, calculatedResources, printOptions);
                                                }} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md">
                                                    <Icon name="file-text" size={16} /> Ekspor Excel
                                                </button>
                                                <button onClick={() => {
                                                    setShowPrintModal(false);
                                                    setPrintData({ type: 'custom', options: printOptions });
                                                }} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md">
                                                    <Icon name="printer" size={16} /> Cetak PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <aside className="hidden lg:flex lg:relative z-auto w-[270px] my-5 ml-5 rounded-[2rem] glass-panel text-slate-700 dark:text-slate-200 flex-col shrink-0 transition-all duration-300 shadow-xl overflow-hidden">
                                    <div className="p-7 pb-5 border-b border-slate-200/50 dark:border-slate-700/30">
                                        <div className="flex items-center gap-3 w-full mb-3">
                                            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                                <img src={darkMode ? logoSidamon : logoImg} alt="Logo SIDAMON" className="w-full h-full object-contain drop-shadow-sm" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h1 className="text-lg font-black tracking-widest leading-none text-slate-900 dark:text-white">SIDAMON</h1>
                                                <span className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 mt-1 truncate">Gaharu Sempana Group</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap">Sistem Database & Monitoring</p>
                                    </div>
                                    <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto pb-4">
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 first:mt-0 px-2">Overview</div>
                                        <SidebarItem icon={<Icon name="layout-dashboard" size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />

                                        {canAccessMenu('Proyek') && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Project Management & Control</div>
                                                <SidebarItem icon={<Icon name="briefcase" size={20} />} label="List Proyek" isActive={activeTab === 'proyek'} onClick={() => handleTabChange('proyek')} />
                                                {canAccessMenu('Time Schedule') && <SidebarItem icon={<Icon name="calendar" size={20} />} label="Master Schedule" isActive={activeTab === 'master-schedule'} onClick={() => handleTabChange('master-schedule')} />}
                                                {canAccessMenu('Alokasi Tim') && <SidebarItem icon={<Icon name="users" size={20} />} label="Alokasi Tim" isActive={activeTab === 'tim'} onClick={() => handleTabChange('tim')} />}
                                                {canAccessMenu('Plotting Jadwal') && <SidebarItem icon={<Icon name="calendar-days" size={20} />} label="Plotting Jadwal" isActive={activeTab === 'gantt'} onClick={() => handleTabChange('gantt')} />}
                                            </>
                                        )}

                                        {canAccessMenu('Tenaga Ahli') && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Database & Assignment Experts</div>
                                                <SidebarItem icon={<Icon name="award" size={20} />} label="Tenaga Ahli" isActive={activeTab === 'ahli'} onClick={() => handleTabChange('ahli')} />
                                                <SidebarItem icon={<Icon name="briefcase" size={20} />} label="Penugasan Tenaga Ahli" isActive={activeTab === 'penugasan'} onClick={() => handleTabChange('penugasan')} />
                                            </>
                                        )}

                                        {(canAccessMenu('Inventaris') || canAccessMenu('Admin Aset')) && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Assets</div>
                                                {canAccessMenu('Inventaris') && (
                                                    <SidebarItem icon={<Icon name="box" size={20} />} label="Logistik & Inventaris" isActive={activeTab === 'inventaris'} onClick={() => handleTabChange('inventaris')} />
                                                )}
                                                {canAccessMenu('Admin Aset') && (
                                                    <SidebarItem icon={<Icon name="package" size={20} />} label="Admin Aset" isActive={activeTab === 'admin-aset'} onClick={() => handleTabChange('admin-aset')} />
                                                )}
                                            </>
                                        )}
                                        {canAccessMenu('KPI') && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Performance</div>
                                                <SidebarItem icon={<Icon name="bar-chart" size={20} />} label="KPI & Evaluasi" isActive={activeTab === 'kpi'} onClick={() => handleTabChange('kpi')} />
                                            </>
                                        )}
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Documents</div>
                                        <SidebarItem icon={<Icon name="file-text" size={20} />} label="Dokumen" isActive={activeTab === 'sop'} onClick={() => handleTabChange('sop')} />

                                        {canAccessMenu('Manajemen Pengguna') && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Settings</div>
                                                <SidebarItem icon={<Icon name="settings" size={20} />} label="Manajemen Pengguna" isActive={activeTab === 'pengguna'} onClick={() => handleTabChange('pengguna')} />
                                            </>
                                        )}
                                        {userRole === 'Super Admin' && (
                                            <>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Audit</div>
                                                <SidebarItem icon={<Icon name="activity" size={20} />} label="Log Aktivitas" isActive={activeTab === 'logbook'} onClick={() => handleTabChange('logbook')} />
                                            </>
                                        )}
                                    </nav>

                                    <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/30">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 group shadow-sm"
                                        >
                                            <Icon name="log-out" size={18} className="transition-transform group-hover:-translate-x-1" />
                                            <span className="font-bold">Keluar Sistem</span>
                                        </button>
                                    </div>
                                </aside>

                                <main className="flex-1 min-w-0 p-4 lg:p-5 h-screen overflow-y-auto">
                                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-xl mb-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-400/10 transition-colors duration-700"></div>
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-400/10 transition-colors duration-700"></div>

                                        <div className="relative z-10 flex items-center gap-4">
                                            <button
                                                className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                                onClick={() => setMobileMenuOpen(true)}
                                            >
                                                <Icon name="menu" size={24} />
                                            </button>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                                    {activeTab === 'dashboard' && 'Ringkasan Proyek & Personil'}
                                                    {activeTab === 'proyek' && 'Manajemen Proyek'}
                                                    {activeTab === 'schedule' && 'Time Schedule Proyek'}
                                                    {activeTab === 'master-schedule' && 'Master Schedule (Portofolio)'}
                                                    {activeTab === 'tim' && 'Alokasi Sub-Tim'}
                                                    {activeTab === 'gantt' && 'Plotting Jadwal (Gantt)'}
                                                    {activeTab === 'ahli' && 'Database Tenaga Ahli'}
                                                    {activeTab === 'penugasan' && 'Penugasan Tenaga Ahli'}
                                                    {activeTab === 'inventaris' && 'Logistik & Inventaris Alat'}
                                                    {activeTab === 'admin-aset' && 'Manajemen Aset Gudang'}
                                                    {activeTab === 'kpi' && 'KPI & Evaluasi Kinerja'}
                                                    {activeTab === 'pengguna' && 'Manajemen Pengguna'}
                                                    {activeTab === 'sop' && 'Dokumen Perusahaan'}
                                                </h2>
                                                <p className="text-sm text-slate-500 font-medium mt-1 tracking-wide">
                                                    Aplikasi Manajemen Proyek & Personil Tim Teknis
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
                                            <button
                                                onClick={() => setDarkMode(!darkMode)}
                                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm relative group flex-shrink-0"
                                                title={darkMode ? "Mode Terang" : "Mode Gelap"}
                                            >
                                                <Icon name={darkMode ? "sun" : "moon"} size={20} className={darkMode ? "text-amber-400" : "text-slate-600"} />
                                            </button>
                                            {!isOnline && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/50 dark:border-amber-700/50 text-sm font-bold shadow-sm whitespace-nowrap">
                                                    <Icon name="wifi-off" size={16} />
                                                    <span className="hidden sm:inline">Offline</span>
                                                </div>
                                            )}
                                            {activeTab === 'proyek' && (
                                                <button onClick={() => setShowPrintModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm shadow-sm hover:shadow-md">
                                                    <Icon name="printer" size={18} />
                                                    <span>Ekspor Laporan</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { if (initFirebaseListener) initFirebaseListener(); }}
                                                className={`p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-all shadow-sm group flex-shrink-0 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={loading}
                                                title="Sinkronisasi Manual"
                                            >
                                                <Icon name="refresh-ccw" size={20} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                                            </button>
                                        </div>
                                    </header>

                                    <div className="relative z-10 w-full animate-fade-in pb-24 lg:pb-0 overflow-x-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="w-full"
                                            >
                                                <AppRoutes activeTab={activeTab} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </main>

                                {mobileMenuOpen && (
                                    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-[80] lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
                                        <div className="absolute bottom-28 left-0 right-0 mx-auto w-[90%] max-w-[380px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-4 animate-slide-up max-h-[70vh] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }} onClick={e => e.stopPropagation()}>
                                            <div className="grid grid-cols-3 gap-2">
                                                <MobileMenuItem icon={<Icon name="layout-dashboard" size={20} />} label="Beranda" isActive={activeTab === 'dashboard'} onClick={() => { handleTabChange('dashboard'); setMobileMenuOpen(false); }} />
                                                {canAccessMenu('Proyek') && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 px-2">PM & Control</div>
                                                        <MobileMenuItem icon={<Icon name="briefcase" size={20} />} label="Proyek" isActive={activeTab === 'proyek'} onClick={() => { handleTabChange('proyek'); setMobileMenuOpen(false); }} />
                                                        <MobileMenuItem icon={<Icon name="users" size={20} />} label="Tim" isActive={activeTab === 'tim'} onClick={() => { handleTabChange('tim'); setMobileMenuOpen(false); }} />
                                                        <MobileMenuItem icon={<Icon name="calendar-days" size={20} />} label="Jadwal" isActive={activeTab === 'gantt'} onClick={() => { handleTabChange('gantt'); setMobileMenuOpen(false); }} />
                                                    </>
                                                )}
                                                {canAccessMenu('Tenaga Ahli') && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-2 px-2">Experts</div>
                                                        <MobileMenuItem icon={<Icon name="award" size={20} />} label="Ahli" isActive={activeTab === 'ahli'} onClick={() => { handleTabChange('ahli'); setMobileMenuOpen(false); }} />
                                                        <MobileMenuItem icon={<Icon name="briefcase" size={20} />} label="Tugas" isActive={activeTab === 'penugasan'} onClick={() => { handleTabChange('penugasan'); setMobileMenuOpen(false); }} />
                                                    </>
                                                )}
                                                {(canAccessMenu('Inventaris') || canAccessMenu('Admin Aset')) && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Assets</div>
                                                        {canAccessMenu('Inventaris') && (
                                                            <MobileMenuItem icon={<Icon name="box" size={20} />} label="Logistik & Inventaris" isActive={activeTab === 'inventaris'} onClick={() => { handleTabChange('inventaris'); setMobileMenuOpen(false); }} />
                                                        )}
                                                        {canAccessMenu('Admin Aset') && (
                                                            <MobileMenuItem icon={<Icon name="package" size={20} />} label="Admin Aset" isActive={activeTab === 'admin-aset'} onClick={() => { handleTabChange('admin-aset'); setMobileMenuOpen(false); }} />
                                                        )}
                                                    </>
                                                )}
                                                {canAccessMenu('KPI') && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Performance</div>
                                                        <MobileMenuItem icon={<Icon name="bar-chart" size={20} />} label="KPI & Evaluasi" isActive={activeTab === 'kpi'} onClick={() => { handleTabChange('kpi'); setMobileMenuOpen(false); }} />
                                                    </>
                                                )}
                                                <>
                                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Documents</div>
                                                    <MobileMenuItem icon={<Icon name="file-text" size={20} />} label="Dokumen" isActive={activeTab === 'sop'} onClick={() => { handleTabChange('sop'); setMobileMenuOpen(false); }} />
                                                </>
                                                {canAccessMenu('Manajemen Pengguna') && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Settings</div>
                                                        <MobileMenuItem icon={<Icon name="settings" size={20} />} label="Pengguna" isActive={activeTab === 'pengguna'} onClick={() => { handleTabChange('pengguna'); setMobileMenuOpen(false); }} />
                                                    </>
                                                )}
                                                {userRole === 'Super Admin' && (
                                                    <>
                                                        <div className="col-span-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-4 px-2">Audit</div>
                                                        <MobileMenuItem icon={<Icon name="activity" size={20} />} label="Log Aktivitas" isActive={activeTab === 'logbook'} onClick={() => { handleTabChange('logbook'); setMobileMenuOpen(false); }} />
                                                    </>
                                                )}
                                                <div className="col-span-3 h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="col-span-3 w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-left group text-red-600 dark:text-red-400"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                                                        <Icon name="log-out" size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-red-600 dark:text-red-400">Keluar Sistem</div>
                                                        <div className="text-xs text-red-400 dark:text-red-500">Akhiri sesi ini</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 h-[70px] w-[90%] max-w-[380px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 rounded-[35px] z-[90] flex justify-between items-center px-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-indigo-900/20 transition-all duration-500">
                                    <BottomNavItem icon={<Icon name="layout-dashboard" size={20} />} label="Beranda" isActive={activeTab === 'dashboard' && !mobileMenuOpen} onClick={() => { handleTabChange('dashboard'); setMobileMenuOpen(false); }} />
                                    {canAccessMenu('Proyek') && (
                                        <>
                                            <BottomNavItem icon={<Icon name="briefcase" size={20} />} label="Proyek" isActive={activeTab === 'proyek' && !mobileMenuOpen} onClick={() => { handleTabChange('proyek'); setMobileMenuOpen(false); }} />
                                            <BottomNavItem icon={<Icon name="users" size={20} />} label="Tim" isActive={activeTab === 'tim' && !mobileMenuOpen} onClick={() => { handleTabChange('tim'); setMobileMenuOpen(false); }} />
                                        </>
                                    )}
                                    <BottomNavItem icon={<Icon name="menu" size={20} />} label="Menu" isActive={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                                </nav>
                            </div>
                        </div>

                        {/* --- SEMUA MODAL SISTEM --- */}
                        <AnimatePresence>
                            {modalConfig.isOpen && !['expert', 'expert_cert', 'expert_tender', 'assignment', 'import_expert'].includes(modalConfig.type) && <ModalForm key="modal-project" />}
                            {modalConfig.isOpen && modalConfig.type === 'expert' && <ExpertModalForm key="modal-expert" />}
                            {modalConfig.isOpen && modalConfig.type === 'expert_cert' && <ExpertCertModalForm key="modal-expert-cert" />}
                            {modalConfig.isOpen && modalConfig.type === 'expert_tender' && <ExpertTenderModalForm key="modal-expert-tender" />}
                            {modalConfig.isOpen && modalConfig.type === 'import_expert' && <ImportExcelModal key="modal-import" />}
                            {modalConfig.isOpen && modalConfig.type === 'assignment' && <AssignmentModalForm key="modal-assignment" />}
                        </AnimatePresence>
                        <ResumeModal showResumeModal={showResumeModal} resumeProjectData={resumeProjectData} setShowResumeModal={setShowResumeModal} setResumeProjectData={setResumeProjectData} onConfirm={handleConfirmResumeProject} />
                        <DominoModal dominoAnalysis={dominoAnalysis} setDominoAnalysis={setDominoAnalysis} />
                        <KPIInfoModal />
                        <ConfirmModal confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />

                    </>
                )}
                <CertManagerModal />
                <LpseManagerModal />
                <RoleManagerModal />
                <AlertModal alertModal={alertModal} setAlertModal={setAlertModal} />
            </>
        </AppContext.Provider>
    );
}

export default AppShell;
