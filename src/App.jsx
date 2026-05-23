// ============================================================
// src/App.jsx — Router principal Factur-X 2026
// MISE À JOUR : Routes protégées JWT + rôles
//
// Structure des routes :
// — Routes publiques  : /login, /forgot-password
// — Routes protégées  : toutes les autres (token JWT requis)
// — Routes Admin only : /users (rôle Administrateur requis)
// ============================================================
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Building2,
  Database,
  Zap,
  Users,
  LogOut,
  ShieldCheck,
  ChevronDown,
  User,
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ─── Chargement différé des pages ─────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const QuoteForm = lazy(() => import("./pages/QuoteForm"));
const CustomerList = lazy(() => import("./pages/CustomerList"));
const DatabaseManager = lazy(() => import("./pages/DatabaseManager"));
const UserManager = lazy(() => import("./pages/UserManager"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPasswordPage"));

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

// ═════════════════════════════════════════════════════════
// GARDE DE ROUTE — Redirige vers /login si non connecté
// ═════════════════════════════════════════════════════════
function RequireAuth({ children }) {
  const { estConnecte, loading } = useAuth();
  const location = useLocation();

  // Attendre que le contexte charge (vérification token)
  if (loading) return <Loader />;

  // Non connecté → rediriger vers login
  // On garde l'URL cible pour y revenir après connexion
  if (!estConnecte) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ═════════════════════════════════════════════════════════
// GARDE DE ROUTE ADMIN — Redirige si pas Administrateur
// ═════════════════════════════════════════════════════════
function RequireAdmin({ children }) {
  const { estAdmin, estConnecte, loading } = useAuth();

  if (loading) return <Loader />;

  if (!estConnecte) return <Navigate to="/login" replace />;

  if (!estAdmin) {
    return (
      <div
        className="flex items-center justify-center min-h-screen
                      bg-gray-50 px-4"
      >
        <div
          className="bg-white rounded-2xl border border-red-200
                        p-8 text-center max-w-md shadow-sm"
        >
          <div
            className="w-16 h-16 bg-red-100 rounded-full
                          flex items-center justify-center mx-auto mb-4"
          >
            <ShieldCheck size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-500 text-sm mb-6">
            Cette page est réservée aux <strong>Administrateurs</strong>.
            Contactez votre administrateur pour obtenir les droits.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200
                       rounded-xl text-gray-700 font-medium text-sm
                       transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// ═════════════════════════════════════════════════════════
// NAVIGATION — Barre avec info utilisateur connecté
// ═════════════════════════════════════════════════════════

// Liens de navigation principale
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

function Navigation() {
  const { user, logout, estAdmin } = useAuth();
  const [menuUser, setMenuUser] = React.useState(false);

  return (
    <>
      {/* ══ DESKTOP ══ */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50
                      bg-white border-b border-gray-200 px-4 py-2.5
                      items-center gap-1 shadow-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 shrink-0">
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
              className="block text-[10px] text-emerald-600
                             font-semibold leading-none mt-0.5"
            >
              2026
            </span>
          </div>
        </div>

        {/* Liens desktop — end={true} sur tous pour éviter les matches partiels */}
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
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

        {/* Lien Utilisateurs (Admin seulement) */}
        {estAdmin && (
          <NavLink
            to="/users"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
               font-medium transition-colors whitespace-nowrap
               ${
                 isActive
                   ? "bg-purple-50 text-purple-700"
                   : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
               }`
            }
          >
            <Users size={15} /> Utilisateurs
          </NavLink>
        )}

        {/* Menu utilisateur connecté */}
        <div className="ml-auto relative">
          <button
            onClick={() => setMenuUser((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-gray-50 hover:bg-gray-100 transition-colors
                       border border-gray-200"
          >
            <div
              className="w-7 h-7 rounded-full bg-emerald-600
                            flex items-center justify-center text-white
                            text-xs font-bold"
            >
              {user?.nomComplet?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">
                {user?.nomComplet}
              </p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                {user?.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuUser && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuUser(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 bg-white
                              border border-gray-200 rounded-xl shadow-lg
                              z-20 min-w-[200px] overflow-hidden"
              >
                {/* Profil */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.nomComplet}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <div className="mt-1">
                    {user?.role === "Administrateur" ? (
                      <span
                        className="text-xs bg-purple-100 text-purple-700
                                         px-2 py-0.5 rounded-full font-semibold"
                      >
                        Administrateur
                      </span>
                    ) : (
                      <span
                        className="text-xs bg-blue-100 text-blue-700
                                         px-2 py-0.5 rounded-full font-semibold"
                      >
                        Utilisateur
                      </span>
                    )}
                  </div>
                </div>

                {/* Déconnexion */}
                <button
                  onClick={() => {
                    setMenuUser(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3
                             text-sm text-red-600 hover:bg-red-50
                             transition-colors"
                >
                  <LogOut size={15} /> Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ══ MOBILE : en-tête ══ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50
                         bg-white border-b border-gray-200
                         px-4 py-3 flex items-center
                         justify-between shadow-sm"
      >
        <div className="flex items-center gap-2">
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
        </div>

        {/* Bouton déconnexion mobile */}
        <button
          onClick={logout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                     bg-red-50 text-red-600 text-xs font-medium
                     hover:bg-red-100 transition-colors"
        >
          <LogOut size={13} /> Sortir
        </button>
      </header>

      {/* ══ MOBILE : bottom nav ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white border-t border-gray-200 flex pb-safe"
      >
        {[
          ...NAV_LINKS,
          ...(estAdmin ? [{ to: "/users", short: "Users", Icon: Users }] : []),
        ]
          .slice(0, 5)
          .map(({ to, short, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center
               gap-0.5 py-2 text-[10px] font-medium transition-colors
               min-w-0
               ${isActive ? "text-emerald-600" : "text-gray-500"}`
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
// LAYOUT PROTÉGÉ — Navigation + Contenu
// ═════════════════════════════════════════════════════════
function ProtectedLayout({ children }) {
  return (
    <RequireAuth>
      <Navigation />
      <main
        className="pt-14 pb-20 md:pt-16 md:pb-6
                       min-h-screen bg-gray-50"
      >
        {children}
      </main>
    </RequireAuth>
  );
}

// ═════════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ═════════════════════════════════════════════════════════
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* ══ ROUTES PUBLIQUES (sans token) ══ */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ══ ROUTES PROTÉGÉES (token JWT requis) ══ */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Navigate to="/dashboard" replace />
                </ProtectedLayout>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />

            <Route
              path="/facture/new"
              element={
                <ProtectedLayout>
                  <InvoiceForm />
                </ProtectedLayout>
              }
            />

            <Route
              path="/facture/:id"
              element={
                <ProtectedLayout>
                  <InvoiceForm />
                </ProtectedLayout>
              }
            />

            <Route
              path="/devis/new"
              element={
                <ProtectedLayout>
                  <QuoteForm />
                </ProtectedLayout>
              }
            />

            <Route
              path="/devis/:id"
              element={
                <ProtectedLayout>
                  <QuoteForm />
                </ProtectedLayout>
              }
            />

            <Route
              path="/clients"
              element={
                <ProtectedLayout>
                  <CustomerList />
                </ProtectedLayout>
              }
            />

            <Route
              path="/database"
              element={
                <ProtectedLayout>
                  <DatabaseManager />
                </ProtectedLayout>
              }
            />

            {/* ══ ROUTE ADMIN SEULEMENT ══ */}
            <Route
              path="/users"
              element={
                <ProtectedLayout>
                  <RequireAdmin>
                    <UserManager />
                  </RequireAdmin>
                </ProtectedLayout>
              }
            />

            {/* ══ 404 → dashboard ══ */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        {/* Notifications toast globales */}
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
    </AuthProvider>
  );
}
