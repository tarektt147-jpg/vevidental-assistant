// V28 — LE CLIP DE LABCORE, LA LISTE GÉNÉRALE, LE RAPPEL (28/10/2026)
//
//   node test_v28.js
//
// Ce test EXÉCUTE les vraies fonctions de content.js sur des bons inventés (aucun
// patient réel). La comparaison avec LabCore sur les vrais bons se fait à part, sur
// le Mac de Tarek (les bons ne quittent jamais la machine).
const fs = require('fs'), path = require('path');
let ok = 0, ko = 0;
function check(l, c, det) {
  if (c) { ok++; console.log('  ✅ ' + l); } else { ko++; console.log('  ❌ ' + l + (det ? '   ' + det : '')); }
}
const JS = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const tr = (a, b) => { const i = JS.indexOf(a), j = JS.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('introuvable : ' + a); return JS.slice(i, j); };

// ── le clip : les blocs « boîtes » + « règles LabCore » ──
const { clipDuBon, compterBon } = new Function(tr('// --- SYSTÈME BOÎTES / JOURS ---', '// --- 1. CHARGEMENT PDF.JS')
  + '\nreturn { clipDuBon, compterBon };')();
const bon = (produits, dk, boite = 'BLUE') =>
  `Travail 123 Client 1 - Dr Essai - Be Docteur X Patient Martin Paul Âge 40 Boîte ${boite} `
  + `Produit Unités Dents ${produits} Essayages - Date de finalisation souhaitée ${dk}`;
const ZR = (n, dents) => `C&B100 - Couronne Zircone VITA MT ${n} ${dents}`;

console.log('① Les éléments, comptés comme LabCore');
let c = compterBon(bon(ZR(3, '14-16') + ' C&B700 - Embase Titane 1 26 C&B900 - Collage interface 1 26 3D001 - Modèle imprimé 1 -', '29/10/2026'));
check('3 zircone + 1 modèle = 4 ; l\'embase et le collage ne comptent pas', c.total === 4 && c.zircone === 3, JSON.stringify(c));
check('1 collage = un cas implant', c.collages === 1);
c = compterBon(bon(ZR(1, '21') + ' 01.010 - Embase Titane Nobel Biocare Original 1 21 01.0011 - Collage 1 21', '29/10/2026'));
check('les nouveaux codes : embase 01.010 = 0, collage 01.0011 = implant', c.total === 1 && c.collages === 1, JSON.stringify(c));
c = compterBon(bon('PA005 - Stellite + dents 11 11-17', '29/10/2026'));
check('un stellite de 11 dents = 1 pièce', c.total === 1, JSON.stringify(c));

console.log('② Le clip (sortie jeudi 29/10/2026, boîte BLEUE)');
let k = clipDuBon(bon(ZR(1, '21'), '29/10/2026'), 'BLUE', '29/10/2026');
check('1 couronne : pas de clip', !k.besoinClips);
k = clipDuBon(bon(ZR(1, '21') + ' C&B900 - Collage interface 1 21', '29/10/2026'), 'BLUE', '29/10/2026');
check('implant : clip ROUGE (mercredi, la veille)', k.besoinClips && k.couleurClips === 'RED', JSON.stringify(k));
k = clipDuBon(bon(ZR(3, '14-16') + ' C&B1302 - Inlay core 3 24-26', '29/10/2026'), 'BLUE', '29/10/2026');
check('3 zircone + 3 inlay cores = 6 él. : clip (le V27 n\'en mettait pas)', k.besoinClips && k.couleurClips === 'RED', JSON.stringify(k));
k = clipDuBon(bon(ZR(12, '14-24'), '29/10/2026'), 'BLUE', '29/10/2026');
check('bridge zircone de 12 : 2 jours d\'avance → clip JAUNE (mardi)', k.besoinClips && k.couleurClips === 'YELLOW' && k.avance === 2, JSON.stringify(k));
k = clipDuBon(bon(ZR(10, '14-23'), '29/10/2026'), 'BLUE', '29/10/2026');
check('bridge zircone de 10 : 1 jour → ROUGE', k.couleurClips === 'RED' && k.avance === 1);
console.log('③ Les jours fériés belges');
k = clipDuBon(bon(ZR(1, '21') + ' C&B900 - Collage interface 1 21', '12/11/2026'), 'BLUE', '12/11/2026');
check('sortie jeudi 12/11, le 11/11 est férié → clip JAUNE (mardi 10/11)', k.couleurClips === 'YELLOW', JSON.stringify(k));
k = clipDuBon(bon(ZR(1, '21') + ' C&B900 - Collage interface 1 21', '02/11/2026'), 'WHITE', '02/11/2026');
check('sortie lundi 02/11 → clip VERT (le vendredi d\'avant)', k.couleurClips === 'GREEN');
k = clipDuBon(bon(ZR(1, '21') + ' C&B900 - Collage interface 1 21', '- -'), 'BLUE', '');
check('pas de date de sortie : la boîte décide (BLEUE → ROUGE)', k.couleurClips === 'RED');

