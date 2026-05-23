// ============================================================
// src/index.js — Point d'entrée React 18
//
// CORRECTIONS APPLIQUÉES :
// 1. AuthProvider déjà intégré dans App.jsx (pas en double ici)
// 2. Suppression de reportWebVitals (cause erreur Module not found)
// 3. React 18 createRoot (remplace l'ancien ReactDOM.render)
// 4. StrictMode activé pour détecter les problèmes en dev
// ============================================================
import React from "react";
import ReactDOM from "react-dom/client";

// Styles globaux — DOIT être importé avant App
// Contient les 3 directives Tailwind (@tailwind base/components/utilities)
// + les variables CSS + le fix zoom iOS
import "./index.css";

// Composant racine — contient AuthProvider + BrowserRouter + Routes
import App from "./App";

// ─── Point de montage React ───────────────────────────────
// React 18 : createRoot remplace ReactDOM.render (déprécié)
// Le div#root est défini dans public/index.html
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // StrictMode :
  // — Détecte les effets de bord non intentionnels
  // — Avertit sur les APIs dépréciées
  // — Double les renders en développement (normal, pas en prod)
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ─── NOTE sur reportWebVitals ─────────────────────────────
// Le fichier reportWebVitals.js a été supprimé lors du nettoyage
// initial (rm src/reportWebVitals.js).
// Si vous souhaitez mesurer les performances, réinstallez :
//   npm install web-vitals
// puis décommentez :
// import reportWebVitals from './reportWebVitals';
// reportWebVitals(console.log);
