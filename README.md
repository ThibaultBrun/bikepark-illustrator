# 🚵 Bikepark Illustrator

Application web **100% frontend** permettant de créer des visuels de bikeparks en combinant :

- fond de carte (satellite / OSM)
- relief 3D
- traces GPX stylisées
- labels personnalisés
- (à venir) symboles et export impression

👉 Déployable facilement sur **GitHub Pages**

---

## ✨ Fonctionnalités

### 🗺️ Carte
- MapLibre GL JS
- Fond **ESRI Satellite** ou **OpenStreetMap**
- Relief 3D (DEM)
- Ombrage terrain (hillshade)
- Exagération du relief (slider x1 → x10)

---

### 📍 GPX
- Import de fichiers `.gpx`
- Conversion en GeoJSON
- Affichage sur la carte

#### Styles disponibles
- Couleur
- Épaisseur
- Type de ligne :
  - plein
  - pointillé
  - points

---

### 🏷️ Labels
- Générés automatiquement sur les traces
- Toujours :
  - horizontaux
  - lisibles
  - face à l’écran (même en 3D)

#### ✨ Bonus
- **Déplacement manuel des labels (drag & drop)**

---

## 🧱 Stack technique

- ⚡ Vite
- 🟢 Vue 3 (Composition API + TS)
- 🗺️ MapLibre GL
- 📦 togeojson (conversion GPX)

---

## 🚀 Installation

```bash
npm install
npm run dev