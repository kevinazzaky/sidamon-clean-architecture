import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from '../../shared/components/Icon';
import { formatDateIndo } from '../../shared/utils/dateHelpers';

export default function InventoryPage() {
    const { inventory, searchInvTab, setSearchInvTab, borrowCart, setBorrowCart, setModalConfig } = useContext(AppContext);

    const filteredInv = inventory.filter(item => item.name?.toLowerCase().includes(searchInvTab.toLowerCase()) || item.type?.toLowerCase().includes(searchInvTab.toLowerCase()));

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari alat (nama atau kategori)..."
                        value={searchInvTab}
                        onChange={(e) => setSearchInvTab(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {borrowCart.length > 0 && (
                        <button
                            onClick={() => setModalConfig({ isOpen: true, type: 'inventory-cart', mode: 'borrow-cart', data: borrowCart })}
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                        >
                            <Icon name="shopping-cart" size={18} /> Pinjam {borrowCart.length} Alat
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={filteredInv.filter(i => i.status === 'Tersedia' && i.condition !== 'Rusak Berat').length > 0 && borrowCart.length === filteredInv.filter(i => i.status === 'Tersedia' && i.condition !== 'Rusak Berat').length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const availableIds = filteredInv.filter(i => i.status === 'Tersedia' && i.condition !== 'Rusak Berat').map(i => i.id);
                                                setBorrowCart(availableIds);
                                            } else {
                                                setBorrowCart([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold">Nama Alat & ID</th>
                                <th className="px-6 py-4 font-semibold">Kategori</th>
                                <th className="px-6 py-4 font-semibold text-center">Kondisi</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredInv.map((item) => {
                                const isOverdue = (item.status === 'Dipinjam' || item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan') && item.returnDate && new Date(item.returnDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                                return (
                                    <tr key={item.id} className={`transition-colors ${borrowCart.includes(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={item.status !== 'Tersedia' || item.condition === 'Rusak Berat'}
                                                checked={borrowCart.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setBorrowCart([...borrowCart, item.id]);
                                                    } else {
                                                        setBorrowCart(borrowCart.filter(id => id !== item.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{item.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.type}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.condition === 'Baik' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : item.condition === 'Rusak Sedang' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.status === 'Dipinjam' || item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan' ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800' : (item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan') ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                        {isOverdue ? 'Masa pinjam habis' : item.status}
                                                    </span>
                                                    <div className={`text-[11px] mt-2 text-center whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500'}`}>
                                                        Oleh: <strong>{item.borrower}</strong><br />
                                                        {item.borrowDate ? `${formatDateIndo(item.borrowDate)} s/d ` : ''}{item.returnDate ? formatDateIndo(item.returnDate) : '-'}
                                                        {item.status === 'Menunggu Verifikasi Perpanjangan' && item.newReturnDate && (
                                                            <div className="text-amber-600 font-semibold mt-1">Request: {formatDateIndo(item.newReturnDate)}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Tersedia
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === 'Tersedia' ? (
                                                    <button
                                                        onClick={() => setModalConfig({ isOpen: true, type: 'inventory-borrow', mode: 'borrow', data: item })}
                                                        disabled={item.condition === 'Rusak Berat'}
                                                        title={item.condition === 'Rusak Berat' ? "Alat rusak, tidak dapat dipinjam." : "Pinjam"}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${item.condition === 'Rusak Berat' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'}`}
                                                    >
                                                        Pinjam
                                                    </button>
                                                ) : item.status === 'Menunggu Verifikasi' || item.status === 'Menunggu Verifikasi Pengembalian' || item.status === 'Menunggu Verifikasi Perpanjangan' ? (
                                                    <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded-lg">Menunggu Logistik</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setModalConfig({ isOpen: true, type: 'inventory-extend', mode: 'extend', data: item })}
                                                            className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
                                                        >
                                                            Perpanjang
                                                        </button>
                                                        <button
                                                            onClick={() => setModalConfig({ isOpen: true, type: 'inventory-return', mode: 'return', data: item })}
                                                            className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                                        >
                                                            Kembalikan
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInv.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                            <Icon name="box" size={48} className="mb-4 opacity-50" />
                                            <p className="text-sm">Tidak ada data alat/inventaris ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
