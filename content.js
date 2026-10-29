// ==UserScript==
// @name         Vevidental - ASSISTANT PRIVÉ
// @version      29
// @updateURL    https://raw.githubusercontent.com/tarektt147-jpg/vevidental-assistant/main/content.js
// @downloadURL  https://raw.githubusercontent.com/tarektt147-jpg/vevidental-assistant/main/content.js
// @match        https://www.vevidental.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const INSTANCE_GLOBALE = '__vevidentalAssistantLoaded';
    if (window[INSTANCE_GLOBALE]) return;
    window[INSTANCE_GLOBALE] = true;

    let alerteEnCours = false;
    const VERSION_SCRIPT = 29;      // le même numéro que @version : affiché sur le bouton EXCEL

    // --- LISTE CLIENTS CHINE ---
    const CLIENTS_CHINE = [
        "DENTALNEXT",
        "DENTAL NEXT",
        "DENTAL-NEXT",
        "JUVISY GARE",
    ];

    // --- SYSTÈME BOÎTES / JOURS ---
    const BOITE_JOURS = {
        // nomFr / encre (V29) : la couleur dite comme au labo, et un texte lisible dessus
        'WHITE':  { jour: 'Lundi',    precedent: 'GREEN',  emoji: '\u26AA', couleurHex: '#ecf0f1', nomFr: 'BLANCHE', encre: '#1e272e' },
        'YELLOW': { jour: 'Mardi',    precedent: 'WHITE',  emoji: '\uD83D\uDFE1', couleurHex: '#f1c40f', nomFr: 'JAUNE', encre: '#1e272e' },
        'RED':    { jour: 'Mercredi', precedent: 'YELLOW', emoji: '\uD83D\uDD34', couleurHex: '#e74c3c', nomFr: 'ROUGE', encre: '#ffffff' },
        'BLUE':   { jour: 'Jeudi',    precedent: 'RED',    emoji: '\uD83D\uDD35', couleurHex: '#3498db', nomFr: 'BLEUE', encre: '#ffffff' },
        'GREEN':  { jour: 'Vendredi', precedent: 'BLUE',   emoji: '\uD83D\uDFE2', couleurHex: '#2ecc71', nomFr: 'VERTE', encre: '#1e272e' },
    };

    const JOUR_SEMAINE_TO_BOITE = { 1: 'WHITE', 2: 'YELLOW', 3: 'RED', 4: 'BLUE', 5: 'GREEN' };

    // LE CLIP, AVEC LES RÈGLES DE LABCORE (V28, 28/10/2026). Avant, le script avait
    // les siennes (une ligne de 6 unités, des mots comme « implant », toujours la
    // veille) et ne disait plus la même couleur que LabCore depuis le 18/10. Les
    // données ci-dessous sont GÉNÉRÉES depuis LabCore — on ne les recopie jamais à la
    // main : la même question posée à deux endroits finit par avoir deux réponses.
    // >>> RÈGLES LABCORE (générées par labcore/tools/gen_regles_script_vevidental.py depuis LabCore 1.8.90 — ne pas modifier à la main)
    const R = {"labcore":"1.8.90","categories":[["ZIRCONE",["C&B100","C&B102","K&B100","K&B102","|LB007","|LB008"]],["ZIRCONE_INLAY",["C&B1302","C&B1303","C&B1304","C&B1306","K&B903","K&B904","300.030"]],["PILIER_ZR",[]],["EMAX",["C&B200","C&B1305","K&B200"]],["ENAMIC",["C&B300","K&B300","01.EN1E"]],["COCR_COURONNE",["C&B500","K&B500"]],["COCR_INLAY",["C&B501","K&B501"]],["COCR_STRUCTURE",["C&B502","K&B502"]],["TITANE_COURONNE",["C&B600","K&B600"]],["TITANE_INLAY",["C&B601","K&B601"]],["TITANE_STRUCTURE",["C&B602","K&B602"]],["TEMPORAIRE",["C&B400","K&B400","K&B401"]],["TRY_IN",["C&B401"]],["DSD",["C&B901","K&B901","01.031"]],["DSD_SUP",["SUP010","SUP011"]],["DESIGN_TRANSVISSE",["06.0012"]],["PROTHESE_COMPLETE",["PA001","PA002","LP001","LP002"]],["PROTHESE_PARTIELLE",["PA003","LP003"]],["STELLITE",["PA005","LP005"]],["ESSAI_CIRE",["PA004","LP004"]],["3D_PRINT",["3D001","3D002","01.037"]],["SCAN",["|LB006"]],["CIRE",["|LB005"]],["SERVICES_LABO",[]]],"familles":{"ZIRCONE":"FIXE","ZIRCONE_INLAY":"FIXE","PILIER_ZR":"FIXE","EMAX":"FIXE","ENAMIC":"FIXE","COCR_COURONNE":"FIXE","COCR_INLAY":"FIXE","COCR_STRUCTURE":"FIXE","TITANE_COURONNE":"FIXE","TITANE_INLAY":"FIXE","TITANE_STRUCTURE":"FIXE","TEMPORAIRE":"FIXE","TRY_IN":"FIXE","DSD":"FIXE","DSD_SUP":"SERVICES","DESIGN_TRANSVISSE":"SERVICES","PROTHESE_COMPLETE":"AMOVIBLE","PROTHESE_PARTIELLE":"AMOVIBLE","STELLITE":"AMOVIBLE","ESSAI_CIRE":"AMOVIBLE","3D_PRINT":"SERVICES","SCAN":"SERVICES","CIRE":"FIXE","SERVICES_LABO":"SERVICES","AUTRE":"FIXE"},"zircone":["ZIRCONE","ZIRCONE_INLAY","PILIER_ZR"],"ailette":["01.029","300.029"],"ailetteMatieres":["ZIRCONE","EMAX","ENAMIC","COCR_COURONNE","COCR_STRUCTURE","TEMPORAIRE","TRY_IN","TITANE_COURONNE","TITANE_STRUCTURE","CIRE"],"sections":[["COLLAGE",["C&B900","K&B900","01.0011","300.0011"]],["EMBASE",["C&B700","K&B700","01.003","300.69322","172.MPR-TBH1","172.MPR-TBH2","172.MPR-TBH3","172.MPW-TBH1","01.010","01.011","01.015","300.012","300.014","300.022"]],["SUPPLEMENT",[]],["TRANSPORT",["95.200"]],["ANALOGUE",[]]],"prefixesSections":[["TIB","EMBASE"],["SUP","SUPPLEMENT"],["OUT","SUPPLEMENT"],["TR","TRANSPORT"]],"prefixesArticles":["01","300"],"articles2026":{"025":"PROTHESE_COMPLETE","026":"PROTHESE_PARTIELLE","027":"ESSAI_CIRE","028":"CIRE","030":"ZIRCONE_INLAY","031":"DSD","034":"DSD_SUP","035":"DESIGN_TRANSVISSE","037":"3D_PRINT","038":"PILIER_ZR","039":"COCR_STRUCTURE","040":"TITANE_STRUCTURE","041":"TRY_IN","042":"TEMPORAIRE"},"composants2026":{"009":"ANALOGUE","010":"EMBASE","011":"EMBASE","012":"EMBASE","013":"EMBASE","014":"EMBASE","015":"EMBASE","016":"EMBASE","017":"EMBASE","018":"EMBASE","019":"EMBASE","020":"EMBASE","021":"EMBASE","022":"EMBASE","023":"EMBASE","024":"EMBASE","032":"SUPPLEMENT","033":"SUPPLEMENT","036":"SUPPLEMENT","088":"SUPPLEMENT","099":"SUPPLEMENT"},"prefixesAchetes":["172","95"],"suffixesComposants":["0011","003","69322","MPR-","MPW-","TBH"],"suffixesNumeriques":{"002":"EMAX","004":"COCR_COURONNE","005":"COCR_INLAY","69320":"ZIRCONE_INLAY","69321":"EMAX","69323":"ENAMIC","68588":"CIRE"},"suffixesProduits":[["STELLITE","STELLITE"],["INLAYCOMP","ENAMIC"],["CRCOIL","COCR_INLAY"],["CRCO","COCR_COURONNE"],["CADTEMP","TEMPORAIRE"],["ENAMIC","ENAMIC"],["EMAX","EMAX"],["EDMYS","ZIRCONE"],["EDCYS","ZIRCONE"],["ZRMULTI","ZIRCONE"],["ZRIMPLANT","ZIRCONE"],["MODEL","3D_PRINT"],["N-GUARD","PROTHESE_PARTIELLE"]],"codesComposants":["C&B700","K&B700","TIB001","TIB002","TIB003","TIB004","TIB005","TIB006","TIB007","TIB008","TIB009","TIB010","C&B900","K&B900"],"prefixesIgnorer":["SUP","OUT","TR"],"seuilGros":6,"seuilFullArch":12,"clipAvance":1,"clipAvanceGrand":2,"seuilClipGrand":11,"feries":["2026-01-01","2026-04-06","2026-05-01","2026-05-14","2026-05-25","2026-07-21","2026-08-15","2026-11-01","2026-11-11","2026-12-25","2027-01-01","2027-03-29","2027-05-01","2027-05-06","2027-05-17","2027-07-21","2027-08-15","2027-11-01","2027-11-11","2027-12-25","2028-01-01","2028-04-17","2028-05-01","2028-05-25","2028-06-05","2028-07-21","2028-08-15","2028-11-01","2028-11-11","2028-12-25"]};
    // <<< FIN RÈGLES LABCORE

    const RE_SECTION_PRODUITS = /Produit\s+Unités\s+Dents(.+?)(?:Essayages|Date de finalisation)/is;
    const RE_DEBUT_PRODUIT = /(?:(?<=\s)|^)([A-Za-z0-9&|.\-]*[A-Za-z][A-Za-z0-9&|.\-]*|\d+\.[\d.]+)\s+-\s/g;
    const RE_QTE_DENTS = /(?:(?<=\s)|^)(\d+)\s+((?:\d{1,2}(?:-\d{1,2})?)(?:,\d{1,2}(?:-\d{1,2})?)*|-)(?=\s|$)/g;
    const RE_LIBELLE_EMBASE = /^\s*(?:EMBASE\s+TITANE|TI[\s\-]?BASE)\b/i;
    const RE_LIBELLE_AILETTE = /\bAILETTE\b.*\bMARYLAND\b/i;

    // Les produits du bon : [code, libellé, unités] — comme `pdf_parser._decouper_produits`.
    function decouperProduits(section) {
        const bornes = [...section.matchAll(RE_DEBUT_PRODUIT)].map(m => [m.index, m[1], m.index + m[0].length]);
        const out = [];
        bornes.forEach(([debut, code, fin], i) => {
            const suite = i + 1 < bornes.length ? bornes[i + 1][0] : section.length;
            const bout = section.slice(fin, suite).trim();
            const trouve = [...bout.matchAll(RE_QTE_DENTS)].filter(m => dentsPlausibles(m[2]));
            if (!trouve.length) return;                       // illisible : ignoré, pas deviné
            const m = trouve[trouve.length - 1];
            out.push([code, bout.slice(0, m.index).trim(), m[1]]);
        });
        return out;
    }
    function dentsPlausibles(t) {
        if (t === '-') return true;
        const nums = (t.match(/\d{1,2}/g) || []).map(Number);
        return nums.length > 0 && nums.every(n => n >= 11 && n <= 48);
    }
    function article2026(c) {
        const i = c.indexOf('.');
        return (i > 0 && R.prefixesArticles.includes(c.slice(0, i))) ? c.slice(i + 1) : null;
    }
    // Comme `constants.section_du_code`.
    function sectionDuCode(code, libelle) {
        if (!code) return null;
        const c = String(code).toUpperCase().trim();
        for (const [section, codes] of R.sections) if (codes.includes(c)) return section;
        for (const [p, section] of R.prefixesSections) if (c.startsWith(p)) return section;
        const a = article2026(c);
        if (a !== null && R.composants2026[a]) return R.composants2026[a];
        if (libelle && RE_LIBELLE_EMBASE.test(String(libelle))) return 'EMBASE';
        return null;
    }
    // Comme `constants._categorie_depuis_suffixe` : null = composant, false = inconnu.
    function categorieDepuisSuffixe(suffixe) {
        const s = suffixe.toUpperCase().trim();
        if (R.suffixesComposants.some(f => s.startsWith(f) || s === f)) return null;
        let cle = R.suffixesNumeriques[s];
        if (!cle) { const p = R.suffixesProduits.find(([frag]) => s.includes(frag)); cle = p && p[1]; }
        return (cle && R.familles[cle] !== undefined) ? cle : false;
    }
    // Comme `constants.get_categorie_from_code` : la catégorie, ou null (pas un élément).
    function categorieDuCode(code, libelle) {
        code = code.toUpperCase().trim();
        for (const [cat, codes] of R.categories) if (codes.includes(code)) return cat;
        if (R.ailette.includes(code) || (libelle && RE_LIBELLE_AILETTE.test(String(libelle)))) return 'AILETTE_MARYLAND';
        if (sectionDuCode(code, libelle)) return null;
        const i = code.indexOf('.');
        if (i >= 0) {
            const prefixe = code.slice(0, i), suffixe = code.slice(i + 1);
            if (/^\d+$/.test(prefixe) && suffixe) {
                if (R.prefixesAchetes.includes(prefixe)) return null;
                const cle = R.articles2026[article2026(code)];
                if (cle) return cle;
                const res = categorieDepuisSuffixe(suffixe);
                if (res !== false) return res;
            }
        }
        if (R.codesComposants.includes(code)) return null;
        if (code.startsWith('TIB')) return null;
        if (R.prefixesIgnorer.some(p => code.startsWith(p))) return null;
        if (i < 0) { const res = categorieDepuisSuffixe(code); if (res !== false) return res; }
        return 'AUTRE';
    }
    // Comme `pdf_parser.extraire_elements` + `extraire_composants` : le total d'éléments,
    // ceux en zircone, et le nombre de collages (= un cas implant).
    function compterBon(text) {
        const m = RE_SECTION_PRODUITS.exec(text || '');
        const zone = m ? m[1] : (text || '');
        let total = 0, ailettes = 0, collages = 0;
        const details = {};
        for (const [code, libelle, unitesTxt] of decouperProduits(zone)) {
            if (sectionDuCode(code, libelle) === 'COLLAGE') collages += parseInt(unitesTxt, 10) || 0;
            if (!m) continue;                                 // pas de section produits : 0 élément
            let unites = parseInt(unitesTxt, 10);
            let cat = categorieDuCode(code, libelle);
            if (cat === null) continue;
            if (cat === 'AILETTE_MARYLAND') { ailettes += unites; continue; }
            if (cat === 'TEMPORAIRE' && /TRY[\s\-']*IN/i.test(libelle || '')) cat = 'TRY_IN';
            if (R.familles[cat] === 'AMOVIBLE' && unites > 1) unites = 1;
            total += unites;
            details[cat] = (details[cat] || 0) + unites;
        }
        if (ailettes) {
            const cle = R.ailetteMatieres.find(k => details[k]) || 'ZIRCONE';
            total += ailettes;
            details[cle] = (details[cle] || 0) + ailettes;
        }
        const zircone = R.zircone.reduce((n, k) => n + (details[k] || 0), 0);
        return { total, zircone, collages };
    }
    function isoLocal(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    // Comme `planning._soustraire_jours_ouvres` : sans week-end ni jour férié belge.
    function reculerJoursOuvres(d, n) {
        const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        while (n > 0) {
            r.setDate(r.getDate() - 1);
            if (r.getDay() !== 0 && r.getDay() !== 6 && !R.feries.includes(isoLocal(r))) n--;
        }
        return r;
    }
    // Comme `planning.calculer_timeline` : clip = implant, ou 6 él. et plus ; 1 jour
    // d'avance, 2 pour un grand bridge zircone (plus de 10 él.). La couleur est celle
    // du jour du clip (la sortie moins l'avance, en jours ouvrés).
    function clipDuBon(text, boite, dateFinalisation) {
        const c = compterBon(text);
        const implant = c.collages > 0;
        const gros = c.total >= R.seuilGros || c.total >= R.seuilFullArch;
        if (!implant && !gros) return { besoinClips: false, compte: c };
        const avance = c.zircone >= R.seuilClipGrand ? R.clipAvanceGrand : R.clipAvance;
        let couleur = null;
        const md = (dateFinalisation || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (md) {
            const jour = reculerJoursOuvres(new Date(+md[3], +md[2] - 1, +md[1]), avance);
            couleur = JOUR_SEMAINE_TO_BOITE[jour.getDay()];
        } else if (BOITE_JOURS[(boite || '').toUpperCase()]) {   // sans date : la boîte
            couleur = (boite || '').toUpperCase();
            for (let k = 0; k < avance; k++) couleur = BOITE_JOURS[couleur].precedent;
        }
        if (!couleur) return { besoinClips: false, compte: c };
        const raisons = [];
        if (implant) raisons.push('Implant');
        if (gros) raisons.push(`${c.total} él.`);
        if (avance === R.clipAvanceGrand) raisons.push(`grand bridge zircone : ${avance} jours d'avance`);
        const info = BOITE_JOURS[couleur];
        return { besoinClips: true, couleurClips: couleur, jourClips: info.jour, emojiClips: info.emoji,
                 hexClips: info.couleurHex, raison: raisons.join(' + '), avance, compte: c };
    }

    // --- 1. CHARGEMENT PDF.JS + SHEETJS ---
    const URL_PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    const URL_XLSX = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

    function injecterScriptSiAbsent(src) {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
    }

    function attendreLib(testFn, nom, timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            if (testFn()) return resolve();
            const start = Date.now();
            const timer = setInterval(() => {
                if (testFn()) {
                    clearInterval(timer);
                    resolve();
                    return;
                }
                if (Date.now() - start >= timeoutMs) {
                    clearInterval(timer);
                    reject(new Error(`${nom} indisponible (timeout ${timeoutMs}ms)`));
                }
            }, 50);
        });
    }

    injecterScriptSiAbsent(URL_PDFJS);
    injecterScriptSiAbsent(URL_XLSX);

    const pdfReadyPromise = attendreLib(() => !!window['pdfjs-dist/build/pdf'], 'PDF.js');
    const xlsxReadyPromise = attendreLib(() => !!window.XLSX, 'SheetJS');

    function getDateLocaleISO() {
        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        return `${annee}-${mois}-${jour}`;
    }

    function nettoyer(t) {
        if (!t) return "Inconnu";
        return t.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/[\\\/:\*\?"<>|]/g, '').trim();
    }

    function isClientChine(clientName) {
        const clientUpper = clientName.toUpperCase();
        return CLIENTS_CHINE.some(c => clientUpper.includes(c.toUpperCase()));
    }

    // --- COHÉRENCE BOÎTE / DATE ---
    function verifierCoherenceBoite(boite, dateFinalisation) {
        const boiteUpper = (boite || '').toUpperCase();
        const info = BOITE_JOURS[boiteUpper];
        if (!info || !dateFinalisation) return null;

        const match = dateFinalisation.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!match) return null;

        const dateObj = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        const jourSemaine = dateObj.getDay(); // 0=dim, 1=lun...5=ven, 6=sam
        const boiteAttendue = JOUR_SEMAINE_TO_BOITE[jourSemaine];

        if (!boiteAttendue) return null; // week-end
        if (boiteAttendue === boiteUpper) return null; // cohérent

        const infoAttendue = BOITE_JOURS[boiteAttendue];
        return {
            incoherent: true,
            message: `Boîte ${info.nomFr} (${info.jour.toLowerCase()}) mais sortie un ${infoAttendue.jour.toLowerCase()} → vérifie la boîte ou la date de sortie`,
            boiteAttendue: boiteAttendue,
            jourAttendu: infoAttendue.jour
        };
    }

    // --- EXCEL : ACCUMULATION + EXPORT ---
    function getExcelKey(boite) {
        const today = getDateLocaleISO();
        return `vevidental_excel_${today}_${boite}`;
    }

    function accumulerExcel(boite, entree) {
        if (!boite) return 0;
        const key = getExcelKey(boite);
        let data = [];
        try { const raw = localStorage.getItem(key); if (raw) data = JSON.parse(raw); } catch(e) { data = []; }
        // Dédoublication par ID
        if (entree.id && data.some(d => d.id === entree.id)) return data.length;
        data.push(entree);
        localStorage.setItem(key, JSON.stringify(data));
        return data.length;
    }

    function getExcelData(boite) {
        const key = getExcelKey(boite);
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
    }

    // LA LISTE GÉNÉRALE, DANS L'ORDRE D'IMPRESSION (V28, 28/10/2026). Tarek : « la liste
    // des noms de patients, c'est par couleurs ; j'ai besoin d'une liste générale des
    // bons par ordre d'impression ». LabCore imprime chaque bon dès qu'il le reçoit :
    // l'ordre des téléchargements EST l'ordre d'impression. Un bon retéléchargé garde
    // sa première place. Les listes par couleur ne changent pas.
    function getListeKey() {
        return `vevidental_liste_${getDateLocaleISO()}`;
    }

    function getListe() {
        try { return JSON.parse(localStorage.getItem(getListeKey()) || '[]'); } catch(e) { return []; }
    }

    function ajouterALaListe(entree) {
        const liste = getListe();
        if (entree.id && liste.some(d => d.id === entree.id)) return liste.length;
        liste.push(Object.assign({ n: liste.length + 1 }, entree));
        localStorage.setItem(getListeKey(), JSON.stringify(liste));
        return liste.length;
    }

    async function genererListeGenerale() {
        try {
            await xlsxReadyPromise;
        } catch (e) {
            alert("SheetJS n'est pas disponible pour le moment. Réessayez.");
            return;
        }
        const liste = getListe();
        if (liste.length === 0) return;
        const jourDe = (c) => (BOITE_JOURS[c] ? `${BOITE_JOURS[c].nomFr} (${BOITE_JOURS[c].jour.toLowerCase()})` : (c || ''));
        const aoa = [['N°', 'Heure', 'Patient', 'Client', 'Boîte', 'Clip', 'Chine'],
                     ...liste.map(e => [e.n, e.heure, e.patient, e.client, jourDe(e.boite),
                                        e.clip ? jourDe(e.clip) : '', e.chine ? 'Chine' : ''])];
        const ws = window.XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 5 }, { wch: 7 }, { wch: 30 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 7 }];
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Ordre d'impression");
        window.XLSX.writeFile(wb, `Liste_generale_${getDateLocaleISO()}.xlsx`, { compression: true });
    }

    function getTotalAujourdhui() {
        const couleurs = ['WHITE','YELLOW','RED','BLUE','GREEN'];
        let total = 0;
        couleurs.forEach(c => { total += getExcelData(c).length; });
        return total;
    }

    async function genererExcel(boite) {
        try {
            await xlsxReadyPromise;
        } catch (e) {
            alert("SheetJS n'est pas disponible pour le moment. Réessayez.");
            return;
        }
        const data = getExcelData(boite);
        if (data.length === 0) return;

        const today = getDateLocaleISO();
        const boiteInfo = BOITE_JOURS[boite];
        const header = ['Patient', 'Client'];
        const rows = data.map(e => [e.patient, e.client]);
        const aoa = [header, ...rows];

        const ws = window.XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [{ wch: 30 }, { wch: 40 }];
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, boiteInfo ? boiteInfo.jour : boite);
        window.XLSX.writeFile(wb, `${boite}_${today}.xlsx`, { compression: true });
    }

    function exporterTout() {
        const couleurs = ['WHITE','YELLOW','RED','BLUE','GREEN'];
        let count = 0;
        couleurs.forEach((c, i) => {
            if (getExcelData(c).length > 0) {
                setTimeout(() => { void genererExcel(c); }, i * 500);
                count++;
            }
        });
        return count;
    }

    function effacerAujourdhui() {
        const today = getDateLocaleISO();
        const couleurs = ['WHITE','YELLOW','RED','BLUE','GREEN'];
        couleurs.forEach(c => localStorage.removeItem(`vevidental_excel_${today}_${c}`));
        localStorage.removeItem(getListeKey());
        mettreAJourBadge();
    }

    function nettoyerAnciennesDonnees() {
        const keys = Object.keys(localStorage);
        const now = new Date();
        keys.forEach(key => {
            if (!key.startsWith('vevidental_excel_') && !key.startsWith('vevidental_liste_')) return;
            const m = key.match(/^vevidental_(?:excel|liste)_(\d{4}-\d{2}-\d{2})/);
            if (!m) return;
            const diff = (now - new Date(m[1])) / (1000 * 60 * 60 * 24);
            if (diff > 7) localStorage.removeItem(key);
        });
    }

    function mettreAJourBadge() {
        const badge = document.getElementById('v-excel-badge');
        const btn = document.getElementById('v-excel-btn');
        if (!badge || !btn) return;
        const total = getTotalAujourdhui();
        badge.textContent = total;
        // Mettre à jour les compteurs dans le menu
        const menu = document.getElementById('v-excel-menu');
        if (menu) {
            const couleurs = ['WHITE','YELLOW','RED','BLUE','GREEN'];
            couleurs.forEach(c => {
                const cnt = document.getElementById(`v-cnt-${c}`);
                if (cnt) cnt.textContent = getExcelData(c).length;
                const dlBtn = document.getElementById(`v-dl-${c}`);
                if (dlBtn) dlBtn.style.display = getExcelData(c).length > 0 ? 'inline-block' : 'none';
            });
            const totalBtn = document.getElementById('v-export-all-cnt');
            if (totalBtn) totalBtn.textContent = total;
            const listeCnt = document.getElementById('v-liste-cnt');
            if (listeCnt) listeCnt.textContent = getListe().length;
        }
    }

    // --- 2. RAPPEL APRÈS « CRÉER ET ACCEPTER » (V29) ---
    // Tarek, 29/10 : « Commande enregistrée », il reste là jusqu'au clic (6 s, c'était
    // trop court : on le ratait), et un bouton ouvre directement le bon.
    function trouverLienBon() {
        return [...document.querySelectorAll('a, button')]
            .find(el => /^Bon de travail$/i.test((el.textContent || '').replace(/\s+/g, ' ').trim())) || null;
    }

    function afficherRappelSiBesoin() {
        if (sessionStorage.getItem('rappelImprimer') !== 'true') return;
        sessionStorage.removeItem('rappelImprimer');
        const notification = document.createElement('div');
        notification.id = 'v-rappel';
        Object.assign(notification.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#1e272e', color: 'white', padding: '16px 26px',
            borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: '100000', fontFamily: "'Segoe UI',system-ui,sans-serif", border: '1px solid #2ecc71', textAlign: 'center'
        });
        notification.innerHTML = `
            <div style="color:#2ecc71; font-weight:800; margin-bottom:6px; letter-spacing:0.5px;">✅ COMMANDE ENREGISTRÉE</div>
            <div style="font-size:15px;">N'oublie pas de télécharger le bon.</div>
            <div style="display:flex; gap:8px; justify-content:center; margin-top:12px;">
                <button id="n-dl" style="background:#2ecc71; color:#1e272e; border:none; padding:7px 16px; border-radius:8px; cursor:pointer; font-weight:800;">TÉLÉCHARGER LE BON</button>
                <button id="n-ok" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.4); padding:7px 14px; border-radius:8px; cursor:pointer; font-weight:600;">COMPRIS</button>
            </div>
            <div id="n-info" style="font-size:12px; color:#f39c12; margin-top:8px; display:none;"></div>`;
        document.body.appendChild(notification);
        document.getElementById('n-ok').onclick = () => notification.remove();
        document.getElementById('n-dl').onclick = () => {
            const lien = trouverLienBon();
            if (!lien) {
                const info = document.getElementById('n-info');
                info.textContent = "Bouton « Bon de travail » introuvable sur cette page : ouvre la commande, puis clique dessus.";
                info.style.display = 'block';
                return;
            }
            notification.remove();
            lien.click();                  // la même fenêtre que le clic de Kathy
        };
    }

    // --- 3. ANALYSE ET INTERFACE ---
    async function analyserBonTravail(el) {
        if (alerteEnCours) return;
        alerteEnCours = true;

        const rideau = document.createElement('div');
        Object.assign(rideau.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '99999',
            opacity: '0', transition: 'opacity 0.3s ease'
        });
        document.body.appendChild(rideau);
        requestAnimationFrame(() => { rideau.style.opacity = '1'; });
        rideau.innerHTML = `<div style="color:white; font-family:'Segoe UI',system-ui,sans-serif; font-size:16px; animation:v-pulse 1.5s infinite;">Préparation du fichier...</div>`;

        try {
            await pdfReadyPromise;
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            const url = el.href || el.getAttribute('href');
            if (!url) throw new Error('Lien du bon de travail introuvable');
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
            const blob = await response.blob();
            // isEvalSupported : la parade de la faille connue de ce lecteur PDF (CVE-2024-4367) ;
            // la lecture du texte ne change pas (V28).
            const pdf = await pdfjsLib.getDocument({data: await blob.arrayBuffer(), isEvalSupported: false}).promise;
            if (!pdf || pdf.numPages < 1) throw new Error('PDF vide ou invalide');
            const content = await (await pdf.getPage(1)).getTextContent();
            const text = content.items.map(item => item.str).join(" ");

            // --- EXTRACTION DE PRÉCISION ---
            const matchID = (text.match(/Travail\s*(\d+)/i) || text.match(/(\d{10,})/) || ["","ID"])[1];

            const mD = text.match(/Date d'acceptation\s*(\d{2})\/(\d{2})\/(\d{4})/i);
            const dateFichier = mD ? `${mD[1]}-${mD[2]}-${mD[3]}` : "00-00-0000";

            const matchClient = text.match(/Client\s+(\d{3,9}\s*-\s*.+?)(?=\s*Docteur)/i);
            const client = matchClient ? nettoyer(matchClient[1]) : "Inconnu";

            // Patient: regex principale (avec virgule + slash pour noms type "15841, Hilda")
            // S'arrête sur les notes (VIENT/POSE/RDV/POUR LE/LIVR), les libellés de champ
            // (Travail/Client/Docteur/Boîte) et tout nombre >=6 chiffres, pour ne PAS avaler
            // une note type "VIENT LE 120626" dans le nom patient.
            let matchPatient = text.match(/Patient\s+([A-Za-zÀ-ü0-9\s\-\.,\/]+?)(?=\s+(?:Âge|Age|Travail|Client|Docteur|Bo[îi]te|VIENT|POSE|RDV|POUR\s+LE|LIVR|\d{2}\/\d{2}\/\d{4}|\d{6,}|\-))/i);
            // Fallback: chercher le dernier bloc de mots avant "- - COULEUR"
            if (!matchPatient || nettoyer(matchPatient[1]) === "Inconnu") {
                const fallback = text.match(/([A-Za-zÀ-ü0-9\s\-\.,]{2,}?)\s+-\s+-\s+(?:WHITE|YELLOW|RED|BLUE|GREEN)/i);
                if (fallback) matchPatient = fallback;
            }
            let patient = matchPatient ? nettoyer(matchPatient[1]) : "Inconnu";
            // Nettoyer date de naissance collée au nom (ex: "Albanese G. 040269")
            patient = patient.replace(/\s*\d{6,8}\s*$/, '').trim() || patient;

            // UNE PHRASE À LA PLACE DU NOM (V28). Le 22/10, le Dr D. écrit une remarque
            // dans la case patient. Plus de 4 mots = une remarque, pas un nom (la règle de
            // LabCore, qui reprend alors le patient dans le PDF). On prévient seulement :
            // le nom du fichier ne change pas.
            const patientAVerifier = patient.split(/\s+/).filter(w => /[A-Za-zÀ-ü]{2,}/.test(w)).length > 4;

            const isChine = isClientChine(client);
            const suffixe = isChine ? "_CH" : "";

            // --- EXTRACTION BOÎTE, PRODUITS, DATE FINALISATION ---
            const matchBoite = text.match(/Bo[îi]te\s+(\w+)/i);
            const boite = matchBoite ? matchBoite[1].toUpperCase() : '';
            const boiteInfo = BOITE_JOURS[boite] || null;

            const matchFinalisation = text.match(/Date de finalisation souhait[ée]e?\s+(\d{2}\/\d{2}\/\d{4})/i);
            const dateFinalisation = matchFinalisation ? matchFinalisation[1] : '';

            // --- DÉTECTIONS ---
            const clips = clipDuBon(text, boite, dateFinalisation);
            const coherence = verifierCoherenceBoite(boite, dateFinalisation);

            // --- CONSTRUCTION POPUP (V29) ---
            // Tarek, 29/10 : « on peut améliorer le visuel ? ». Ce que Kathy doit savoir
            // à cet instant passe en premier, en grand : la BOÎTE (en français, avec la
            // sortie), puis le CLIP, étiqueté, puis la Chine. Le patient et le client
            // passent dessous. Rien ici ne touche au nom du fichier.
            const font = "'Segoe UI',system-ui,-apple-system,sans-serif";
            const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            const mSortie = dateFinalisation.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            const sortieTxt = mSortie
                ? `sortie ${JOURS_SEMAINE[new Date(+mSortie[3], +mSortie[2] - 1, +mSortie[1]).getDay()]} ${mSortie[1]}/${mSortie[2]}`
                : 'date de sortie absente du bon';
            // le numéro du bon dans la liste du jour (l'ordre d'impression)
            const dejaVu = getListe().find(e => e.id === matchID);
            const numero = dejaVu ? dejaVu.n : getListe().length + 1;

            let haut = '';
            // La Chine, d'abord : elle change tout le reste
            if (isChine) {
                haut += `
                    <div style="background:linear-gradient(135deg,#e67e22,#d35400); color:white; padding:12px 24px; font-weight:800; font-size:20px; letter-spacing:1px; text-align:center;">
                        🇨🇳 CLIENT CHINE
                    </div>`;
            }
            // La boîte, en grand
            const fondBoite = boiteInfo ? boiteInfo.couleurHex : '#7f8c8d';
            const encreBoite = boiteInfo ? boiteInfo.encre : '#ffffff';
            haut += `
                <div style="background:${fondBoite}; color:${encreBoite}; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; text-align:left;">
                    <div>
                        <div style="font-size:26px; font-weight:800; letter-spacing:0.5px; line-height:1.1;">BOÎTE ${boiteInfo ? boiteInfo.nomFr : '?'}</div>
                        <div style="font-size:15px; font-weight:600; margin-top:4px; opacity:0.9;">${sortieTxt}</div>
                    </div>
                    <div style="font-size:12px; font-weight:700; padding:6px 10px; border-radius:10px; background:rgba(0,0,0,0.15); white-space:nowrap;">Bon n° ${numero}</div>
                </div>`;
            // Le clip, étiqueté
            if (clips.besoinClips) {
                const ic = BOITE_JOURS[clips.couleurClips];
                haut += `
                    <div style="display:flex; align-items:center; gap:14px; padding:14px 24px; background:rgba(255,255,255,0.08); border-left:8px solid ${clips.hexClips}; text-align:left;">
                        <span style="display:inline-block; width:30px; height:30px; border-radius:8px; background:${clips.hexClips}; flex:none; box-shadow:0 0 0 2px rgba(255,255,255,0.25);"></span>
                        <div>
                            <div style="font-size:18px; font-weight:800;">Clip ${ic.nomFr} · ${ic.jour.toLowerCase()}</div>
                            <div style="font-size:12px; opacity:0.75; margin-top:2px;">${clips.raison}</div>
                        </div>
                    </div>`;
            }
            // La boîte ne va pas avec la date : quoi faire
            if (coherence) {
                haut += `
                    <div style="background:rgba(231,76,60,0.95); color:white; padding:10px 24px; font-size:13px; font-weight:600; text-align:left;">
                        ⚠️ ${coherence.message}
                    </div>`;
            }

            // Fond et bordure : orange pulsant pour Chine, glass normal sinon
            const popupBg = isChine
                ? 'background: linear-gradient(135deg, rgba(211,84,0,0.92), rgba(230,126,34,0.85));'
                : 'background: rgba(30,39,46,0.92);';
            const popupBorder = isChine
                ? 'border: 2px solid #e67e22; animation: v-fadeIn 0.35s ease, v-chinePulse 2s infinite;'
                : 'border: 1px solid rgba(255,255,255,0.12); animation: v-fadeIn 0.35s ease;';
            const touche = (t) => `<span style="font-size:10px; font-weight:600; opacity:0.55; margin-left:8px; padding:1px 5px; border:1px solid currentColor; border-radius:4px;">${t}</span>`;

            rideau.innerHTML = `
                <div style="
                    ${popupBg}
                    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    color:white; border-radius:24px; text-align:center;
                    font-family:${font}; width:440px; max-width:92vw;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                    ${popupBorder}
                    overflow:hidden;
                ">
                    ${haut}
                    <div style="padding:20px 24px 24px;">
                        <div style="background:rgba(${isChine ? '0,0,0,0.2' : '255,255,255,0.06'}); padding:14px 16px; border-radius:14px; margin-bottom:20px; text-align:left; line-height:1.6;">
                            <div style="font-size:16px; font-weight:600;">${patient}</div>
                            ${patientAVerifier ? '<div style="font-size:12px; color:#f39c12;">⚠️ Nom du patient inhabituel (une phrase ?) — vérifie sur le bon</div>' : ''}
                            <div style="font-size:13px; opacity:0.8;">${client}</div>
                            <div style="font-size:11px; opacity:0.5; margin-top:2px;">accepté le ${dateFichier.replace(/-/g, '/')}</div>
                            ${dejaVu ? `<div style="font-size:12px; color:#f39c12; margin-top:4px;">⚠️ Déjà téléchargé aujourd'hui à ${dejaVu.heure} (bon n° ${dejaVu.n}) — LabCore le verra comme un doublon</div>` : ''}
                        </div>
                        <div style="display:flex; gap:12px; justify-content:center;">
                            <button id="v-ok" class="v-btn-main" style="background:white; color:#1e272e; border:none; padding:14px 28px; font-weight:700; border-radius:50px; cursor:pointer; font-size:15px; font-family:${font}; transition:all 0.2s ease; letter-spacing:0.3px;">TÉLÉCHARGER${touche('Entrée')}</button>
                            <button id="v-no" class="v-btn-cancel" style="background:transparent; color:rgba(255,255,255,0.75); border:1.5px solid rgba(255,255,255,0.25); padding:14px 20px; border-radius:50px; cursor:pointer; font-size:14px; font-family:${font}; transition:all 0.2s ease;">ANNULER${touche('Échap')}</button>
                        </div>
                    </div>
                </div>`;

            // LE CLAVIER (V29) : Entrée = télécharger, Échap = annuler — un clic de moins
            // à chaque bon (une cinquantaine par jour).
            const auClavier = (e) => {
                if (e.key !== 'Enter' && e.key !== 'Escape') return;
                e.preventDefault(); e.stopPropagation();
                const b = document.getElementById(e.key === 'Enter' ? 'v-ok' : 'v-no');
                if (b) b.click();
            };
            document.addEventListener('keydown', auClavier, true);

            const fermerPopup = () => {
                document.removeEventListener('keydown', auClavier, true);
                rideau.style.opacity = '0';
                setTimeout(() => { rideau.remove(); alerteEnCours = false; }, 300);
            };

            document.getElementById('v-ok').onclick = () => {
                const blobUrl = URL.createObjectURL(blob);

                // 1. Déclenche le téléchargement
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${dateFichier}_${matchID}_${client}_${patient}${suffixe}.pdf`;
                link.click();

                // 2. Ouvre dans un nouvel onglet
                window.open(blobUrl, '_blank');
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

                // 3. Accumule pour l'export Excel
                if (boite) {
                    accumulerExcel(boite, { patient, client, id: matchID });
                    mettreAJourBadge();
                }

                // 4. La liste générale, dans l'ordre d'impression (V28)
                const maintenant = new Date();
                ajouterALaListe({ id: matchID, patient, client, boite, chine: isChine,
                                  heure: `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}`,
                                  clip: clips.besoinClips ? clips.couleurClips : '' });
                mettreAJourBadge();

                fermerPopup();
            };

            document.getElementById('v-no').onclick = fermerPopup;

        } catch (error) {
            console.error('Assistant Vevidental - erreur analyse:', error);
            rideau.remove(); alerteEnCours = false;
            alert(`Analyse impossible: ${error && error.message ? error.message : 'erreur inconnue'}`);
        }
    }

    // --- 4. BOUTON FLOTTANT EXPORT EXCEL ---
    function creerBoutonExport() {
        if (document.getElementById('v-excel-btn')) {
            mettreAJourBadge();
            return;
        }
        const font = "'Segoe UI',system-ui,-apple-system,sans-serif";
        const couleurs = ['WHITE','YELLOW','RED','BLUE','GREEN'];
        const container = document.createElement('div');
        container.id = 'v-excel-btn';
        Object.assign(container.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '99998',
            fontFamily: font, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'
        });

        // Menu (caché par défaut)
        const menu = document.createElement('div');
        menu.id = 'v-excel-menu';
        Object.assign(menu.style, {
            background: 'rgba(30,39,46,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '18px', padding: '16px', width: '260px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.12)', display: 'none',
            animation: 'v-fadeIn 0.25s ease'
        });

        let menuHTML = '<div style="color:rgba(255,255,255,0.5); font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Export par boîte · V' + VERSION_SCRIPT + '</div>';
        couleurs.forEach(c => {
            const info = BOITE_JOURS[c];
            menuHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="display:flex; align-items:center; gap:8px; color:white;">
                        <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${info.couleurHex};"></span>
                        <span style="font-size:13px;">${info.jour}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="v-cnt-${c}" style="color:rgba(255,255,255,0.6); font-size:13px; min-width:20px; text-align:right;">0</span>
                        <button id="v-dl-${c}" style="background:rgba(255,255,255,0.1); border:none; color:white; width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:14px; display:none; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">\u2B07</button>
                    </div>
                </div>`;
        });
        menuHTML += `
            <button id="v-liste-generale" style="width:100%; margin-top:14px; padding:10px; background:#f1c40f; color:#1e272e; border:none; border-radius:12px; font-weight:700; font-size:13px; cursor:pointer; font-family:${font};">
                LISTE GÉNÉRALE (<span id="v-liste-cnt">0</span>)
            </button>
            <button id="v-export-all" style="width:100%; margin-top:6px; padding:9px; background:transparent; color:white; border:1px solid rgba(255,255,255,0.35); border-radius:12px; font-weight:600; font-size:12px; cursor:pointer; font-family:${font};">
                EXPORTER TOUT (<span id="v-export-all-cnt">0</span>)
            </button>
            <button id="v-clear-today" style="width:100%; margin-top:6px; padding:8px; background:transparent; color:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-size:11px; cursor:pointer; font-family:${font}; transition:color 0.2s;" onmouseover="this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">
                EFFACER AUJOURD'HUI
            </button>`;
        menu.innerHTML = menuHTML;

        // Bouton principal
        const btn = document.createElement('div');
        Object.assign(btn.style, {
            background: 'rgba(30,39,46,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '50px', padding: '10px 18px', cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', gap: '10px', color: 'white',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease', userSelect: 'none'
        });
        btn.innerHTML = `
            <span style="font-size:16px;">\uD83D\uDCCA</span>
            <span style="font-size:13px; font-weight:600; letter-spacing:0.3px;">EXCEL</span>
            <span id="v-excel-badge" style="background:white; color:#1e272e; font-size:12px; font-weight:700; min-width:22px; height:22px; border-radius:11px; display:flex; align-items:center; justify-content:center; padding:0 6px;">0</span>
        `;
        btn.title = 'Assistant Vevidental V' + VERSION_SCRIPT;
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

        let menuOuvert = false;
        btn.onclick = () => {
            menuOuvert = !menuOuvert;
            menu.style.display = menuOuvert ? 'block' : 'none';
        };
        // un clic ailleurs referme le menu (V29)
        document.addEventListener('click', (e) => {
            if (menuOuvert && !container.contains(e.target)) {
                menuOuvert = false;
                menu.style.display = 'none';
            }
        });

        container.appendChild(menu);
        container.appendChild(btn);
        document.body.appendChild(container);

        // Event listeners pour les boutons du menu
        couleurs.forEach(c => {
            const dlBtn = document.getElementById(`v-dl-${c}`);
            if (dlBtn) dlBtn.onclick = (e) => { e.stopPropagation(); void genererExcel(c); };
        });
        document.getElementById('v-export-all').onclick = (e) => { e.stopPropagation(); exporterTout(); };
        document.getElementById('v-liste-generale').onclick = (e) => { e.stopPropagation(); void genererListeGenerale(); };
        document.getElementById('v-clear-today').onclick = (e) => {
            e.stopPropagation();
            if (confirm('Effacer toutes les données Excel d\'aujourd\'hui ?')) {
                effacerAujourdhui();
            }
        };

        // Mise à jour initiale
        mettreAJourBadge();
    }

    // --- 5. INITIALISATION ---
    // Injection CSS animations (global, une seule fois)
    if (!document.getElementById('v-anim-css')) {
        const cssAnim = document.createElement('style');
        cssAnim.id = 'v-anim-css';
        cssAnim.textContent = `
            @keyframes v-fadeIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
            @keyframes v-slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
            @keyframes v-pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
            @keyframes v-chinePulse { 0%,100% { box-shadow:0 0 20px rgba(230,126,34,0.4); } 50% { box-shadow:0 0 40px rgba(230,126,34,0.8); } }
            .v-btn-main:hover { transform:scale(1.05); box-shadow:0 5px 20px rgba(255,255,255,0.3) !important; }
            .v-btn-cancel:hover { background:rgba(255,255,255,0.15) !important; }
        `;
        document.head.appendChild(cssAnim);
    }

    nettoyerAnciennesDonnees();
    afficherRappelSiBesoin();
    creerBoutonExport();
    document.addEventListener('click', function(e) {
        const el = e.target.closest('a, button');
        if (!el) return;
        const texte = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^Bon de travail$/i.test(texte)) {
            e.preventDefault(); e.stopPropagation();
            analyserBonTravail(el);
        }
        if (/^(Créer et accepter|Sauvegarder les changements)$/i.test(texte)) {
            sessionStorage.setItem('rappelImprimer', 'true');
        }
    }, true);
})();
