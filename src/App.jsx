import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LayoutDashboard, FileText, ClipboardList, Zap } from "lucide-react";
// ============================================================
// src/App.jsx — Router principal de l'application Factur-X 2026
// Navigation mobile-first : bottom nav sur mobile, top nav sur desktop
// ============================================================

// ─── Chargement différé des pages (code splitting) ────────
// Réduit le bundle initial — chaque page n'est chargée
// que lors de la première navigation vers elle.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const QuoteForm = lazy(() => import("./pages/QuoteForm"));

// ─── Spinner de chargement ────────────────────────────────
const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div
        className="animate-spin rounded-full h-10 w-10
                      border-4 border-emerald-600 border-t-transparent"
      />
      <p className="text-sm text-gray-500 font-medium">Chargement…</p>
    </div>
  </div>
);

// ─── Liens de navigation ──────────────────────────────────
const NAV_LINKS = [
  { to: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { to: "/facture/new", label: "Nouvelle facture", Icon: FileText },
  { to: "/devis/new", label: "Nouveau devis", Icon: ClipboardList },
];

// ─── Navigation principale ────────────────────────────────
function Navigation() {
  return (
    <>
      {/* ══ DESKTOP : barre horizontale en haut ══════════ */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50
                      bg-white border-b border-gray-200 px-6 py-3
                      items-center gap-2 shadow-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <Zap size={20} className="text-emerald-600" />
          <span className="font-bold text-gray-900 text-base">Factur-X</span>
          <span
            className="text-xs bg-emerald-100 text-emerald-700
                           px-2 py-0.5 rounded-full font-semibold"
          >
            2026
          </span>
        </div>

        {/* Liens */}
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm
               font-medium transition-colors
               ${
                 isActive
                   ? "bg-emerald-50 text-emerald-700"
                   : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
               }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ══ MOBILE : en-tête en haut ══════════════════════ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50
                         bg-white border-b border-gray-200
                         px-4 py-3 flex items-center gap-2 shadow-sm"
      >
        <Zap size={18} className="text-emerald-600" />
        <span className="font-bold text-gray-900 text-base">Factur-X</span>
        <span
          className="text-xs bg-emerald-100 text-emerald-700
                         px-2 py-0.5 rounded-full font-semibold ml-1"
        >
          2026
        </span>
      </header>

      {/* ══ MOBILE : barre de navigation en bas ══════════ */}
      {/* Pattern "bottom nav" — standard des apps mobiles  */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white border-t border-gray-200
                      flex safe-bottom"
      >
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center
               gap-1 py-2 text-xs font-medium transition-colors
               ${isActive ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"}`
            }
          >
            <Icon size={20} />
            {/* Sur mobile, on affiche uniquement le premier mot */}
            <span className="leading-tight">{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

// ─── Application principale ───────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Navigation />

      {/*
        Conteneur principal.
        pt-14   → espace pour l'en-tête mobile (56px)
        pb-20   → espace pour la bottom nav mobile (80px)
        md:pt-16 → espace pour la barre desktop (64px)
        md:pb-6  → pas de bottom nav sur desktop
      */}
      <main
        className="pt-14 pb-20 md:pt-16 md:pb-6
                       min-h-screen bg-gray-50"
      >
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Redirection de la racine vers le dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Mode création + mode édition pour les factures */}
            <Route path="/facture/new" element={<InvoiceForm />} />
            <Route path="/facture/:id" element={<InvoiceForm />} />
            {/* Mode création + mode édition pour les devis */}
            <Route path="/devis/new" element={<QuoteForm />} />
            <Route path="/devis/:id" element={<QuoteForm />} />
            {/* Route 404 → retour au dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* ─── Notifications toast globales ─────────────── */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          loading: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  );
}
