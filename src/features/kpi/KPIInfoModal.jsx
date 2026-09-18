import { useContext } from 'react';
import { motion } from 'motion/react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';

export default function KPIInfoModal() {
    const { showKPIInfoModal, setShowKPIInfoModal } = useContext(AppContext);

    if (!showKPIInfoModal) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowKPIInfoModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                            <Icon name="info" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Informasi Perhitungan KPI</h3>
                            <p className="text-xs text-slate-500 font-medium">Aturan (Rules Point) Evaluasi Kinerja</p>
                        </div>
                    </div>
                    <button onClick={() => setShowKPIInfoModal(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Icon name="x" size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2"><Icon name="users" size={16} className="text-blue-500" /> Perhitungan Sebagai Staff / Anggota Tim</h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                            <li><strong>Skor Dasar:</strong> 100 Poin</li>
                            <li><strong className="text-red-500">Penalti Keterlambatan:</strong> <strong className="font-bold">-5 Poin</strong> untuk setiap tugas yang melewati deadline dan belum mencapai 100%.</li>
                            <li><strong className="text-emerald-500">Bonus Selesai:</strong> <strong className="font-bold">+15 Poin</strong> untuk setiap tugas yang selesai 100% tepat waktu atau lebih cepat.</li>
                        </ul>
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-slate-200 dark:border-amber-900/30">
                        <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2"><Icon name="star" size={16} className="text-amber-500" /> Perhitungan Sebagai Team Leader</h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                            <li><strong>Kondisi 1: Saat memimpin proyek (Makro):</strong>
                                <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                    <li><strong className="text-red-500">Penalti Tanggung Jawab:</strong> <strong className="font-bold">-10 Poin</strong> jika proyek utama terlambat secara keseluruhan.</li>
                                    <li><strong className="text-emerald-500">Bonus Keberhasilan:</strong> <strong className="font-bold">+20 Poin</strong> jika proyek utama selesai 100% tepat waktu.</li>
                                </ul>
                            </li>
                            <li className="pt-1"><strong>Kondisi 2: Saat bertugas sebagai sub-tim di proyek lain:</strong>
                                <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                    <li>Diberlakukan aturan Staff (<strong className="text-red-500">-5 Poin</strong> jika tugasnya terlambat, <strong className="text-emerald-500">+15 Poin</strong> jika tugasnya selesai).</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                        <h4 className="font-bold text-purple-900 dark:text-purple-400 mb-2 flex items-center gap-2"><Icon name="zap" size={16} className="text-purple-500" /> Aturan Beban Kerja Berlebih (Overload)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Berlaku untuk semua personil jika menangani <strong>lebih dari 4 proyek aktif</strong> secara bersamaan:</p>
                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                            <li><strong className="text-emerald-500">Bonus Produktivitas:</strong> Jika <strong>tidak ada satu pun</strong> proyek yang terlambat, mendapat tambahan <strong className="font-bold">+10 Poin per proyek ekstra</strong> (contoh: 5 proyek aktif = +10 poin, 6 proyek aktif = +20 poin dan seterusnya).</li>
                            <li><strong className="text-red-500">Penalti Kewalahan:</strong> Jika <strong>terdapat proyek yang terlambat</strong> saat kondisi overload, akan langsung dijatuhi penalti tambahan <strong className="font-bold">-10 Poin</strong> (contoh: 5 proyek aktif, salah satunya terlambat = -10 poin, 6 proyek aktif, salah satunya terlambat = -20 poin dan seterusnya).</li>
                        </ul>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-2 flex items-center gap-2"><Icon name="bar-chart" size={16} className="text-emerald-500" /> Aturan Tie-Breaker</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jika terdapat personil dengan Skor KPI yang <strong>sama persis</strong>, peringkat klasemen (leaderboard) akan ditentukan menggunakan prioritas berikut:</p>
                        <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1.5 font-medium">
                            <li><strong className="text-slate-800 dark:text-slate-200">Rating Bintang Manual:</strong> Personil dengan Bintang Rating Manual lebih tinggi akan diletakkan di atas.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Penyelesaian Terbanyak:</strong> Jika Bintang Rating sama, personil dengan jumlah proyek selesai 100% tanpa keterlambatan terbanyak akan menang.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Minim Keterlambatan:</strong> Jika jumlah penyelesaian sama, personil dengan jumlah proyek terlambat lebih sedikit berada di atas.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Rata-Rata Progress:</strong> Jika tingkat keterlambatan juga sama, personil dengan persentase progress lebih tinggi akan diprioritaskan.</li>
                        </ol>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                        <Icon name="info" size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Skor akhir dibatasi maksimal 100 dan minimal 0. Skor dapat direvisi/di-override secara manual oleh Admin melalui opsi "Rating Manual" pada dashboard KPI.
                        </p>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                    <button onClick={() => setShowKPIInfoModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">Mengerti</button>
                </div>
            </motion.div>
        </div>
    );
}
