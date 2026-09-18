import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../app/AppContext';
import Icon from '../../../shared/components/Icon';
import { formatDateIndo } from '../../../shared/utils/dateHelpers';

export default function AssignmentModalForm() {
    const {
        modalConfig,
        setModalConfig,
        experts,
        assignments,
        lpseList,
        roleList,
        showRoleManager,
        setShowRoleManager,
        handleAssignmentAction,
        userRole,
        setAlertModal,
        loading,
        setShowLpseManager
    } = useContext(AppContext);

    const isEdit = modalConfig.mode === 'edit';

    const [formData, setFormData] = useState(() => {
        if (isEdit && modalConfig.data) {
            return { ...modalConfig.data, experts: modalConfig.data.experts || [], termins: modalConfig.data.termins || [] };
        }
        return {
            jobName: '',
            projectType: 'Pengawasan',
            contractType: 'Waktu Penugasan',
            tenderType: 'Tender',
            lpseName: '',
            startDate: '',
            duration: '',
            contractValue: '',
            company: '',
            experts: [],
            termins: []
        };
    });

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

            const expertObj = experts.find(e => e.id === exp.expertId);
            const expertName = expertObj ? expertObj.name : 'Tenaga Ahli';

            const existingAssignmentsInSameLpse = assignments.filter(asg => {
                if (isEdit && asg.id === formData.id) return false;
                if ((asg.lpseName || '').trim().toLowerCase() !== (formData.lpseName || '').trim().toLowerCase()) return false;

                if (asg.endDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const asgEnd = new Date(asg.endDate);
                    asgEnd.setHours(0, 0, 0, 0);
                    if (asgEnd < today) {
                        return false;
                    }
                }

                if (formData.startDate && endDate && asg.startDate && asg.endDate) {
                    const newStart = new Date(formData.startDate);
                    const newEnd = new Date(endDate);
                    const asgStart = new Date(asg.startDate);
                    const asgEnd = new Date(asg.endDate);

                    newStart.setHours(0, 0, 0, 0);
                    newEnd.setHours(0, 0, 0, 0);
                    asgStart.setHours(0, 0, 0, 0);
                    asgEnd.setHours(0, 0, 0, 0);

                    if (newStart > asgEnd || newEnd < asgStart) {
                        return false;
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
                    <button onClick={() => setModalConfig({ isOpen: false, type: null })} type="button" className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 p-2 rounded-xl transition-colors">
                        <Icon name="x" size={20} />
                    </button>
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
                                        );
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
