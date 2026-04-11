// ==UserScript==
// @name         Vevidental - ASSISTANT PRIVÉ 25
// @version      24
// @updateURL    https://raw.githubusercontent.com/tarektt147-jpg/vevidental-assistant/main/content.js
// @downloadURL  https://raw.githubusercontent.com/tarektt147-jpg/vevidental-assistant/main/content.js
// @match        https://www.vevidental.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const INSTANCE_GLOBALE = '__vevidentalAssistantLuxV23Loaded';
    if (window[INSTANCE_GLOBALE]) return;
    window[INSTANCE_GLOBALE] = true;

    let alerteEnCours = false;

    // --- LISTE CLIENTS CHINE ---
    const CLIENTS_CHINE = [
        "DENTALNEXT",
        "DENTAL NEXT",
        "DENTAL-NEXT",
        "JUVISY GARE",
    ];

    // --- SYSTÈME BOÎTES / JOURS ---
    const BOITE_JOURS = {
        'WHITE':  { jour: 'Lundi',    precedent: 'GREEN',  emoji: '\u26AA', couleurHex: '#ecf0f1' },
        'YELLOW': { jour: 'Mardi',    precedent: 'WHITE',  emoji: '\uD83D\uDFE1', couleurHex: '#f1c40f' },
        'RED':    { jour: 'Mercredi', precedent: 'YELLOW', emoji: '\uD83D\uDD34', couleurHex: '#e74c3c' },
        'BLUE':   { jour: 'Jeudi',    precedent: 'RED',    emoji: '\uD83D\uDD35', couleurHex: '#3498db' },
        'GREEN':  { jour: 'Vendredi', precedent: 'BLUE',   emoji: '\uD83D\uDFE2', couleurHex: '#2ecc71' },
    };

    const JOUR_SEMAINE_TO_BOITE = { 1: 'WHITE', 2: 'YELLOW', 3: 'RED', 4: 'BLUE', 5: 'GREEN' };

    const MOTS_IMPLANT = ['implant', 'implantaat', 'ti-base', 'ti base', 'abutment', 'interface'];

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

    // --- DÉTECTION IMPLANT / GRAND BRIDGE / COHÉRENCE ---
    function detecterImplant(text) {
        const lower = text.toLowerCase();
        return MOTS_IMPLANT.some(mot => lower.includes(mot));
    }

    function detecterGrandBridge(text) {
        // Séparer par lignes/produits et ignorer CADTEMP
        const lignes = text.split(/(?=[A-Z]&[A-Z]\d|K&B\d)/);
        for (const ligne of lignes) {
            if (ligne.toUpperCase().includes('CADTEMP')) continue;
            const matchUnites = ligne.match(/(\d+)\s+\d[\d,\-]*/);
            if (matchUnites) {
                const nb = parseInt(matchUnites[1], 10);
                if (nb >= 6) return true;
            }
        }
        return false;
    }

    function getClipsInfo(boite, textProduits) {
        const boiteUpper = (boite || '').toUpperCase();
        const info = BOITE_JOURS[boiteUpper];
        if (!info) return { besoinClips: false };

        const isImplant = detecterImplant(textProduits);
        const isGrandBridge = detecterGrandBridge(textProduits);

        if (!isImplant && !isGrandBridge) return { besoinClips: false };

        const clipsCouleur = info.precedent;
        const clipsInfo = BOITE_JOURS[clipsCouleur];
        const raisons = [];
        if (isImplant) raisons.push('Implant');
        if (isGrandBridge) raisons.push('Bridge >= 6 el.');

        return {
            besoinClips: true,
            couleurClips: clipsCouleur,
            jourClips: clipsInfo.jour,
            emojiClips: clipsInfo.emoji,
            hexClips: clipsInfo.couleurHex,
            raison: raisons.join(' + ')
        };
    }

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
            message: `Boîte ${boiteUpper} (${info.jour}) mais finalisation un ${infoAttendue.jour} !`,
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
        mettreAJourBadge();
    }

    function nettoyerAnciennesDonnees() {
        const keys = Object.keys(localStorage);
        const now = new Date();
        keys.forEach(key => {
            if (!key.startsWith('vevidental_excel_')) return;
            const m = key.match(/vevidental_excel_(\d{4}-\d{2}-\d{2})_/);
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
        }
    }

    // --- 2. RAPPEL JAUNE (DESIGN LUX) ---
    function afficherRappelSiBesoin() {
        if (sessionStorage.getItem('rappelImprimer') === 'true') {
            sessionStorage.removeItem('rappelImprimer');
            const notification = document.createElement('div');
            Object.assign(notification.style, {
                position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: '#1e272e', color: 'white', padding: '15px 25px',
                borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: '100000', fontFamily: 'sans-serif', border: '1px solid #f1c40f', textAlign: 'center'
            });
            notification.innerHTML = `
                <div style="color:#f1c40f; font-weight:bold; margin-bottom:5px;">✨ MISE À JOUR RÉUSSIE</div>
                <div style="font-size:14px;">N'oubliez pas d'imprimer le Bon de travail.</div>
                <button id="n-ok" style="margin-top:10px; background:white; border:none; padding:5px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">COMPRIS</button>
            `;
            document.body.appendChild(notification);
            document.getElementById('n-ok').onclick = () => notification.remove();
            setTimeout(() => { if(notification) notification.remove(); }, 6000);
        }
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
            const pdf = await pdfjsLib.getDocument({data: await blob.arrayBuffer()}).promise;
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
            let matchPatient = text.match(/Patient\s+([A-Za-zÀ-ü0-9\s\-\.,\/]+?)(?=\s+(?:Âge|\d{2}\/\d{2}\/\d{4}|\-))/i);
            // Fallback: chercher le dernier bloc de mots avant "- - COULEUR"
            if (!matchPatient || nettoyer(matchPatient[1]) === "Inconnu") {
                const fallback = text.match(/([A-Za-zÀ-ü0-9\s\-\.,]{2,}?)\s+-\s+-\s+(?:WHITE|YELLOW|RED|BLUE|GREEN)/i);
                if (fallback) matchPatient = fallback;
            }
            const patient = matchPatient ? nettoyer(matchPatient[1]) : "Inconnu";

            const isChine = isClientChine(client);
            const suffixe = isChine ? "_CH" : "";

            // --- EXTRACTION BOÎTE, PRODUITS, DATE FINALISATION ---
            const matchBoite = text.match(/Bo[îi]te\s+(\w+)/i);
            const boite = matchBoite ? matchBoite[1].toUpperCase() : '';
            const boiteInfo = BOITE_JOURS[boite] || null;

            const matchFinalisation = text.match(/Date de finalisation souhait[ée]e?\s+(\d{2}\/\d{2}\/\d{4})/i);
            const dateFinalisation = matchFinalisation ? matchFinalisation[1] : '';

            // Extraire la zone produits pour analyse
            const zoneProduitsMatch = text.match(/Produit\s+Unit[ée]s\s+Dents\s+([\s\S]*?)(?=Essayages)/i);
            const texteProduits = zoneProduitsMatch ? zoneProduitsMatch[1] : text;

            // --- DÉTECTIONS ---
            const clips = getClipsInfo(boite, texteProduits);
            const coherence = verifierCoherenceBoite(boite, dateFinalisation);

            // --- CONSTRUCTION POPUP GLASSMORPHISM ---
            const boiteCouleur = boiteInfo ? boiteInfo.couleurHex : '#888';
            const font = "'Segoe UI',system-ui,-apple-system,sans-serif";

            let alertesHTML = '';

            // Bandeau Chine (gros, voyant, en haut)
            if (isChine) {
                alertesHTML += `
                    <div style="background:linear-gradient(135deg,#e67e22,#d35400); color:white; padding:16px 24px; border-radius:16px 16px 0 0; margin:-32px -32px 16px -32px; font-weight:700; animation:v-slideDown 0.4s ease; text-align:center;">
                        <div style="font-size:36px; margin-bottom:4px;">\uD83C\uDDE8\uD83C\uDDF3</div>
                        <div style="font-size:20px; letter-spacing:1px; text-transform:uppercase;">CLIENT CHINE</div>
                    </div>`;
            }

            // Alerte clips
            if (clips.besoinClips) {
                alertesHTML += `
                    <div style="background:${clips.hexClips}; color:#000; padding:14px 24px; border-radius:${isChine ? '0' : '16px 16px 0 0'}; margin:${isChine ? '-16px' : '-32px'} -32px 16px -32px; font-weight:600; animation:v-slideDown 0.4s ease;">
                        <div style="font-size:18px; letter-spacing:0.5px;">${clips.emojiClips} CLIPS ${clips.couleurClips} (${clips.jourClips})</div>
                        <div style="font-size:12px; margin-top:4px; opacity:0.7;">${clips.raison}</div>
                    </div>`;
            }

            // Alerte incohérence boîte
            if (coherence) {
                const hasAbove = isChine || clips.besoinClips;
                alertesHTML += `
                    <div style="background:rgba(231,76,60,0.95); color:white; padding:10px 24px; border-radius:${hasAbove ? '0' : '16px 16px 0 0'}; margin:${hasAbove ? '-16px' : '-32px'} -32px 16px -32px; animation:v-slideDown 0.5s ease;">
                        <div style="font-size:13px; font-weight:600;">ATTENTION - ${coherence.message}</div>
                    </div>`;
            }

            // Pastille boîte
            const boitePastille = boiteInfo
                ? `<div style="display:flex; align-items:center; gap:10px; margin-top:10px; padding:8px 12px; background:rgba(255,255,255,0.08); border-radius:10px; border-left:3px solid ${boiteCouleur};">
                       <span style="display:inline-block; width:28px; height:28px; border-radius:50%; background:${boiteCouleur}; box-shadow:0 0 12px ${boiteCouleur}80;"></span>
                       <span style="font-size:14px;"><b>${boite}</b> - ${boiteInfo.jour}</span>
                   </div>`
                : '';

            // Fond et bordure : orange pulsant pour Chine, glass normal sinon
            const popupBg = isChine
                ? 'background: linear-gradient(135deg, rgba(211,84,0,0.85), rgba(230,126,34,0.75));'
                : 'background: rgba(30,39,46,0.75);';
            const popupBorder = isChine
                ? 'border: 2px solid #e67e22; animation: v-fadeIn 0.35s ease, v-chinePulse 2s infinite;'
                : `border: 1px solid rgba(255,255,255,0.12); ${boiteInfo ? `border-top: 3px solid ${boiteCouleur};` : ''} animation: v-fadeIn 0.35s ease;`;

            rideau.innerHTML = `
                <div style="
                    ${popupBg}
                    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    color:white; padding:32px; border-radius:24px; text-align:center;
                    font-family:${font}; width:420px; max-width:90vw;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                    ${popupBorder}
                    overflow:hidden;
                ">
                    ${alertesHTML}
                    <div style="background:rgba(${isChine ? '0,0,0,0.2' : '255,255,255,0.06'}); padding:16px; border-radius:14px; margin-bottom:20px; text-align:left; font-size:14px; line-height:1.8;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="opacity:0.6; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Bon de travail</span>
                            <span style="font-size:12px; opacity:0.5;">${dateFichier}</span>
                        </div>
                        <div style="font-size:18px; font-weight:600; margin-bottom:4px;">${patient}</div>
                        <div style="font-size:13px; opacity:0.8;">${client}</div>
                        ${boitePastille}
                    </div>
                    <div style="display:flex; gap:12px; justify-content:center;">
                        <button id="v-ok" class="v-btn-main" style="background:white; color:#1e272e; border:none; padding:14px 32px; font-weight:700; border-radius:50px; cursor:pointer; font-size:15px; font-family:${font}; transition:all 0.2s ease; letter-spacing:0.3px;">TELECHARGER</button>
                        <button id="v-no" class="v-btn-cancel" style="background:transparent; color:rgba(255,255,255,0.7); border:1.5px solid rgba(255,255,255,0.25); padding:14px 22px; border-radius:50px; cursor:pointer; font-size:14px; font-family:${font}; transition:all 0.2s ease;">ANNULER</button>
                    </div>
                </div>`;

            const fermerPopup = () => {
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
        const emojis = { WHITE:'\u26AA', YELLOW:'\uD83D\uDFE1', RED:'\uD83D\uDD34', BLUE:'\uD83D\uDD35', GREEN:'\uD83D\uDFE2' };

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

        let menuHTML = '<div style="color:rgba(255,255,255,0.5); font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Export par boîte</div>';
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
            <button id="v-export-all" style="width:100%; margin-top:14px; padding:10px; background:white; color:#1e272e; border:none; border-radius:12px; font-weight:700; font-size:13px; cursor:pointer; font-family:${font}; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
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
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

        let menuOuvert = false;
        btn.onclick = () => {
            menuOuvert = !menuOuvert;
            menu.style.display = menuOuvert ? 'block' : 'none';
        };

        container.appendChild(menu);
        container.appendChild(btn);
        document.body.appendChild(container);

        // Event listeners pour les boutons du menu
        couleurs.forEach(c => {
            const dlBtn = document.getElementById(`v-dl-${c}`);
            if (dlBtn) dlBtn.onclick = (e) => { e.stopPropagation(); void genererExcel(c); };
        });
        document.getElementById('v-export-all').onclick = (e) => { e.stopPropagation(); exporterTout(); };
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
