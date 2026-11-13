# STATE — Refonte Bikepark Illustrator → outil pro vendable aux bikeparks

Objectif : carte de bikepark **illustrée façon visionmapsstudio** (poster 2.5D), mais générée
100% par code (gratuit/reproductible), de qualité **professionnelle et vendable** aux exploitants
de bikeparks. Boucle de dev autonome : à chaque feature finie → agent de revue → on améliore.

Préprod (déploiement de la boucle) : https://illustrator.tbrun.dev (rsync `dist/` → `/srv/www/illustrator/`).
Prod (manuelle, validée par Thibault) : illustrator.pista.bike (CF Pages, `npx wrangler pages deploy dist --project-name=pista-illustrator`).
Build : `cd /home/debian/repos/bikepark-illustrator && npm run build`.

## FAIT
- [x] Fond **"Illustré"** (bouton 3e fond) — vecto OpenMapTiles/OpenFreeMap + palette poster + relief 2.5D. `src/lib/illustratedBasemap.ts`
- [x] **Canopée** (arbres dessinés scatter dans les forêts). `src/lib/illustratedCanopy.ts`
- [x] Palette validée (tan sablé chaud #dcc89f, forêt vert profond, eau bleue)
- [x] **18 logos** park (features piste + équipements : parking/remontée/navette/eau/resto/wc/secours/table/pumptrack/atelier/accueil/boutique). `src/types/symbol.ts`
- [x] **Pastilles numérotées** par difficulté aux départs de piste. (MapView `refreshTrailPins`)

## EN COURS / BACKLOG (priorisé par la revue 2026-11-13, du + rentable au -)
Mockup north-star validé visuellement : /tmp/illus-test/poster.png (cadre+titre+stats+légende+logos+pistes casing+pins). On construit vers ça.

### TOP (quick wins ROI max — à faire d'abord)
1. [x] **Export HD réel** : `exportImage()` → `setPixelRatio(3)` + attente `idle`+`areTilesLoaded` + `canvas.toBlob`. Toast "Rendu HD…" pendant le calcul. Prérequis de tout le print. ✅ 2026-11-13
2. [x] **Mode Poster** : `posterCompose.ts` — canvas 1080px : header (nom park+région+badges stats), carte arrondie, légende diff+chips équipements, footer crédit. Bouton "🎨 Exporter Poster" dans PrintPanel. projectName/spotRegion auto-remplis depuis le projet. ✅ 2026-11-13
3. [x] **Tracés peints** : casing blanc/liseré sous la ligne (2e addLayer dans ensureTrackLayers) + mode "couleur = difficulté" (PIN_COLORS). 80% de l'effet VMS, effort S. ✅ 2026-11-13
4. [x] **Canopée dense + ombres + variation** : 6 espèces (round/dark/pine/spruce/autumn/cluster) × 3 teintes = 18 images ; densité adaptative zoom (25%→100%, grille 85→200, max 1200→5000 arbres) ; ombre portée directionnelle SE cohérente hillshade ; rotation ±9° anti-sticker ; bbox pré-filtre O(polys) pour perf. ✅ 2026-11-13
5. [x] **Déclutter labels OSM** : suburb/neighbourhood virés du filtre label-village (town/village/hamlet seulement) + toggle MapPanel "Labels OSM" (showOsmLabels, 4 langues). ✅ 2026-11-13

### Visuel VMS
5bis. [ ] **Fond vecteur maison** (demandé par Thibault 2026-11-13) : style vecto perso pour l'illustrator au lieu de dépendre d'OpenFreeMap — sources OpenMapTiles/tuiles maison, glyphs/sprites servis en propre, palette poster tan #dcc89f + forêt profonde cohérente avec le fond Illustré. Objectif : DA 100% contrôlée + offline-friendly. ⚠️ PAS de courbes de niveau (rejetées, moches — cf. fond Pista Topo). S'appuyer sur illustratedBasemap.ts qui fait déjà le style ; cette tâche = héberger/maîtriser la source de tuiles plutôt que le CDN tiers.
6. [x] **Texture grain papier** : overlay noise chaud bi-tonique (crème/brun) en globalCompositeOperation multiply — `src/lib/paperTexture.ts` (PRNG déterministe, tuile 256px, opacité variable px par px) ; appliqué dans posterCompose (strength 22%) + overlay CSS mix-blend-mode:multiply sur la carte live (mode illustré uniquement). ✅ 2026-11-13
7. [x] **Lumière golden hour** : slider azimut 0–359° dans MapPanel (cardinal SO/NO…) ; `hillshade-illumination-direction` pilotable ; en mode illustré : highlight doré `rgba(255,218,110)`, ombre froide `rgba(42,52,90)`, accent brun-bleu. Appliqué au switch basemap + watch. i18n 4 langues. ✅ 2026-11-13
8. [ ] Pastilles teardrop + tige + sous-segments 15a/15b (refreshTrailPins ~1136).
9. [ ] Modules 3D illustrés jumps/berms/pumptrack (zone asphalte + sprites iso) — gros wow, effort L, après que le poster se vende.
10. [ ] Typo display unie partout (pins/labels/légende/titre).
11. [ ] Liseré massifs + transition forêt/clairière adoucie.

### Produit vendable
12. [ ] Formats print + ratios (A4/A3/A2, insta, story) pilotant l'export HD (PrintPanel).
13. [ ] Export PDF print-ready (jspdf) au bon format + marges + titre/légende.
14. [ ] **Branding park** : upload logo + nom + couleur d'accent incrustés dans le cartouche (projectsStore). ⚠️ Thibault 2026-11-13 : **champs dédiés pré-remplis avec le nom du projet par défaut** — le titre poster / nom du park doivent se remplir tout seuls depuis le nom du projet courant (projectsStore.currentName), éditables ensuite. Pas de champ vide à remplir à la main.
15. [ ] Page publique poster plein écran + download + **QR code** (panneau au départ). Base visibility/copyLink déjà là (ExportPanel).
16. [ ] Widget embed iframe vers la page publique.
17. [ ] Export légende seule (PNG/PDF) pour panneau d'accueil.
18. [ ] Grand format multi-tuiles A0 (si demande réelle).

### UX / perf
19. [ ] Perf canopée : scatter O(N²) → index spatial / bbox par poly, debounce, plafond selon aire (avant de densifier #4).
20. [ ] `preserveDrawingBuffer` conditionnel (coût perf constant, sert qu'à l'export → off si render offscreen).
21. [ ] Nettoyage bundle : virer terra-draw, lazy-load panneaux lourds (1.7MB).
22. [ ] Habillage éditeur aligné DA + onboarding (useTour : importer GPX → styliser → exporter poster).
23. [ ] Presets de style 1-clic (Poster chaud / Forêt / Alpin).
24. [ ] Logos : revoir Jump+Remontée, ajouter lavage vélo/aire enfants/abri/école.
25. [ ] QA export : attendre idle + areTilesLoaded avant capture (anti-poster à trous).

## GARDE-FOUS BOUCLE
- Déployer uniquement en **préprod** dans la boucle ; prod = validation Thibault.
- 1 tâche ciblée par réveil, build OK obligatoire avant rsync.
- Commits : pas de trailer Co-Authored-By ; dater fenêtre nuit 22h–01h Europe/Paris ; push seulement sur demande ou quand STATE jalon atteint.
- Après une feature : lancer un agent de revue (critique + backlog d'amélioration), réinjecter dans ce fichier.
- Poster un court récap dans #bikepark-illustrator à chaque jalon ; s'arrêter si Thibault dit stop.

## JOURNAL
- 2026-11-13 : basemap illustré + canopée + palette tan + 18 logos + pastilles numérotées (préprod). Boucle autonome armée.
- 2026-11-13 : mockup north-star poster validé (poster.png). Agent de revue → backlog repriorisé ci-dessus (TOP = export HD, mode poster, tracés casing, canopée dense, déclutter labels). Cap confirmé par Thibault : "pro/sexy/contemporain comme visionmapsstudio, voire en avance".
- 2026-11-13 : Thibault confirme la boucle d'autonomie longue (jusqu'au produit FINI : modules 3D + catalogue, repris d'une session de tokens à l'autre). Cron `bikepark-illustrator-dev-loop` réparé (plantait sur toolsAllow en agentTurn) → repassé en `main`+`systemEvent` (tour complet, tous outils), réveil /30min. WIP fond illustré+canopée+logos committé (b0e37dd) + déployé préprod.
- 2026-11-13 : **Export HD réel** (BACKLOG #1) — `setPixelRatio(3)` + idle/areTilesLoaded + toBlob + toast "Rendu HD…". Build OK, déployé préprod. PROCHAINE TÂCHE = BACKLOG TOP #2 Mode Poster.
- 2026-11-13 : **Mode Poster** (BACKLOG #2) — `posterCompose.ts` canvas composé : header nom+région+badges stats, carte arrondie avec border, légende diff auto, chips équipements, footer crédit. PrintPanel bouton 🎨. Build OK, déployé préprod.
- 2026-11-13 : **Tracés peints** (BACKLOG #3) — `lineCasingPaintForTrack()` (blanc/crème +3px sous la ligne) + `effectiveTrackColor()` (couleur difficulté en mode illustré via PIN_COLORS green/blue/red/black). Casing géré dans ensureTrackLayers, rebuildTrackLineLayer, setTrackLayersVisible, removeDeletedTrackLayers. Refresh auto couleur au switch basemap. Build OK, déployé préprod. PROCHAINE TÂCHE = BACKLOG TOP #4 Canopée dense.
- 2026-11-13 : **Canopée dense + variation** (BACKLOG #4) — 6 espèces × 3 teintes = 18 images ; densité adaptative zoom ; ombre directionnelle SE ; rotation ±9° anti-sticker ; pré-filtre bbox polygones. Build OK, déployé préprod. PROCHAINE TÂCHE = BACKLOG #5 Déclutter labels OSM.
- 2026-11-13 : **Déclutter labels OSM** (BACKLOG #5) — suburb/neighbourhood virés du filtre label-village ; toggle "Labels OSM" dans MapPanel (showOsmLabels, 4 langues) + watcher MapView sur illus-label-village/peak/water. Build OK, déployé préprod.
- 2026-11-13 : **Texture grain papier** (BACKLOG #6) — `paperTexture.ts` (PRNG mulberry32, bi-tonique crème/brun, opacité px variable) ; appliqué en multiply dans posterCompose (22%) + overlay CSS sur la carte live mode illustré (mix-blend-mode:multiply, 55%). Build OK, déployé préprod.
- 2026-11-13 : **Lumière golden hour** (BACKLOG #7) — slider azimut soleil 0–359° MapPanel, cardinal affiché (N/NE/E/SE/S/SO/O/NO) ; hillshade-illumination-direction + couleurs mode illustré (highlight doré rgba(255,218,110), ombre froide rgba(42,52,90)) ; neutre sur les autres fonds. Build OK, déployé préprod. PROCHAINE TÂCHE = BACKLOG #8 Pastilles teardrop.
