import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppContext } from './AppContext';
import { useAuth } from '../auth/useAuth';
import * as projectService from '../services/projectService';
import * as expertService from '../services/expertService';
import * as inventoryService from '../services/inventoryService';
import * as lpseService from '../services/lpseService';
import * as userService from '../services/userService';
import * as sopService from '../services/sopService';
import { subscribeActivityLogs, logActivity } from '../services/logService';
import { fuzzyMatchName } from '../shared/utils/nameMatch';
import { formatDateTimeIndo } from '../shared/utils/dateHelpers';
import {
    calculateComputedStatus,
    getCategoryFromRole,
    getEffectiveEmpCategory
} from '../shared/utils/projectCalculations';
import * as XLSX from 'xlsx-js-style';

let expertSaveTimeout = null;
let assignmentSaveTimeout = null;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEt5puRB26FO6mGfnxVvofBJaDwLtH3O0yd-Ugsugn2D2KezKpi_ynGz7hw24kpLIpRQ/exec';

export default function AppProvider({ children }) {
    const {
        currentUser,
        userRole,
        username,
        canAccessMenu,
        canCreateProject,
        canDeleteProject,
        canEditProjectAdmin,
        canEditProjectTechnical,
        canEditTeamAllocation,
        canEditExperts,
        canManageAssignments,
        canManageAsset
    } = useAuth();

    // Tab & Navigation state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [activityLogs, setActivityLogs] = useState([]);

    // SOP states
    const [sopDocuments, setSopDocuments] = useState([]);
    const [loadingSOP, setLoadingSOP] = useState(true);
    const [uploadingSOP, setUploadingSOP] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const fileInputRef = useRef(null);
    const canManageSOP = userRole?.toLowerCase() === 'super admin' || userRole?.toLowerCase() === 'manajer';

    // Users & Schedule states
    const [usersList, setUsersList] = useState([]);
    const [activeScheduleProject, setActiveScheduleProject] = useState(null);
    const [scheduleZoom, setScheduleZoom] = useState('month');
    const [scheduleFilterUser, setScheduleFilterUser] = useState('Semua');
    const [scheduleCollapsedCats, setScheduleCollapsedCats] = useState({});
    const [chartAnimate, setChartAnimate] = useState(false);

    useEffect(() => {
        if (activeScheduleProject) {
            setChartAnimate(false);
            const timer = setTimeout(() => setChartAnimate(true), 100);
            return () => clearTimeout(timer);
        }
    }, [activeScheduleProject]);

    // Data entities
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
    const [adminAsetFormData, setAdminAsetFormData] = useState({});

    // Print & Report States
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

    // Dark Mode
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        if (savedMode) return savedMode === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
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

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Dialog & Alert Modals
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Perhatian', message: '' });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, mode: 'add', data: null });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    // LPSE, Cert, Role lists
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

    // Search filters
    const [searchTeamTab, setSearchTeamTab] = useState("");
    const [searchProjectTab, setSearchProjectTab] = useState("");
    const [filterProjectType, setFilterProjectType] = useState("Semua Tipe");
    const [projectPage, setProjectPage] = useState(1);
    const [searchKPITab, setSearchKPITab] = useState("");
    const [searchGanttTab, setSearchGanttTab] = useState("");
    const [searchInvTab, setSearchInvTab] = useState("");
    const [searchExpertTab, setSearchExpertTab] = useState("");
    const [expertPage, setExpertPage] = useState(1);
    const [searchAssignmentTab, setSearchAssignmentTab] = useState("");
    const [assignmentTabFilter, setAssignmentTabFilter] = useState("active");
    const [dominoAnalysis, setDominoAnalysis] = useState(null);
    const [viewingEmployee, setViewingEmployee] = useState(null);

    // Access fallback
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

    // Computed Projects
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

    // Calculated Resources
    const calculatedResources = useMemo(() => {
        const mapped = resources.map(res => {
            let numProjects = 0;
            let numActiveProjects = 0;

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
            const workload = numActiveProjects * 25;
            return { ...res, projects: numProjects, workload };
        });

        return mapped.sort((a, b) => b.workload - a.workload);
    }, [computedProjects, resources]);

    const atRiskProjectsCount = computedProjects.filter(p => p.computedStatus === 'Beresiko').length;
    const lateProjectsCount = computedProjects.filter(p => p.computedStatus === 'Terlambat').length;
    const completedProjectsCount = computedProjects.filter(p => p.computedStatus === 'Done').length;

    // Auto-update completedAt
    const firebaseDbRef = projectService.projectDataRef();
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

    // Firebase Listeners
    const initFirebaseListener = () => {
        if (!firebaseDbRef) return;
        setLoading(true);
        setErrorMsg("");

        projectService.ensureSeeded(GOOGLE_SCRIPT_URL).then(() => {
            inventoryService.subscribeInventory(setInventory);

            sopService.subscribeSopDocuments((docs) => {
                setSopDocuments(docs);
                setLoadingSOP(false);
            });

            userService.subscribeUsers(setUsersList);
            expertService.subscribeExperts(setExperts);
            lpseService.subscribeAssignments(setAssignments);
            subscribeActivityLogs(setActivityLogs, userRole === 'Super Admin');
            lpseService.subscribeLpseList(setLpseList);
            expertService.subscribeCertList(setCertList);
            userService.subscribeRoleList(setRoleList);

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

    useEffect(() => {
        initFirebaseListener();
    }, []);

    // Tab Change handler
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab !== 'schedule') {
            setActiveScheduleProject(null);
        }
        setViewingEmployee(null);

        setSearchTeamTab("");
        setSearchProjectTab("");
        setSearchKPITab("");
        setSearchGanttTab("");
        setSearchInvTab("");
        setSearchExpertTab("");
        setSearchAssignmentTab("");
    };

    // Domino Analysis
    const handleAnalyzeDomino = (project) => {
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
                                        if (remaining <= delayDays + 3) {
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
                            delayDays: delayDays
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

    // Pending submit
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

    // Inventory actions
    const handleInventoryAction = async (action, payload) => {
        setLoading(true);
        setErrorMsg("");
        try {
            let newData = [...inventory];

            if (action === 'add') {
                newData.push(payload);
            } else if (action === 'borrow-cart') {
                const targetIds = Array.isArray(payload?.selectedIds) && payload.selectedIds.length > 0
                    ? payload.selectedIds
                    : (borrowCart || []);
                newData = newData.map(item => {
                    if (targetIds.includes(item.id)) {
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

            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let itemName = payload?.itemName || payload?.name || 'Item';
            let actionDetail = action === 'borrow-cart' ? 'Memproses keranjang peminjaman' : `${actionLabel} data inventaris: ${itemName}`;
            logActivity(actionLabel, 'Logistik & Inventaris', actionDetail, uData);

            setInventory(newData);
            setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });
        } catch (error) {
            console.error("Firebase Inventory Write Error:", error);
            setErrorMsg("Gagal menyimpan data inventaris.");
        }
        setLoading(false);
    };

    // Import Excel for experts
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

                        const category = row['Kategori'] || row['Category'] || (existingExpert ? existingExpert.category : 'Internal');
                        const phone = row['Kontak'] || row['No HP'] || row['No. HP'] || row['Telepon'] || (existingExpert ? existingExpert.phone : '');
                        const status = row['Status'] || (existingExpert ? existingExpert.status : 'Tersedia');

                        const jenjangBidang = row['Jenjang dan Bidang Ilmu'] || row['Bidang Ilmu'] || row['Jurusan'];
                        let parsedBidangIlmu = existingExpert ? existingExpert.bidangIlmu : '';
                        let parsedJenjang = existingExpert ? existingExpert.jenjang : '';

                        if (jenjangBidang) {
                            parsedBidangIlmu = jenjangBidang.toString().trim();
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
                    const certName = row['Sertifikat Keahlian'];
                    const certLevel = row['Jenjang'];
                    const rawDate = row['Masa Berlaku'];

                    let expiredDateStr = '';
                    if (rawDate) {
                        if (typeof rawDate === 'number') {
                            const utc_days = Math.floor(rawDate - 25569);
                            const date_info = new Date(utc_days * 86400 * 1000);
                            expiredDateStr = `${date_info.getUTCFullYear()}-${String(date_info.getUTCMonth() + 1).padStart(2, '0')}-${String(date_info.getUTCDate()).padStart(2, '0')}`;
                        } else {
                            const parsed = new Date(rawDate);
                            if (!isNaN(parsed.getTime())) {
                                expiredDateStr = parsed.toISOString().split('T')[0];
                            } else {
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
                            if (expiredDateStr) {
                                currentExpert.certificates[existingCertIndex].expiredDate = expiredDateStr;
                            }
                        } else {
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

    // Expert actions
    const handleExpertAction = (action, payload) => {
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

            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let expName = payload?.name || 'Pakar';
            if (actionLabel.startsWith('UPDATE_')) actionLabel = 'EDIT';
            let actionDetail = `${actionLabel} data tenaga ahli: ${expName}`;
            logActivity(actionLabel, 'Tenaga Ahli', actionDetail, uData);

            if (action !== 'delete') setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });
        } catch (error) {
            console.error("Firebase Expert Write Error:", error);
            setErrorMsg("Gagal menyimpan data tenaga ahli.");
        }
    };

    // Assignment actions
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

            const uData = { uid: currentUser?.uid, username, role: userRole, email: currentUser?.email };
            let actionLabel = action.toUpperCase();
            let asgName = payload?.jobName || 'Penugasan';
            let actionDetail = `${actionLabel} data penugasan: ${asgName}`;
            logActivity(actionLabel, 'Penugasan', actionDetail, uData);

            if (action !== 'delete') setModalConfig({ isOpen: false, type: null, mode: 'add', data: null });

            const projectType = (payload.projectType || 'Pengawasan').toLowerCase();
            if (projectType.includes('pengawas') || projectType.includes('manajemen konstruksi')) {
                projectService.syncAssignmentToProject(payload, action, experts, resources);
            }
        } catch (error) {
            console.error("Local Assignment Update Error:", error);
        }
    };

    // Project & Resource CRUD
    const handleCrudAction = async (action, type, payload) => {
        setLoading(true);
        setErrorMsg("");
        try {
            const currentData = await projectService.applyCrudAction(action, type, payload);

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

            closeModal();
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

    // SOP Handlers
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
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Data = reader.result;
                    const newDoc = {
                        title: file.name.replace('.pdf', ''),
                        fileName: file.name,
                        url: base64Data,
                        uploadDate: new Date().toISOString(),
                        uploadedBy: username || currentUser?.email || 'Unknown',
                        size: file.size
                    };

                    await sopService.uploadSopDocument(newDoc);
                    logActivity('UPLOAD_DOC', 'Dokumen', `Mengunggah dokumen: ${file.name}`, { uid: currentUser?.uid, username, role: userRole });

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
        confirmDialog,
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
        printData,
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
        activeTab,
        setActiveTab,
        handleTabChange,
        scheduleZoom,
        setScheduleZoom,
        scheduleFilterUser,
        setScheduleFilterUser,
        scheduleCollapsedCats,
        setScheduleCollapsedCats,
        chartAnimate,

        // Proyek
        canCreateProject,
        canDeleteProject,
        canEditProjectAdmin,
        canEditProjectTechnical,
        searchProjectTab,
        setSearchProjectTab,
        filterProjectType,
        setFilterProjectType,
        projectPage,
        setProjectPage,
        handleAnalyzeDomino,
        handleResumeProject,
        handleToggleNotStarted,
        darkMode,
        setDarkMode,
        isOnline,
        printZoomProject,
        setPrintZoomProject,
        showPrintModal,
        setShowPrintModal,
        printOptions,
        setPrintOptions,

        // Pending & Resume modal states for ModalContainer
        showPendingModal,
        setShowPendingModal,
        pendingProjectData,
        setPendingProjectData,
        pendingReasonText,
        setPendingReasonText,
        handleTogglePendingSubmit,
        showResumeModal,
        setShowResumeModal,
        resumeProjectData,
        setResumeProjectData,
        handleConfirmResumeProject,
        dominoAnalysis,
        setDominoAnalysis,

        // Dashboard
        username,
        showProjectTypeModal,
        setShowProjectTypeModal,
        completedProjectsCount,
        atRiskProjectsCount,
        lateProjectsCount,

        initFirebaseListener
    };

    return (
        <AppContext.Provider value={appContextValue}>
            {children}
        </AppContext.Provider>
    );
}
