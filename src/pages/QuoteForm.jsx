// ============================================================
// src/pages/QuoteForm.jsx
// Bon de commande / Devis — mentions obligatoires DGFiP 2026
// Convertible automatiquement en Factur-X en un clic
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { quoteApi, customerApi } from "../api/apiClient";
import { InvoiceLines } from "../components/InvoiceLines";
import { StatusBadge } from "../components/StatusBadge";
import {
  DELAIS_PAIEMENT,
  MOYENS_PAIEMENT,
  QUOTE_STATUTS,
  genererNumeroDevis,
  calculerEcheance,
  formatEuros,
  formatDate,
} from "../utils/tvaRates";

// ─── Section accordéon ────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="bg-white rounded-xl border border-gray-200
                    overflow-hidden shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3
                   text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} className="text-violet-600 shrink-0" />}
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Champ de formulaire ──────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = `w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200
                   focus:ring-2 focus:ring-violet-500 focus:border-transparent
                   outline-none placeholder:text-gray-300`;
const selectCls = `${inputCls} bg-white`;

// ═════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════
export default function QuoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [errors, setErrors] = useState({});
  const [savedQuote, setSavedQuote] = useState(null);

  const [form, setForm] = useState({
    numeroDevis: genererNumeroDevis(Math.floor(Math.random() * 9000) + 1000),
    vendeurId: 1,
    acheteurId: "",
    dateDevis: new Date().toISOString().split("T")[0],
    dateValidite: new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0],
    objet: "",
    notes: "",
    delaiPaiementJours: 30,
    moyenPaiement: "Virement",
    tauxPenalitesRetard: 15,
    indemniteRecouvrement: 40,
    statut: "Brouillon",
  });

  const set = (f) => (e) =>
    setForm((p) => ({ ...p, [f]: e.target?.value ?? e }));

  // ─── Chargement initial ───────────────────────────────
  useEffect(() => {
    customerApi
      .getAll()
      .then((r) => setCustomers(r.data || []))
      .catch(() => toast.error("Impossible de charger les clients"));

    if (isEdit) {
      setLoading(true);
      quoteApi
        .getById(id)
        .then((r) => {
          const q = r.data;
          setForm((p) => ({
            ...p,
            ...q,
            dateDevis: q.dateDevis?.split("T")[0] || p.dateDevis,
            dateValidite: q.dateValidite?.split("T")[0] || p.dateValidite,
          }));
          setLignes(q.lignes || []);
          setSavedQuote(q);
        })
        .catch(() => toast.error("Devis introuvable"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const vendeurSel = customers.find((c) => c.id === Number(form.vendeurId));
  const isMicro = vendeurSel?.estMicroEntreprise || false;

  const estExpire =
    form.dateValidite &&
    new Date(form.dateValidite) < new Date() &&
    form.statut === "EnvoyeClient";
  const dejaConverti = savedQuote?.statut === "ConvVertiEnFacture";

  // ─── Validation ───────────────────────────────────────
  const valider = () => {
    const e = {};
    if (!form.numeroDevis) e.numeroDevis = "Numéro requis";
    if (!form.acheteurId) e.acheteurId = "Client requis";
    if (!form.dateDevis) e.dateDevis = "Date requise";
    if (lignes.length === 0) e.lignes = "Au moins une ligne requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Sauvegarde ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valider()) {
      toast.error("Corrigez les erreurs");
      return;
    }

    setSubmitting(true);
    const tid = toast.loading("Enregistrement du devis…");
    try {
      const payload = {
        ...form,
        vendeurId: Number(form.vendeurId),
        acheteurId: Number(form.acheteurId),
        delaiPaiementJours: Number(form.delaiPaiementJours),
        tauxPenalitesRetard: Number(form.tauxPenalitesRetard),
        indemniteRecouvrement: Number(form.indemniteRecouvrement),
        lignes: lignes.map((l, i) => ({
          numeroLigne: i + 1,
          description: l.description,
          referenceVendeur: l.referenceVendeur || null,
          quantite: Number(l.quantite),
          unite: l.unite || "UN",
          prixUnitaireHT: Number(l.prixUnitaireHT),
          remiseMontant: Number(l.remiseMontant || 0),
          categorieTva: l.categorieTva,
          tauxTva: Number(l.tauxTva || 0),
        })),
      };

      const res = isEdit
        ? await quoteApi.update(id, payload)
        : await quoteApi.create(payload);

      toast.dismiss(tid);
      toast.success("Devis enregistré !");
      setSavedQuote(res.data);
      if (!isEdit) navigate(`/devis/${res.data.id}`);
    } catch {
      toast.dismiss(tid);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Conversion devis → Facture Factur-X ──────────────
  const handleConvertir = async () => {
    if (!savedQuote?.id) {
      toast.error("Sauvegardez d'abord le devis");
      return;
    }
    setConverting(true);
    const tid = toast.loading("Conversion en Factur-X…");
    try {
      const res = await quoteApi.convertirEnFacture(savedQuote.id, {
        dateFacture: new Date().toISOString().split("T")[0],
      });
      toast.dismiss(tid);
      toast.success("✅ Converti en Facture Factur-X !");
      navigate(`/facture/${res.data.factureId}`);
    } catch {
      toast.dismiss(tid);
    } finally {
      setConverting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-violet-500" />
      </div>
    );

  const totalHT = lignes.reduce((s, l) => s + (l.totalHT || 0), 0);
  const totalTTC = lignes.reduce((s, l) => s + (l.totalTTC || 0), 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto px-4 py-4 space-y-4"
    >
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? "Bon de commande" : "Nouveau bon de commande"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Devis conforme DGFiP 2026
          </p>
        </div>
        <ClipboardList size={28} className="text-violet-400" />
      </div>

      {/* ── Bannières d'état ── */}
      {dejaConverti && (
        <div
          className="bg-purple-50 border border-purple-200 rounded-xl
                        p-3 text-sm text-purple-700 flex items-center gap-2"
        >
          <CheckCircle2 size={17} />
          Ce devis a déjà été converti en facture Factur-X.
        </div>
      )}
      {estExpire && !dejaConverti && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl
                        p-3 text-sm text-red-600 flex items-center gap-2"
        >
          <AlertCircle size={17} />
          Ce devis a expiré le {formatDate(form.dateValidite)}
        </div>
      )}

      {/* ══ IDENTIFICATION ═══════════════════════════════ */}
      <Section title="Identification du devis" icon={ClipboardList}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Numéro de devis" required error={errors.numeroDevis}>
            <input
              type="text"
              value={form.numeroDevis}
              onChange={set("numeroDevis")}
              placeholder="DEV-2026-0001"
              className={inputCls}
            />
          </Field>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              Statut
            </label>
            <div className="pt-1">
              <StatusBadge statut={form.statut} type="quote" />
            </div>
          </div>
        </div>

        <Field
          label="Objet du devis"
          hint="Description de la prestation ou fourniture"
        >
          <input
            type="text"
            value={form.objet}
            onChange={set("objet")}
            placeholder="Ex : Développement application web"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date du devis" required error={errors.dateDevis}>
            <input
              type="date"
              value={form.dateDevis}
              onChange={set("dateDevis")}
              className={inputCls}
            />
          </Field>
          <Field label="Date de validité" hint="Délai recommandé : 30 jours">
            <input
              type="date"
              value={form.dateValidite}
              onChange={set("dateValidite")}
              className={`${inputCls} ${
                estExpire ? "border-red-300 bg-red-50" : ""
              }`}
            />
          </Field>
        </div>
      </Section>

      {/* ══ ÉMETTEUR & DESTINATAIRE ═══════════════════════ */}
      <Section title="Émetteur & Destinataire" icon={ClipboardList}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Émetteur" required>
            <select
              value={form.vendeurId}
              onChange={(e) =>
                setForm((p) => ({ ...p, vendeurId: e.target.value }))
              }
              className={selectCls}
            >
              {customers
                .filter((c) => c.estVendeur)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raisonSociale}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Client" required error={errors.acheteurId}>
            <select
              value={form.acheteurId}
              onChange={(e) =>
                setForm((p) => ({ ...p, acheteurId: e.target.value }))
              }
              className={selectCls}
            >
              <option value="">— Choisir —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {isMicro && (
          <div
            className="bg-amber-50 text-amber-700 text-xs rounded-xl
                          p-3 flex items-center gap-2 border border-amber-200"
          >
            <Info size={13} />
            TVA non applicable, art. 293 B du CGI
          </div>
        )}
      </Section>

      {/* ══ LIGNES ═══════════════════════════════════════ */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 px-1">
          Lignes du devis
          {errors.lignes && (
            <span className="text-red-500 ml-2 text-xs font-normal">
              — {errors.lignes}
            </span>
          )}
        </h2>
        <InvoiceLines lines={lignes} onChange={setLignes} isMicro={isMicro} />
      </div>

      {/* ══ CONDITIONS ═══════════════════════════════════ */}
      <Section title="Conditions" icon={ClipboardList} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Délai de paiement">
            <select
              value={form.delaiPaiementJours}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  delaiPaiementJours: e.target.value,
                }))
              }
              className={selectCls}
            >
              {DELAIS_PAIEMENT.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mode de règlement">
            <select
              value={form.moyenPaiement}
              onChange={set("moyenPaiement")}
              className={selectCls}
            >
              {MOYENS_PAIEMENT.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes / Conditions particulières">
          <textarea
            value={form.notes || ""}
            onChange={set("notes")}
            rows={2}
            placeholder="Conditions générales, remarques…"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </Section>

      {/* ── Récapitulatif financier ── */}
      {lignes.length > 0 && (
        <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Total HT</span>
            <span className="font-semibold">{formatEuros(totalHT)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-violet-700">
            <span>Total TTC</span>
            <span>{formatEuros(totalTTC)}</span>
          </div>
        </div>
      )}

      {/* ── Boutons d'action ── */}
      <div className="space-y-3 pb-2">
        {/* Enregistrer */}
        <button
          type="submit"
          disabled={submitting || dejaConverti}
          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-bold text-sm transition-colors
                     flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enregistrement…
            </>
          ) : (
            <>
              <ClipboardList size={18} /> Enregistrer le devis
            </>
          )}
        </button>

        {/* Convertir en Factur-X */}
        {savedQuote && !dejaConverti && !estExpire && (
          <button
            type="button"
            onClick={handleConvertir}
            disabled={converting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-bold text-sm transition-colors
                       flex items-center justify-center gap-2
                       shadow-sm shadow-emerald-200"
          >
            {converting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Conversion…
              </>
            ) : (
              <>
                <ArrowRight size={18} />
                Convertir en Facture Factur-X
                <span
                  className="text-xs bg-emerald-500 px-2 py-0.5
                                   rounded-full ml-1"
                >
                  Auto
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
