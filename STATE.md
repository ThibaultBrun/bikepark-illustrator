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
1. [ ] **Export HD réel** : `exportImage()` (MapView.vue ~1998) fait juste `getCanvas().toDataURL()` = résolution écran, invendable en print. Render offscreen avec devicePixelRatio 3-4× sur la même caméra, attendre `idle`+`areTilesLoaded()`, puis toBlob. Prérequis de tout le print.
2. [ ] **Mode Poster** : composer l'export dans un canvas final (`src/lib/posterCompose.ts`) = bande titre (nom park+région depuis ExportPanel), cadre arrondi, **légende auto** (comptage par difficulté via PIN_COLORS + logos réellement posés depuis props.symbols), crédit, flèche nord + échelle. LE livrable vendable. (mockup HTML déjà fait, à porter en canvas.)
3. [ ] **Tracés peints** : casing blanc/liseré sous la ligne (2e addLayer dans ensureTrackLayers) + mode "couleur = difficulté" (PIN_COLORS). 80% de l'effet VMS, effort S. (MapView linePaintForTrack ~409)
4. [ ] **Canopée dense + ombres + variation** : plus d'arbres (densité adaptative au zoom), varier échelle/teinte par arbre, assombrir le fill forêt sous la canopée, ombre portée directionnelle alignée hillshade, 5-6 variantes de sprites. (illustratedCanopy.ts) — anti-sticker.
5. [ ] **Déclutter labels OSM** : virer suburb/neighbourhood (Lotissement…), garder town/village, toggle MapPanel. (illustratedBasemap label-village)

### Visuel VMS
6. [ ] Texture papier/pinceau sur le sol (overlay noise/paper en multiply léger).
7. [ ] Lumière golden hour sur relief (azimut bas, highlight doré, ombres froides) + slider angle soleil (applyHillshade).
8. [ ] Pastilles teardrop + tige + sous-segments 15a/15b (refreshTrailPins ~1136).
9. [ ] Modules 3D illustrés jumps/berms/pumptrack (zone asphalte + sprites iso) — gros wow, effort L, après que le poster se vende.
10. [ ] Typo display unie partout (pins/labels/légende/titre).
11. [ ] Liseré massifs + transition forêt/clairière adoucie.

### Produit vendable
12. [ ] Formats print + ratios (A4/A3/A2, insta, story) pilotant l'export HD (PrintPanel).
13. [ ] Export PDF print-ready (jspdf) au bon format + marges + titre/légende.
14. [ ] **Branding park** : upload logo + nom + couleur d'accent incrustés dans le cartouche (projectsStore).
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
