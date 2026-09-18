import { db } from './firebase';

export const inventoryRef = () => db.ref('pmc_inventory');

// Listener Khusus untuk Inventaris (dipisah dari pmc_data agar tidak tertimpa sync)
export const subscribeInventory = (onData) => {
    const ref = inventoryRef();
    const handler = (snap) => {
        const invData = snap.val() || [];
        onData(invData.filter(Boolean));
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
};

export const saveInventory = (newData) => inventoryRef().set(newData);
