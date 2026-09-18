import { useContext } from 'react';
import { AppContext } from '../../app/AppContext';
import Icon from './Icon';

export default function ErrorBanner() {
    const { errorMsg } = useContext(AppContext);
    if (!errorMsg) return null;
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm fade-in">
            <Icon name="alert-triangle" className="shrink-0 mt-0.5 text-red-500" />
            <div>
                <h4 className="font-bold text-sm">Masalah Koneksi Database</h4>
                <p className="text-sm mt-1">{errorMsg}</p>
                <p className="text-xs mt-2 text-red-600 font-medium">Solusi: Pastikan Anda telah menimpa seluruh kode backend (Code.gs) dengan yang terbaru dan melakukan Deploy "Versi Baru".</p>
            </div>
        </div>
    );
}
