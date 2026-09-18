import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';

const formatBytesSOP = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function SOPPage() {
    const {
        canManageSOP, fileInputRef, handleFileUploadSOP, uploadingSOP, loadingSOP,
        sopDocuments, handleDownloadPdf, selectedPdf, setSelectedPdf, handleDeleteSOP
    } = useContext(AppContext);

    return (
        <div className="flex flex-col h-full fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Daftar Dokumen</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Standar Operasional Prosedur & Dokumen Panduan</p>
                </div>

                {canManageSOP && (
                    <div>
                        <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUploadSOP}
                            disabled={uploadingSOP}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingSOP}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 text-white transition-all transform hover:scale-105 active:scale-95 ${uploadingSOP ? 'bg-indigo-400 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700'}`}
                        >
                            <Icon name="upload-cloud" size={18} />
                            {uploadingSOP ? 'Mengunggah...' : 'Upload Document'}
                        </button>
                    </div>
                )}
            </div>

            {loadingSOP ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (sopDocuments || []).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 dark:border-slate-700/50 p-8 text-center">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 shrink-0">
                        <Icon name="file-text" size={40} className="text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Belum Ada Dokumen SOP</h3>
                    <p className="text-slate-500 dark:text-slate-400">Dokumen panduan SOP perusahaan yang diunggah akan tampil di sini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 overflow-y-auto custom-scrollbar pr-2">
                    {(sopDocuments || []).map(doc => (
                        <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="flex-1 flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shrink-0">
                                    <Icon name="file-text" size={24} />
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2 line-clamp-2" title={doc.title}>
                                    {doc.title}
                                </h4>
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                        <span>Diunggah oleh:</span>
                                        <span className="font-medium">{(doc.uploadedBy || 'User').split('@')[0]}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>Ukuran:</span>
                                        <span className="font-medium">{formatBytesSOP(doc.size)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-2">
                                <button
                                    onClick={() => {
                                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
                                        if (isMobile) {
                                            handleDownloadPdf(doc);
                                        } else {
                                            setSelectedPdf(doc);
                                        }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)) ? (
                                        <><Icon name="download" size={16} /> Unduh</>
                                    ) : (
                                        <><Icon name="eye" size={16} /> Lihat</>
                                    )}
                                </button>
                                {canManageSOP && (
                                    <button
                                        onClick={() => handleDeleteSOP(doc)}
                                        className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors shrink-0"
                                        title="Hapus Dokumen"
                                    >
                                        <Icon name="trash-2" size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Embedded PDF Viewer Modal */}
            {selectedPdf && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 text-red-600">
                                    <Icon name="file-text" size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{selectedPdf.title}</h3>
                                    <p className="text-xs text-slate-500 truncate">{formatBytesSOP(selectedPdf.size)} • Diunggah pada {new Date(selectedPdf.uploadDate).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleDownloadPdf(selectedPdf)}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors"
                                    title="Download Dokumen"
                                >
                                    <Icon name="download" size={18} />
                                </button>
                                <button
                                    onClick={() => setSelectedPdf(null)}
                                    className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full transition-colors"
                                >
                                    <Icon name="x" size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative p-2 sm:p-4">
                            {(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)) ? (
                                <div className="absolute inset-2 sm:inset-4 flex flex-col items-center justify-center gap-4 text-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-inner">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                        <Icon name="file-text" size={32} className="text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200">Pratinjau Tidak Didukung</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Sistem operasi perangkat Anda (iOS/iPadOS) membatasi tampilan pratinjau dokumen PDF secara langsung di dalam aplikasi. Silakan unduh dokumen untuk membacanya.</p>
                                    <button onClick={() => handleDownloadPdf(selectedPdf)} className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 w-full max-w-xs">
                                        <Icon name="download" size={20} /> Unduh Dokumen
                                    </button>
                                </div>
                            ) : (
                                <div className="absolute inset-2 sm:inset-4 overflow-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-inner bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
                                    <object data={`${selectedPdf.url}#toolbar=0`} type="application/pdf" className="w-full h-full min-h-[500px] sm:min-h-full" title={selectedPdf.title}>
                                        <iframe src={`${selectedPdf.url}#toolbar=0`} className="w-full h-full min-h-[500px] sm:min-h-full" title={selectedPdf.title} />
                                    </object>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
