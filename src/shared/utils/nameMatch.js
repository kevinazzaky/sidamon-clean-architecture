export const fuzzyMatchName = (name1, name2) => {
    if (!name1 || !name2) return false;
    let n1 = name1.toLowerCase().trim();
    let n2 = name2.toLowerCase().trim();
    if (n1 === n2) return true;

    const normalizeAbbreviations = (name) => {
        let s = name;
        s = s.replace(/\ba\.a\./g, 'anak agung ');
        s = s.replace(/\baa\b/g, 'anak agung ');
        s = s.replace(/\bi\.b\./g, 'ida bagus ');
        s = s.replace(/\bib\b/g, 'ida bagus ');
        s = s.replace(/\bi\.a\./g, 'ida ayu ');
        s = s.replace(/\bia\b/g, 'ida ayu ');
        s = s.replace(/\btjok\b/g, 'cokorda ');
        s = s.replace(/\bgde\b/g, 'gede ');
        s = s.replace(/\bwyn\b/g, 'wayan ');
        s = s.replace(/\bnym\b/g, 'nyoman ');
        return s;
    };

    n1 = normalizeAbbreviations(n1);
    n2 = normalizeAbbreviations(n2);

    const clean1 = n1.replace(/[,.]/g, ' ').replace(/\b(st|mt|ir|dr|prof|se|sh|spd|mpd|amd|sars|mars|ssi|msi|stm)\b/g, ' ').trim();
    const clean2 = n2.replace(/[,.]/g, ' ').replace(/\b(st|mt|ir|dr|prof|se|sh|spd|mpd|amd|sars|mars|ssi|msi|stm)\b/g, ' ').trim();

    let w1 = clean1.split(/\s+/).filter(w => w.length > 2);
    let w2 = clean2.split(/\s+/).filter(w => w.length > 2);

    const balineseTitles = ['anak', 'agung', 'istri', 'putu', 'made', 'komang', 'ketut', 'wayan', 'kadek', 'nyoman', 'gede', 'bagus', 'ida', 'tjokorda', 'cokorda', 'gusti', 'ngurah', 'dewa', 'ayu', 'desak', 'sagung', 'cok', 'tjok', 'luh', 'nengah', 'cening'];

    const sig1 = w1.filter(w => !balineseTitles.includes(w));
    const sig2 = w2.filter(w => !balineseTitles.includes(w));

    if (sig1.length > 0 && sig2.length > 0) {
        w1 = sig1;
        w2 = sig2;
    }

    let matchCount = 0;
    for (const w of w1) {
        if (w2.includes(w)) matchCount++;
    }

    if (w1.length === 0 || w2.length === 0) return false;

    const ratio = matchCount / Math.max(w1.length, w2.length);
    return ratio >= 0.7;
};

export const getLinkedResourceName = (expertObj, resourcesList) => {
    if (!expertObj) return null;
    if (expertObj.linkedResourceName) return expertObj.linkedResourceName;

    if (resourcesList && resourcesList.length > 0) {
        for (const res of resourcesList) {
            if (fuzzyMatchName(expertObj.name, res.name)) {
                return res.name;
            }
        }
    }
    return expertObj.name;
};
