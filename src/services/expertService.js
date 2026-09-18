import { db } from './firebase';

export const expertsRef = () => db.ref('pmc_experts');
export const certListRef = () => db.ref('pmc_cert_list');

// Listener Khusus untuk Tenaga Ahli (dipisah dari pmc_data), termasuk auto cleanup duplikat
export const subscribeExperts = (onData) => {
    const ref = expertsRef();
    const handler = (snap) => {
        let expData = snap.val() || [];
        if (!Array.isArray(expData)) {
            expData = Object.values(expData);
        }
        expData = expData.filter(Boolean);

        // --- AUTO CLEANUP DUPLICATES ---
        const uniqueMap = new Map();
        let hasDuplicates = false;

        expData.forEach(exp => {
            if (!exp || !exp.name) return;
            const key = exp.name.trim().toLowerCase().replace(/\s+/g, ' ');
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, { ...exp });
            } else {
                hasDuplicates = true;
                const existing = uniqueMap.get(key);
                // Merge data
                if (!existing.phone && exp.phone) existing.phone = exp.phone;
                if (!existing.bidangIlmu && exp.bidangIlmu) existing.bidangIlmu = exp.bidangIlmu;
                if (!existing.jenjang && exp.jenjang) existing.jenjang = exp.jenjang;
                if (!existing.perusahaan && exp.perusahaan) existing.perusahaan = exp.perusahaan;

                // Merge certificates
                if (exp.certificates && Array.isArray(exp.certificates)) {
                    if (!existing.certificates) existing.certificates = [];
                    exp.certificates.forEach(c => {
                        if (c && c.certName) {
                            const cKey = c.certName.toLowerCase().replace(/\s+/g, ' ');
                            const lKey = c.certLevel ? c.certLevel.toLowerCase().replace(/\s+/g, ' ') : '';

                            const existingCertIndex = existing.certificates.findIndex(xc => {
                                const xcKey = xc.certName ? xc.certName.toLowerCase().replace(/\s+/g, ' ') : '';
                                const xlKey = xc.certLevel ? xc.certLevel.toLowerCase().replace(/\s+/g, ' ') : '';
                                return xcKey === cKey && xlKey === lKey;
                            });

                            if (existingCertIndex !== -1) {
                                // Update expired date if same name and same level
                                if (c.expiredDate) {
                                    existing.certificates[existingCertIndex].expiredDate = c.expiredDate;
                                }
                            } else {
                                // Add as new certificate if name is new, or if name is same but level is different
                                existing.certificates.push(c);
                            }
                        }
                    });
                }
            }
        });

        const cleanedData = Array.from(uniqueMap.values());
        if (hasDuplicates) {
            // Sync cleaned data back to Firebase silently
            expertsRef().set(cleanedData);
        }

        onData(cleanedData);
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveExperts = (newData) => expertsRef().set(newData);

// Dipakai handleCrudAction saat resource baru ditambahkan di menu Tim: buat entri pakar otomatis
// jika belum ada pakar dengan nama persis sama.
export const autoCreateExpertIfMissing = async (name) => {
    const ref = expertsRef();
    const snap = await ref.once('value');
    const expList = (snap.val() || []).filter(Boolean);

    if (!expList.some(e => e.name === name)) {
        expList.push({
            id: 'exp-' + Date.now().toString(),
            name: name,
            linkedResourceName: name,
            phone: '',
            status: 'Tersedia',
            jenjang: '',
            bidangIlmu: '',
            perusahaan: '',
            certificates: [],
            tenders: []
        });
        await ref.set(expList);
    }
};

export const subscribeCertList = (onData) => {
    const ref = certListRef();
    const handler = (snap) => {
        const certData = snap.val();
        if (certData && Array.isArray(certData)) {
            onData(certData);
        } else {
            const defaultCerts = [
                "Teknik Air Minum", "AMDAL", "Teknik Lingkungan", "STRA", "Arsitek", "Lanskap", "Teknik Bangunan Gedung", "Interior", "Teknik Elektronika dan Telekomunikasi dalam Gedung", "Geodesi", "Geodesi Jalan dan Jembatan", "Geodesi Bangunan Gedung", "Pengukuran Jalan", "Survei Terestris", "Geoteknik", "Penilai Bangunan Hijau", "Greenship", "Iluminasi", "Teknik Jalan", "Perencanaan Drainase", "Teknik Jembatan", "K3 Konstruksi", "Kesehatan Masyarakat", "Keselamatan Jalan", "Manajemen Konstruksi", "Manajemen Mutu", "Teknik Mekanikal", "Manajemen Proyek", "Perencanaan Wilayah dan Kota", "Teknik Plambing", "Teknik Proteksi Kebakaran", "Quantity Surveyor", "Teknik Sanitasi dan Limbah", "Sumber Daya Air", "Sistem Tata Udara", "Elektrikal Konstruksi Bangunan Gedung", "Teknik Transportasi dalam Gedung", "BIM", "Manajer Pengelolaan Bangunan Gedung", "Pengawas Bangunan Gedung", "Pelaksana Bangunan Gedung", "Pemeriksa Kelaikan Fungsi Struktur Bangunan Gedung", "Perawatan Bangunan Gedung", "Pelaksana Saluran Irigasi", "Teknik Bendungan Besar", "Sistem Informasi Geografis", "Kewilayahan", "Teknik Tenaga Listrik", "Teknik Sistem Tata Udara dan Refigrasi", "Pelaksana Pemeliharaan Jembatan"
            ];
            onData(defaultCerts);
            certListRef().set(defaultCerts);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveCertList = (newList) => certListRef().set(newList);
