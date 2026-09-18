import { db } from './firebase';

export const sopRef = () => db.ref('pmc_sops');

// Listener Khusus untuk SOP
export const subscribeSopDocuments = (onData) => {
    const ref = sopRef();
    const handler = (snap) => {
        const data = snap.val();
        if (data) {
            const docs = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
            onData(docs);
        } else {
            onData([]);
        }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const uploadSopDocument = (doc) => sopRef().push(doc);

export const deleteSopDocument = (id) => sopRef().child(id).remove();
