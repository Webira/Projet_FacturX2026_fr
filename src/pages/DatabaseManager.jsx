// ============================================================
// src/pages/DatabaseManager.jsx
// Gestion et visualisation de la base de données SQLite
// — Statistiques des tables
// — Export des données (JSON)
// — Réinitialisation
// — Accès direct aux enregistrements par table
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Database,
  RefreshCw,
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  FileText,
  ClipboardList,
  Building2,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  HardDrive,
} from "lucide-react";

import {
  invoiceApi,
  quoteApi,
  customerApi,
  dashboardApi,
} from "../api/apiClient";
import { StatusBadge } from "../components/StatusBadge";
import { formatEuros, formatDate, INVOICE_STATUTS } from "../utils/tvaRates";

// ─── Carte statistique table ──────────────────────────────
function TableCard({ icon: Icon, label, count, color, onClick, children }) {
  const [open, setOpen] = useState(false);
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50",
    violet: "border-violet-200  bg-violet-50",
    blue: "border-blue-200    bg-blue-50",
    gray: "border-gray-200    bg-gray-50",
  };

  return (
    <div
      className={`rounded-xl border ${colors[color] || colors.gray}
                     overflow-hidden`}
    >
      {/* En-tête de la carte */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4
                   hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <Icon
              size={20}
              className={
                color === "emerald"
                  ? "text-emerald-600"
                  : color === "violet"
                    ? "text-violet-600"
                    : color === "blue"
                      ? "text-blue-600"
                      : "text-gray-600"
              }
            />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">{label}</p>
            <p className="text-xs text-gray-500">
              {count ?? "…"} enregistrement{count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="px-3 py-1.5 rounded-lg bg-white text-xs font-medium
                         text-gray-600 hover:bg-gray-100 shadow-sm
                         transition-colors border border-gray-200"
            >
              Exporter JSON
            </button>
          )}
          {open ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
        </div>
      </button>

      {/* Contenu dépliable */}
      {open && (
        <div className="border-t border-white/50 bg-white/50 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Ligne de données (tableau) ───────────────────────────
function DataRow({ cols, values, className = "" }) {
  return (
    <div
      className={`grid gap-2 py-2 border-b border-gray-100
                     last:border-0 text-xs ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {values.map((v, i) => (
        <span key={i} className="truncate text-gray-700">
          {v}
        </span>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════
export default function DatabaseManager() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dbInfo, setDbInfo] = useState(null);

  // ─── Chargement de toutes les données ─────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, iRes, qRes, cRes] = await Promise.all([
        dashboardApi.getStats(),
        invoiceApi.getAll(),
        quoteApi.getAll(),
        customerApi.getAll(),
      ]);

      setStats(sRes.data);
      setInvoices(iRes.data?.factures || iRes.data || []);
      setQuotes(qRes.data || []);
      setCustomers(cRes.data || []);

      // Infos base de données calculées
      const allInvoices = iRes.data?.factures || iRes.data || [];
      const allQuotes = qRes.data || [];
      const allCustomers = cRes.data || [];

      setDbInfo({
        totalFactures: allInvoices.length,
        totalDevis: allQuotes.length,
        totalClients: allCustomers.length,
        totalLignes: allInvoices.reduce(
          (s, i) => s + (i.lignes?.length || 0),
          0,
        ),
        caTotal: allInvoices
          .filter((i) => i.statut !== "Annulee")
          .reduce((s, i) => s + (i.totalHtNet || 0), 0),
        facturesBrouillon: allInvoices.filter((i) => i.statut === "Brouillon")
          .length,
        facturesPayees: allInvoices.filter((i) => i.statut === "Payee").length,
        devisConverts: allQuotes.filter(
          (q) => q.statut === "ConvVertiEnFacture",
        ).length,
      });
    } catch {
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Export JSON d'une table ──────────────────────────
  const exporterTable = (data, nomFichier) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomFichier}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export ${nomFichier} téléchargé`);
  };

  // ─── Export complet de la base ────────────────────────
  const exporterTout = () => {
    const tout = {
      exportDate: new Date().toISOString(),
      application: "Factur-X 2026",
      tables: {
        customers: customers,
        invoices: invoices,
        quotes: quotes,
      },
    };
    const json = JSON.stringify(tout, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturx_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sauvegarde complète téléchargée");
  };

  if (loading)
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
          <h1 className="text-xl font-bold text-gray-900">Base de données</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            SQLite — facturx2026.db
          </p>
        </div>
        <button
          onClick={loadAll}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200
                     transition-colors"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {/* ══ RÉSUMÉ BASE DE DONNÉES ══ */}
      {dbInfo && (
        <div
          className="bg-white rounded-xl border border-gray-200
                        shadow-sm overflow-hidden"
        >
          <div
            className="px-4 py-3 bg-gray-50 border-b border-gray-100
                          flex items-center gap-2"
          >
            <HardDrive size={16} className="text-gray-500" />
            <span className="font-semibold text-gray-700 text-sm">
              Résumé — facturx2026.db
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              {
                label: "Factures",
                value: dbInfo.totalFactures,
                color: "text-emerald-600",
              },
              {
                label: "Devis",
                value: dbInfo.totalDevis,
                color: "text-violet-600",
              },
              {
                label: "Clients",
                value: dbInfo.totalClients,
                color: "text-blue-600",
              },
              {
                label: "CA total HT",
                value: formatEuros(dbInfo.caTotal),
                color: "text-gray-900",
              },
              {
                label: "Factures payées",
                value: dbInfo.facturesPayees,
                color: "text-green-600",
              },
              {
                label: "En brouillon",
                value: dbInfo.facturesBrouillon,
                color: "text-gray-500",
              },
              {
                label: "Devis convertis",
                value: dbInfo.devisConverts,
                color: "text-purple-600",
              },
              {
                label: "Lignes totales",
                value: dbInfo.totalLignes,
                color: "text-orange-600",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-3
                                      border border-gray-100"
              >
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bouton export complet */}
          <div className="px-4 pb-4">
            <button
              onClick={exporterTout}
              className="w-full flex items-center justify-center gap-2
                         py-3 rounded-xl bg-gray-800 hover:bg-gray-900
                         text-white font-semibold text-sm transition-colors"
            >
              <Download size={16} />
              Sauvegarder toute la base (JSON)
            </button>
          </div>
        </div>
      )}

      {/* ══ TABLE FACTURES ══ */}
      <TableCard
        icon={FileText}
        label="Table : Invoices (Factures)"
        count={invoices.length}
        color="emerald"
        onClick={() => exporterTable(invoices, "factures")}
      >
        {invoices.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Aucune facture</p>
        ) : (
          <>
            {/* En-têtes colonnes */}
            <div
              className="grid gap-2 py-1.5 text-xs font-bold
                            text-gray-500 uppercase tracking-wide
                            border-b border-gray-200 mb-1"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
            >
              <span>Numéro</span>
              <span>Date</span>
              <span>Acheteur</span>
              <span>TTC</span>
              <span>Statut</span>
            </div>

            {/* Lignes de données */}
            {invoices.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="grid gap-2 py-2 border-b border-gray-100
                           last:border-0 text-xs items-center"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
              >
                <span className="font-mono font-semibold text-gray-800 truncate">
                  {inv.numeroFacture}
                </span>
                <span className="text-gray-500">
                  {formatDate(inv.dateFacture)}
                </span>
                <span className="text-gray-600 truncate">
                  {inv.acheteurNom}
                </span>
                <span className="font-semibold text-emerald-700">
                  {formatEuros(inv.totalTtc)}
                </span>
                <StatusBadge statut={inv.statut} />
              </div>
            ))}

            {invoices.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-2">
                … et {invoices.length - 10} autres factures
              </p>
            )}
          </>
        )}
      </TableCard>

      {/* ══ TABLE DEVIS ══ */}
      <TableCard
        icon={ClipboardList}
        label="Table : Quotes (Devis)"
        count={quotes.length}
        color="violet"
        onClick={() => exporterTable(quotes, "devis")}
      >
        {quotes.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Aucun devis</p>
        ) : (
          <>
            <div
              className="grid gap-2 py-1.5 text-xs font-bold
                            text-gray-500 uppercase tracking-wide
                            border-b border-gray-200 mb-1"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
            >
              <span>Numéro</span>
              <span>Date</span>
              <span>Client</span>
              <span>TTC</span>
              <span>Statut</span>
            </div>
            {quotes.slice(0, 10).map((q) => (
              <div
                key={q.id}
                className="grid gap-2 py-2 border-b border-gray-100
                           last:border-0 text-xs items-center"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
              >
                <span className="font-mono font-semibold text-gray-800 truncate">
                  {q.numeroDevis}
                </span>
                <span className="text-gray-500">{formatDate(q.dateDevis)}</span>
                <span className="text-gray-600 truncate">{q.acheteurNom}</span>
                <span className="font-semibold text-violet-700">
                  {formatEuros(q.totalTtc)}
                </span>
                <StatusBadge statut={q.statut} type="quote" />
              </div>
            ))}
            {quotes.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-2">
                … et {quotes.length - 10} autres devis
              </p>
            )}
          </>
        )}
      </TableCard>

      {/* ══ TABLE CLIENTS ══ */}
      <TableCard
        icon={Building2}
        label="Table : Customers (Clients & Émetteurs)"
        count={customers.length}
        color="blue"
        onClick={() => exporterTable(customers, "clients")}
      >
        {customers.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Aucun client</p>
        ) : (
          <>
            <div
              className="grid gap-2 py-1.5 text-xs font-bold
                            text-gray-500 uppercase tracking-wide
                            border-b border-gray-200 mb-1"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
            >
              <span>Raison sociale</span>
              <span>SIREN</span>
              <span>Ville</span>
              <span>Type</span>
            </div>
            {customers.map((c) => (
              <div
                key={c.id}
                className="grid gap-2 py-2 border-b border-gray-100
                           last:border-0 text-xs items-center"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
              >
                <span className="font-semibold text-gray-800 truncate">
                  {c.raisonSociale}
                </span>
                <span className="font-mono text-gray-500">{c.siren}</span>
                <span className="text-gray-500 truncate">{c.ville}</span>
                <div className="flex gap-1 flex-wrap">
                  {c.estVendeur && (
                    <span
                      className="bg-emerald-100 text-emerald-700
                                     px-1.5 py-0.5 rounded text-[10px]
                                     font-semibold"
                    >
                      Émetteur
                    </span>
                  )}
                  {c.estMicroEntreprise && (
                    <span
                      className="bg-amber-100 text-amber-700
                                     px-1.5 py-0.5 rounded text-[10px]
                                     font-semibold"
                    >
                      Micro
                    </span>
                  )}
                  {!c.estVendeur && !c.estMicroEntreprise && (
                    <span
                      className="bg-blue-100 text-blue-700
                                     px-1.5 py-0.5 rounded text-[10px]
                                     font-semibold"
                    >
                      Client
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </TableCard>

      {/* ══ INFORMATIONS SQLITE ══ */}
      <div
        className="bg-white rounded-xl border border-gray-200
                      shadow-sm overflow-hidden"
      >
        <div
          className="px-4 py-3 bg-gray-50 border-b border-gray-100
                        flex items-center gap-2"
        >
          <Info size={16} className="text-gray-500" />
          <span className="font-semibold text-gray-700 text-sm">
            Informations techniques — SQLite
          </span>
        </div>
        <div className="p-4 space-y-3 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-1">Fichier base de données</p>
              <p className="font-mono font-semibold text-gray-800">
                facturx2026.db
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-1">ORM</p>
              <p className="font-semibold text-gray-800">
                Entity Framework Core 8
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-1">Tables principales</p>
              <p className="font-semibold text-gray-800">
                Invoices, Quotes, Customers,
                <br />
                InvoiceLines, TaxBreakdowns
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-1">Conservation légale</p>
              <p className="font-semibold text-gray-800">
                10 ans
                <br />
                (art. L123-22 C.com.)
              </p>
            </div>
          </div>

          {/* Commandes SQLite utiles */}
          <div
            className="bg-gray-900 rounded-xl p-4 text-green-400
                          font-mono space-y-2"
          >
            <p className="text-gray-500 text-[10px] mb-2">
              # Accès direct à la base SQLite (depuis le terminal) :
            </p>
            <p># Ouvrir la base</p>
            <p className="text-white">sqlite3 facturx2026.db</p>
            <p className="mt-2"># Lister les tables</p>
            <p className="text-white">.tables</p>
            <p className="mt-2"># Voir toutes les factures</p>
            <p className="text-white">
              SELECT Id, NumeroFacture, Statut, TotalTtc FROM Invoices;
            </p>
            <p className="mt-2"># Voir tous les clients</p>
            <p className="text-white">
              SELECT Id, RaisonSociale, Siren, EstVendeur FROM Customers;
            </p>
            <p className="mt-2"># Quitter SQLite</p>
            <p className="text-white">.quit</p>
          </div>

          {/* Outil recommandé */}
          <div
            className="bg-blue-50 border border-blue-200 rounded-xl
                          p-3 flex items-start gap-2"
          >
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">
                Outil recommandé : DB Browser for SQLite
              </p>
              <p className="text-blue-700 text-[11px]">
                Interface graphique gratuite pour visualiser et modifier la base
                directement. Téléchargez sur :{" "}
                <span className="font-mono font-semibold">
                  sqlitebrowser.org
                </span>
              </p>
              <p className="text-blue-600 text-[11px] mt-1">
                Chemin du fichier :{" "}
                <span className="font-mono font-semibold">
                  backend\FacturX.API\facturx2026.db
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
