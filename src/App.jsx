// ============================================================
// src/App.jsx — Router principal Factur-X 2026
// Pages : Dashboard, Facture, Devis, Clients, Base de données
// ============================================================
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Building2,
  Database,
  Zap,
} from "lucide-react";

// ─── Chargement différé des pages ─────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const QuoteForm = lazy(() => import("./pages/QuoteForm"));
const CustomerList = lazy(() => import("./pages/CustomerList"));
const DatabaseManager = lazy(() => import("./pages/DatabaseManager"));

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

// ─── Définition des liens de navigation ───────────────────
const NAV_LINKS = [
  {
    to: "/dashboard",
    label: "Tableau de bord",
    short: "Bord",
    Icon: LayoutDashboard,
  },
  {
    to: "/facture/new",
    label: "Nouvelle facture",
    short: "Facture",
    Icon: FileText,
  },
  {
    to: "/devis/new",
    label: "Nouveau devis",
    short: "Devis",
    Icon: ClipboardList,
  },
  { to: "/clients", label: "Clients", short: "Clients", Icon: Building2 },
  { to: "/database", label: "Base données", short: "Base", Icon: Database },
];

// ═════════════════════════════════════════════════════════
// NAVIGATION
// ═════════════════════════════════════════════════════════
function Navigation() {
  return (
    <>
      {/* ══ DESKTOP : barre horizontale fixe en haut ══════ */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50
                      bg-white border-b border-gray-200 px-6 py-3
                      items-center gap-1 shadow-sm"
      >
        {/* Logo Factur-X 2026 */}
        <div className="flex items-center gap-2 mr-6 shrink-0">
          <div
            className="w-8 h-8 bg-emerald-600 rounded-lg
                          flex items-center justify-center shadow-sm"
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm leading-none">
              Factur-X
            </span>
            <span
              className="block text-[10px] text-emerald-600 font-semibold
                             leading-none mt-0.5"
            >
              2026
            </span>
          </div>
        </div>

        {/* Liens desktop */}
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            // isActive est true si l'URL commence par "to"
            // sauf pour dashboard (exact match)
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
               font-medium transition-colors whitespace-nowrap
               ${
                 isActive
                   ? "bg-emerald-50 text-emerald-700"
                   : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
               }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ══ MOBILE : en-tête fixe en haut ════════════════ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50
                         bg-white border-b border-gray-200
                         px-4 py-3 flex items-center gap-2.5 shadow-sm"
      >
        <div
          className="w-7 h-7 bg-emerald-600 rounded-lg
                        flex items-center justify-center"
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-base">Factur-X</span>
        <span
          className="text-xs bg-emerald-100 text-emerald-700
                         px-2 py-0.5 rounded-full font-semibold"
        >
          2026
        </span>
      </header>

      {/* ══ MOBILE : barre de navigation fixe en bas ═════
          Pattern "Bottom Navigation Bar" — standard mobile
          5 onglets : Bord | Facture | Devis | Clients | Base
      ══════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white border-t border-gray-200 flex
                      pb-safe"
      >
        {NAV_LINKS.map(({ to, short, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center
               gap-0.5 py-2 text-[10px] font-medium transition-colors
               min-w-0
               ${
                 isActive
                   ? "text-emerald-600"
                   : "text-gray-500 hover:text-gray-700"
               }`
            }
          >
            <Icon size={19} />
            <span className="leading-tight truncate px-1">{short}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

// ═════════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ═════════════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Navigation />

      {/*
        Conteneur principal.
        Padding-top  : espace pour la barre du haut
          mobile  → pt-14 (56px)
          desktop → md:pt-16 (64px)
        Padding-bottom : espace pour la bottom nav mobile
          mobile  → pb-20 (80px)
          desktop → md:pb-6
      */}
      <main
        className="pt-14 pb-20 md:pt-16 md:pb-6
                       min-h-screen bg-gray-50"
      >
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Redirection racine → dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Tableau de bord */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Factures — création et édition */}
            <Route path="/facture/new" element={<InvoiceForm />} />
            <Route path="/facture/:id" element={<InvoiceForm />} />

            {/* Devis — création et édition */}
            <Route path="/devis/new" element={<QuoteForm />} />
            <Route path="/devis/:id" element={<QuoteForm />} />

            {/* Clients et Émetteurs — CRUD complet */}
            <Route path="/clients" element={<CustomerList />} />

            {/* Gestion et visualisation de la base SQLite */}
            <Route path="/database" element={<DatabaseManager />} />

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
