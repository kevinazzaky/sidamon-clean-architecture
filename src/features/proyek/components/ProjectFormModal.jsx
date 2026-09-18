import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';
import TeamCheckboxGroup from '../../../shared/components/TeamCheckboxGroup';
import TeamVisionaryMultiSelect from '../../../shared/components/TeamVisionaryMultiSelect';
import { fuzzyMatchName, getLinkedResourceName } from '../../../shared/utils/nameMatch';
import { formatDateIndo } from '../../../shared/utils/dateHelpers';
import { getCategoryFromRole, calculateLeaderKPI, calculateEmployeeKPI } from '../../../shared/utils/projectCalculations';

export default function ProjectFormModal() {
    const {
        modalConfig,
        closeModal,
        resources,
        computedProjects,
        handleCrudAction,
        loading,
        roleList,
        setShowRoleManager,
        assignments,
        experts
    } = useContext(AppContext);

    const [formData, setFormData] = useState(() => {
        if (modalConfig.data) {
            const data = {
                ...modalConfig.data,
            };
            if (
                data.type === "Perencanaan" &&
                data.surveyorTeam &&
                data.surveyorTeam.length > 0
            ) {
                data.team = (data.team || []).filter(
                    (m) => !data.surveyorTeam.includes(m)
                );
            }
            return data;
        }
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
    });

    const [searchTeam, setSearchTeam] = useState("");

    const handleAutoPlotting = () => {
        let recommendedTeam = [];
        let recommendedLeader = "";
        const checkPengawasan =
            formData.type === "Pengawasan" ||
            formData.type === "Manajemen Konstruksi";
        const findBestPerson = (roleKeyword, excludeList = [], requiredLevel = null) => {
            let candidates = (resources || []).filter(
                (r) =>
                    (r.role || '').toLowerCase().includes((roleKeyword || '').toLowerCase()) &&
                    !(excludeList || []).includes(r.name)
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
                        (p.team || []).some((m) => fuzzyMatchName(m, cand.name))
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
                "Team Leader"
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
                (t) => t !== taskName
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
                const match = existingDetails.find((d) => d.role === value && d.manMonth);
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
                .filter((cat) => cat !== null)
        )
    );
    if (surveyorTeamList.length > 0) {
        activeCategories.push("Surveyor");
    }

    const computedTotalProgress = useMemo(() => {
        if (activeCategories.length === 0) return 0;
        let total = 0;
        activeCategories.forEach((cat) => {
            total += parseInt(formData.categoryDetails?.[cat]?.progress) || 0;
        });
        return Math.round(total / activeCategories.length);
    }, [formData.categoryDetails, activeCategories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        let finalPayload = {
            ...formData,
        };
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
            })
        );
        if (
            finalPayload.type === "Perencanaan" &&
            finalPayload.surveyorTeam &&
            finalPayload.surveyorTeam.length > 0
        ) {
            activeCats.add("Surveyor");
            finalPayload.team = Array.from(
                new Set([...(finalPayload.team || []), ...finalPayload.surveyorTeam])
            );
        }
        const cleanDetails = {};
        activeCats.forEach((cat) => {
            if (finalPayload.categoryDetails && finalPayload.categoryDetails[cat]) {
                cleanDetails[cat] = finalPayload.categoryDetails[cat];
            }
        });

        if (
            finalPayload.type === "Pengawasan" ||
            finalPayload.type === "Manajemen Konstruksi"
        ) {
            if (!finalPayload.pengawasanDetails) finalPayload.pengawasanDetails = {};
            const assignment =
                typeof assignments !== "undefined"
                    ? assignments.find((a) => a.id === finalPayload.sourceAssignmentId)
                    : null;
            const originalNames = (assignment?.experts || [])
                .map((exp) => {
                    const expertObj =
                        typeof experts !== "undefined"
                            ? experts.find((e) => e.id === exp.expertId)
                            : null;
                    if (!expertObj) return null;
                    return getLinkedResourceName(
                        expertObj,
                        typeof resources !== "undefined" ? resources : []
                    );
                })
                .filter(Boolean);

            (finalPayload.team || []).forEach((memberName) => {
                if (!finalPayload.pengawasanDetails[memberName]) {
                    const isOriginalSyncedMember = finalPayload.sourceAssignmentId
                        ? originalNames.includes(memberName)
                        : false;
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
        handleCrudAction(modalConfig.mode, "project", finalPayload);
    };

    const filteredResources = (resources || []).filter(
        (res) =>
            (res.name || '').toLowerCase().includes((searchTeam || '').toLowerCase()) ||
            (res.role || '').toLowerCase().includes((searchTeam || '').toLowerCase())
    );
    const isPengawasanForm =
        formData.type === "Pengawasan" ||
        formData.type === "Manajemen Konstruksi";
    const isSyncedProject =
        modalConfig.mode === "edit" && Boolean(formData.sourceAssignmentId);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center sm:p-4 fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl border border-transparent dark:border-slate-700/50 w-full sm:max-w-4xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[95vh] pb-4 sm:pb-0">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {modalConfig.mode === "add" ? "Tambah " : "Edit "}
                        Data Proyek Terpadu
                    </h3>
                    <button
                        onClick={closeModal}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    <form id="crudProjectForm" onSubmit={handleSubmit} className="space-y-5">
                        {isSyncedProject && (
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
                                <Icon name="file-text" size={12} /> Deskripsi / Update Proyek
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
                                                        <option key={r.id || r.name} value={r.name}>
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
                                            const expertsData = (typeof experts !== "undefined" ? experts : [])
                                                .filter((e) => {
                                                    if (!searchTeam) return true;
                                                    return (
                                                        e.name?.toLowerCase().includes(searchTeam.toLowerCase()) ||
                                                        e.bidangIlmu?.toLowerCase().includes(searchTeam.toLowerCase())
                                                    );
                                                })
                                                .map((e, idx) => ({
                                                    id: e.id || `expert-${idx}`,
                                                    name: e.name,
                                                    role: e.bidangIlmu || "Tenaga Ahli",
                                                }));

                                            if (isPengawasanForm) {
                                                if (resources.length === 0 && expertsData.length === 0) {
                                                    return (
                                                        <p className="text-xs text-slate-400 italic">
                                                            Belum ada data tim atau tenaga ahli. Tambahkan di menu terkait.
                                                        </p>
                                                    );
                                                }
                                                if (filteredResources.length === 0 && expertsData.length === 0) {
                                                    return (
                                                        <p className="text-xs text-slate-400 italic">
                                                            Pencarian tidak ditemukan.
                                                        </p>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        {filteredResources.length > 0 && (
                                                            <TeamCheckboxGroup
                                                                title="Pilih Pegawai Internal (Alokasi Tim)"
                                                                roleFilter={() => true}
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
                                                                    roleFilter={() => true}
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
                                                                (r.role || '').toLowerCase().includes("arsitek")
                                                            }
                                                            isOptional={false}
                                                            filteredResources={filteredResources}
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                        <TeamCheckboxGroup
                                                            title="Tim Quantity Surveyor (QS)"
                                                            roleFilter={(r) =>
                                                                (r.role || '').toLowerCase() === "qs" ||
                                                                (r.role || '').toLowerCase().includes("quantity")
                                                            }
                                                            isOptional={false}
                                                            filteredResources={filteredResources}
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                        <TeamCheckboxGroup
                                                            title="Tim Struktur"
                                                            roleFilter={(r) =>
                                                                (r.role || '').toLowerCase().includes("struktur")
                                                            }
                                                            isOptional={true}
                                                            filteredResources={filteredResources}
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                        <TeamCheckboxGroup
                                                            title="Tim MEP"
                                                            roleFilter={(r) =>
                                                                (r.role || '').toLowerCase().includes("mep")
                                                            }
                                                            isOptional={true}
                                                            filteredResources={filteredResources}
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                        <TeamCheckboxGroup
                                                            title="Tim Tata Ruang"
                                                            roleFilter={(r) =>
                                                                (r.role || '').toLowerCase().includes("tata ruang") ||
                                                                (r.role || '').toLowerCase().includes("planologi")
                                                            }
                                                            isOptional={true}
                                                            filteredResources={filteredResources}
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                        <TeamCheckboxGroup
                                                            title="Lainnya"
                                                            roleFilter={(r) =>
                                                                !(r.role || '').toLowerCase().includes("arsitek") &&
                                                                !(
                                                                    (r.role || '').toLowerCase() === "qs" ||
                                                                    (r.role || '').toLowerCase().includes("quantity")
                                                                ) &&
                                                                !(r.role || '').toLowerCase().includes("struktur") &&
                                                                !(r.role || '').toLowerCase().includes("mep") &&
                                                                !(
                                                                    (r.role || '').toLowerCase().includes("tata ruang") ||
                                                                    (r.role || '').toLowerCase().includes("planologi")
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
                                                const assignment = (assignments || []).find(
                                                    (a) => a.id === formData.sourceAssignmentId
                                                );
                                                if (!assignment) return false;
                                                const originalNames = (assignment.experts || [])
                                                    .map((exp) => {
                                                        const expertObj = (experts || []).find(
                                                            (e) => e.id === exp.expertId
                                                        );
                                                        if (!expertObj) return null;
                                                        return getLinkedResourceName(
                                                            expertObj,
                                                            typeof resources !== "undefined"
                                                                ? resources
                                                                : []
                                                        );
                                                    })
                                                    .filter(Boolean);
                                                return originalNames.includes(member);
                                            })();
                                            const detail = formData.pengawasanDetails?.[
                                                member
                                            ] || {
                                                role: "Inspector",
                                                deadline: "",
                                                manMonth: "",
                                                spmk: "",
                                                statusTurun: isOriginalSyncedMember
                                                    ? "Tidak Turun"
                                                    : "Turun",
                                            };
                                            return (
                                                <div
                                                    key={member}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-3 shadow-sm"
                                                >
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
                                                                            (t) => t !== member
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
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowRoleManager(true)}
                                                                        className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
                                                                        title="Kelola Daftar Jabatan"
                                                                    >
                                                                        <Icon name="settings" size={10} /> Kelola
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <select
                                                                className={`block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 ${isOriginalSyncedMember ? "opacity-60 cursor-not-allowed" : ""}`}
                                                                value={detail.role || "Inspector"}
                                                                onChange={(e) =>
                                                                    handlePengawasanDetailChange(
                                                                        member,
                                                                        "role",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                disabled={isOriginalSyncedMember}
                                                            >
                                                                <option value="">-- Pilih Jabatan --</option>
                                                                {(roleList["Pengawasan"] || []).map((r) => (
                                                                    <option key={r} value={r}>
                                                                        {r}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col justify-end">
                                                            <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase whitespace-nowrap">
                                                                Status
                                                            </label>
                                                            <select
                                                                className="block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200"
                                                                value={
                                                                    detail.statusTurun ||
                                                                    (isOriginalSyncedMember ? "Tidak Turun" : "Turun")
                                                                }
                                                                onChange={(e) =>
                                                                    handlePengawasanDetailChange(
                                                                        member,
                                                                        "statusTurun",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="Turun">Turun</option>
                                                                <option value="Tidak Turun">Tidak Turun</option>
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
                                                                className={`block w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 transition-colors dark:text-slate-200 ${isOriginalSyncedMember ? "opacity-60 cursor-not-allowed" : ""}`}
                                                                value={detail.manMonth || ""}
                                                                onChange={(e) =>
                                                                    handlePengawasanDetailChange(
                                                                        member,
                                                                        "manMonth",
                                                                        e.target.value
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
                                                    const r = resources.find((x) =>
                                                        fuzzyMatchName(x.name, m)
                                                    );
                                                    return r && getCategoryFromRole(r.role) === cat;
                                                });
                                        return (
                                            <div
                                                key={cat}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-3 shadow-sm"
                                            >
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
                                                                                    parseInt(e.target.value)
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
                                                                        e.target.value
                                                                    )
                                                                }
                                                                onClick={(e) =>
                                                                    e.target.showPicker && e.target.showPicker()
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
                                                                        e.target.value
                                                                    )
                                                                }
                                                                onClick={(e) =>
                                                                    e.target.showPicker && e.target.showPicker()
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
                                                            (details.tasks || []).map((task) => {
                                                                const isChecked = (
                                                                    details.completedTasks || []
                                                                ).includes(task);
                                                                return (
                                                                    <div
                                                                        key={task}
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
                        form="crudProjectForm"
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
