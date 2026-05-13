// ============================================================
// src/pages/Dashboard.jsx
// Tableau de bord — suivi factures et devis
// Statuts DGFiP 2026, échéances, relances, KPIs
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Bell,
  FileText,
  ClipboardList,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";

import { invoiceApi, quoteApi, dashboardApi } from "../api/apiClient";
import { StatusBadge } from "../components/StatusBadge";
import {
  INVOICE_STATUTS,
  formatEuros,
  formatDate,
  calculerJoursRetard,
} from "../utils/tvaRates";

// ─── Carte statistique ────────────────────────────────────
function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color = "emerald",
  onClick,
}) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50  text-orange-600  border-orange-100",
    red: "bg-red-50     text-red-600     border-red-100",
    violet: "bg-violet-50  text-violet-600  border-violet-100",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border
                  ${palette[color] || palette.emerald}
                  hover:scale-[1.02] transition-transform active:scale-100
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  focus:ring-emerald-400`}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} />
        {onClick && <ChevronRight size={14} className="opacity-40 mt-0.5" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
      {sublabel && <p className="text-xs opacity-70 mt-0.5">{sublabel}</p>}
    </button>
  );
}

// ─── Badge jours de retard ────────────────────────────────
function RetardBadge({ jours }) {
  if (jours <= 0) return null;
  const color =
    jours > 30
      ? "bg-red-100 text-red-700"
      : jours > 7
        ? "bg-orange-100 text-orange-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>
      +{jours}j
    </span>
  );
}

// ─── Carte d'une facture ──────────────────────────────────
function InvoiceCard({ invoice, onStatusChange, onRelance, onDownload }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const joursRetard = calculerJoursRetard(invoice.dateEcheance);
  const enRetard =
    joursRetard > 0 &&
    invoice.statut !== "Payee" &&
    invoice.statut !== "Annulee";

  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-3 shadow-sm
                     ${enRetard ? "border-orange-200" : "border-gray-200"}`}
    >
      {/* Ligne 1 : Numéro + Statut + Montant */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">
              {invoice.numeroFacture}
            </span>
            <StatusBadge statut={invoice.statut} />
            {enRetard && <RetardBadge jours={joursRetard} />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {invoice.acheteurNom}
          </p>
          {invoice.objet && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {invoice.objet}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-emerald-700 text-sm">
            {formatEuros(invoice.totalTtc)}
          </p>
          <p className="text-xs text-gray-400">
            {formatDate(invoice.dateFacture)}
          </p>
        </div>
      </div>

      {/* Ligne 2 : Échéance + Actions */}
      <div
        className="flex items-center justify-between gap-2
                      pt-2 border-t border-gray-50"
      >
        <div className="text-xs">
          {invoice.dateEcheance ? (
            <span
              className={
                enRetard ? "text-red-600 font-semibold" : "text-gray-500"
              }
            >
              Échéance : {formatDate(invoice.dateEcheance)}
            </span>
          ) : (
            <span className="text-gray-400">Pas d'échéance</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Télécharger PDF */}
          <button
            onClick={() => onDownload(invoice.id)}
            title="Télécharger le PDF Factur-X"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400
                       hover:text-gray-600 transition-colors"
          >
            <Download size={15} />
          </button>

          {/* Relancer si en retard */}
          {enRetard && (
            <button
              onClick={() => onRelance(invoice.id, invoice.numeroFacture)}
              title="Enregistrer une relance"
              className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-400
                         hover:text-orange-600 transition-colors"
            >
              <Bell size={15} />
            </button>
          )}

          {/* Menu statut */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100
                         hover:bg-gray-200 text-gray-600 text-xs
                         font-medium transition-colors"
            >
              Statut ▾
            </button>

            {menuOpen && (
              <>
                {/* Overlay pour fermer le menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />

                <div
                  className="absolute right-0 top-full mt-1 bg-white
                                border border-gray-200 rounded-xl shadow-lg
                                z-20 min-w-[190px] overflow-hidden
                                animate-fade-in"
                >
                  {Object.entries(INVOICE_STATUTS)
                    .filter(([key]) => key !== invoice.statut)
                    .map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => {
                          onStatusChange(invoice.id, key);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2
                                   text-xs hover:bg-gray-50 text-left
                                   transition-colors"
                      >
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Carte d'un devis ─────────────────────────────────────
function QuoteCard({ quote, onConvert }) {
  const estExpire =
    quote.dateValidite &&
    new Date(quote.dateValidite) < new Date() &&
    quote.statut === "EnvoyeClient";

  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-2.5 shadow-sm
                     ${estExpire ? "border-red-200" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">
              {quote.numeroDevis}
            </span>
            <StatusBadge statut={quote.statut} type="quote" />
            {estExpire && (
              <span
                className="text-xs bg-red-100 text-red-600
                               px-2 py-0.5 rounded-full font-semibold"
              >
                Expiré
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {quote.acheteurNom}
          </p>
          {quote.objet && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {quote.objet}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-violet-700 text-sm">
            {formatEuros(quote.totalTtc)}
          </p>
          <p className="text-xs text-gray-400">
            Valide jusqu'au {formatDate(quote.dateValidite)}
          </p>
        </div>
      </div>

      {/* Bouton de conversion */}
      {quote.statut !== "ConvVertiEnFacture" &&
        quote.statut !== "RefuseClient" &&
        !estExpire && (
          <button
            onClick={() => onConvert(quote.id)}
            className="w-full flex items-center justify-center gap-2
                     py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100
                     text-emerald-700 text-xs font-semibold
                     transition-colors border border-emerald-200"
          >
            <ArrowUpRight size={14} />
            Convertir en Facture Factur-X
          </button>
        )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — Dashboard
// ═════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("factures");
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilter] = useState("");

  // ─── Chargement des données ───────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, iRes, qRes] = await Promise.all([
        dashboardApi.getStats(),
        invoiceApi.getAll({ search, statut: filterStatut || undefined }),
        quoteApi.getAll(),
      ]);
      setStats(sRes.data);
      setInvoices(iRes.data?.factures || iRes.data || []);
      setQuotes(qRes.data || []);
    } catch {
      toast.error("Erreur de chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatut]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Actions ──────────────────────────────────────────
  const handleStatusChange = async (id, statut) => {
    try {
      await invoiceApi.updateStatut(id, statut);
      toast.success(`Statut → ${INVOICE_STATUTS[statut]?.label}`);
      loadAll();
    } catch {
      /* géré par l'intercepteur Axios */
    }
  };

  const handleRelance = async (id, numero) => {
    try {
      await invoiceApi.enregistrerRelance(id);
      toast.success(`Relance enregistrée — ${numero}`);
      loadAll();
    } catch {
      /* géré */
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await invoiceApi.downloadPdf(id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture_${id}_facturx.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF non disponible");
    }
  };

  const handleConvert = async (quoteId) => {
    const tid = toast.loading("Conversion en cours…");
    try {
      await quoteApi.convertirEnFacture(quoteId, {
        dateFacture: new Date().toISOString().split("T")[0],
      });
      toast.dismiss(tid);
      toast.success("✅ Converti en Factur-X !");
      loadAll();
    } catch {
      toast.dismiss(tid);
    }
  };

  // ─── Factures filtrées localement ─────────────────────
  const invoicesFiltrees = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.numeroFacture?.toLowerCase().includes(search.toLowerCase()) ||
      inv.acheteurNom?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || inv.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // ─── Écran de chargement initial ─────────────────────
  if (loading && !stats)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Suivi Factur-X — DGFiP 2026
          </p>
        </div>
        <button
          onClick={loadAll}
          title="Actualiser"
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200
                     transition-colors"
        >
          <RefreshCw
            size={18}
            className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* ══ CARTES STATISTIQUES ══════════════════════════ */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="CA du mois (HT)"
            value={formatEuros(stats.caMoisHt)}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            label="Factures en retard"
            value={stats.totalFacturesEnRetard ?? stats.nbFacturesEnRetard ?? 0}
            sublabel={
              stats.montantEnRetard > 0
                ? formatEuros(stats.montantEnRetard)
                : undefined
            }
            icon={AlertTriangle}
            color={
              (stats.totalFacturesEnRetard ?? stats.nbFacturesEnRetard ?? 0) > 0
                ? "red"
                : "emerald"
            }
            onClick={() => setFilter("Acceptee")}
          />
          <StatCard
            label="Relances à envoyer"
            value={stats.aRelancer ?? stats.nbARelancer ?? 0}
            icon={Bell}
            color={
              (stats.aRelancer ?? stats.nbARelancer ?? 0) > 0
                ? "orange"
                : "emerald"
            }
          />
          <StatCard
            label="Devis expirant"
            sublabel="dans 7 jours"
            value={stats.devisExpirant ?? stats.nbDevisExpirant ?? 0}
            icon={Clock}
            color={
              (stats.devisExpirant ?? stats.nbDevisExpirant ?? 0) > 0
                ? "violet"
                : "emerald"
            }
            onClick={() => setTab("devis")}
          />
        </div>
      )}

      {/* ══ ALERTES RETARD ═══════════════════════════════ */}
      {stats?.facturesEnRetard?.length > 0 && (
        <div
          className="bg-red-50 rounded-xl border border-red-200
                        overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-red-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700">
              {stats.facturesEnRetard.length} facture(s) en retard de paiement
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {stats.facturesEnRetard.slice(0, 3).map((f) => (
              <div
                key={f.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {f.numeroFacture}
                  </p>
                  <p className="text-xs text-gray-500">{f.acheteurNom}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">
                    {formatEuros(f.soldeRestantDu)}
                  </p>
                  <RetardBadge jours={f.joursRetard} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ONGLETS FACTURES / DEVIS ═════════════════════ */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[
          {
            key: "factures",
            label: "Factures",
            Icon: FileText,
            count: invoices.length,
          },
          {
            key: "devis",
            label: "Devis",
            Icon: ClipboardList,
            count: quotes.length,
          },
        ].map(({ key, label, Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5
                        py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          tab === key
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
          >
            <Icon size={16} />
            {label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${
                tab === key
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ══ FILTRES (onglet factures) ════════════════════ */}
      {tab === "factures" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une facture…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl
                         border border-gray-200 outline-none
                         focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200
                       bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tous statuts</option>
            {Object.entries(INVOICE_STATUTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ══ LISTE DES FACTURES ═══════════════════════════ */}
      {tab === "factures" && (
        <div className="space-y-3">
          {invoicesFiltrees.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {search || filterStatut
                  ? "Aucune facture ne correspond à la recherche"
                  : "Aucune facture pour l'instant"}
              </p>
              <button
                onClick={() => navigate("/facture/new")}
                className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700
                           text-white text-xs font-semibold rounded-xl
                           transition-colors"
              >
                Créer la première facture
              </button>
            </div>
          ) : (
            invoicesFiltrees.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                onStatusChange={handleStatusChange}
                onRelance={handleRelance}
                onDownload={handleDownload}
              />
            ))
          )}
        </div>
      )}

      {/* ══ LISTE DES DEVIS ══════════════════════════════ */}
      {tab === "devis" && (
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucun devis pour l'instant</p>
              <button
                onClick={() => navigate("/devis/new")}
                className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-700
                           text-white text-xs font-semibold rounded-xl
                           transition-colors"
              >
                Créer le premier devis
              </button>
            </div>
          ) : (
            quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} onConvert={handleConvert} />
            ))
          )}
        </div>
      )}

      {/* ── Boutons de création rapide (fixes sur mobile) ── */}
      <div
        className="fixed bottom-24 right-4 flex flex-col gap-2
                      md:static md:flex-row md:justify-end
                      md:bottom-auto md:right-auto md:pt-2"
      >
        <button
          onClick={() => navigate("/facture/new")}
          className="flex items-center gap-2 px-4 py-3 rounded-xl
                     bg-emerald-600 hover:bg-emerald-700 text-white
                     font-semibold text-sm shadow-lg shadow-emerald-200
                     transition-colors"
        >
          <FileText size={16} />
          <span className="hidden md:inline">Nouvelle facture</span>
          <span className="md:hidden">+ Facture</span>
        </button>

        <button
          onClick={() => navigate("/devis/new")}
          className="flex items-center gap-2 px-4 py-3 rounded-xl
                     bg-violet-600 hover:bg-violet-700 text-white
                     font-semibold text-sm shadow-lg shadow-violet-200
                     transition-colors"
        >
          <ClipboardList size={16} />
          <span className="hidden md:inline">Nouveau devis</span>
          <span className="md:hidden">+ Devis</span>
        </button>
      </div>
    </div>
  );
}