console.log('④ La liste générale, dans l\'ordre d\'impression');
const stock = {};
global.localStorage = { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); },
                        removeItem: (k) => { delete stock[k]; } };
global.alert = () => {};
let feuille = null;
global.window = { XLSX: { utils: { aoa_to_sheet: (aoa) => { feuille = aoa; return {}; }, book_new: () => ({}),
                                   book_append_sheet: () => {} }, writeFile: (wb, nom) => { feuille.nom = nom; } } };
const L = new Function('BOITE_JOURS', 'xlsxReadyPromise',
  tr('    function getDateLocaleISO()', '    function nettoyer(t)')
  + tr('    // LA LISTE GÉNÉRALE', '    function getTotalAujourdhui()')
  + '\nreturn { ajouterALaListe, getListe, genererListeGenerale };')(
  { WHITE: { jour: 'Lundi' }, BLUE: { jour: 'Jeudi' }, RED: { jour: 'Mercredi' } }, Promise.resolve());
L.ajouterALaListe({ id: 'A', patient: 'P1', client: 'C1', boite: 'BLUE', heure: '08:01', clip: 'RED', chine: false });
L.ajouterALaListe({ id: 'B', patient: 'P2', client: 'C2', boite: 'WHITE', heure: '08:05', clip: '', chine: true });
L.ajouterALaListe({ id: 'A', patient: 'P1', client: 'C1', boite: 'BLUE', heure: '09:30', clip: 'RED', chine: false });
check('deux bons, le retéléchargé garde sa place', L.getListe().map(e => e.n + e.id).join(',') === '1A,2B');
(async () => {
  await L.genererListeGenerale();
  check('l\'Excel : N°, Heure, Patient, Client, Boîte, Clip, Chine',
        feuille && feuille[0].join('|') === 'N°|Heure|Patient|Client|Boîte|Clip|Chine', feuille && feuille[0].join('|'));
  check('… une ligne par bon, dans l\'ordre', feuille && feuille[1].join('|') === '1|08:01|P1|C1|BLUE (Jeudi)|RED (Mercredi)|'
        && feuille[2].join('|') === '2|08:05|P2|C2|WHITE (Lundi)||Chine', feuille && feuille.slice(1).map(r => r.join('|')).join(' / '));
  check('… nommé Liste_generale_<date>.xlsx', feuille && /^Liste_generale_\d{4}-\d{2}-\d{2}\.xlsx$/.test(feuille.nom));
  check('le bouton est dans le menu, et « Effacer aujourd\'hui » vide aussi la liste',
        /id="v-liste-generale"/.test(JS) && /localStorage\.removeItem\(getListeKey\(\)\)/.test(JS));

  console.log('⑤ Le reste');
  check('le rappel dit « N\'oublie pas de télécharger le bon. »', JS.includes("N'oublie pas de télécharger le bon.")
        && !JS.includes("N'oubliez pas d'imprimer"));
  check('la version affichée = @version', /@version\s+(\d+)/.exec(JS)[1] === /VERSION_SCRIPT = (\d+)/.exec(JS)[1]);
  check('la parade du lecteur PDF est posée', /getDocument\(\{data: await blob\.arrayBuffer\(\), isEvalSupported: false\}\)/.test(JS));
  check('le nom du fichier n\'a pas changé', JS.includes('link.download = `${dateFichier}_${matchID}_${client}_${patient}${suffixe}.pdf`;'));
  check('les règles viennent de LabCore (bloc généré)', /\/\/ >>> RÈGLES LABCORE \(générées[\s\S]*const R = \{[\s\S]*\/\/ <<< FIN RÈGLES LABCORE/.test(JS));

  console.log(`\n${ok} OK · ${ko} ÉCHEC(S)`);
  process.exit(ko ? 1 : 0);
})();
