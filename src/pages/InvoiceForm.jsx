// ============================================================
// src/pages/InvoiceForm.jsx
// Formulaire de création / édition d'une facture Factur-X 2026
// Toutes les mentions obligatoires EN 16931 + DGFiP 2026
// Mobile-first — 8 sections accordéon
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  FileText,
  User,
  Building2,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  Send,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { invoiceApi, customerApi } from "../api/apiClient";
import { InvoiceLines } from "../components/InvoiceLines";
import {
  TVA_RATES,
  DELAIS_PAIEMENT,
  MOYENS_PAIEMENT,
  genererNumeroFacture,
  calculerEcheance,
  formatEuros,
  formatDate,
} from "../utils/tvaRates";

// ─── Composant Section accordéon ──────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge }) {
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
          {Icon && <Icon size={17} className="text-emerald-600 shrink-0" />}
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          {badge && (
            <span
              className="bg-red-100 text-red-600 text-xs
                             px-2 py-0.5 rounded-full font-medium"
            >
              {badge}
            </span>
          )}
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

// ─── Classes partagées ────────────────────────────────────
const inputCls = `w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200
                  focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  outline-none placeholder:text-gray-300`;
const selectCls = `${inputCls} bg-white`;

// ═════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════
export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null); // facture générée

  // ─── Données du formulaire ────────────────────────────
  const [form, setForm] = useState({
    numeroFacture: genererNumeroFacture(
      Math.floor(Math.random() * 9000) + 1000,
    ),
    uuid: uuidv4(),
    typeDocument: "Facture",
    vendeurId: 1,
    acheteurId: "",
    dateFacture: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    numeroBonCommande: "",
    numeroContrat: "",
    referenceProjet: "",
    referenceAcheteur: "",
    objet: "",
    notes: "",
    delaiPaiementJours: 30,
    moyenPaiement: "Virement",
    tauxPenalitesRetard: 15,
    indemniteRecouvrement: 40,
    identifiantPdp: "PDP-001",
    nomPdp: "Chorus Pro",
  });

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));

  // ─── Chargement initial ───────────────────────────────
  useEffect(() => {
    customerApi
      .getAll()
      .then((r) => setCustomers(r.data || []))
      .catch(() => toast.error("Impossible de charger les clients"));

    if (isEdit) {
      setLoading(true);
      invoiceApi
        .getById(id)
        .then((r) => {
          const inv = r.data;
          setForm((p) => ({
            ...p,
            ...inv,
            dateFacture: inv.dateFacture?.split("T")[0] || p.dateFacture,
            dateEcheance: inv.dateEcheance?.split("T")[0] || "",
          }));
          setLignes(inv.lignes || []);
        })
        .catch(() => toast.error("Facture introuvable"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // ─── Recalcul date d'échéance automatique ─────────────
  useEffect(() => {
    if (form.dateFacture && form.delaiPaiementJours) {
      setForm((p) => ({
        ...p,
        dateEcheance: calculerEcheance(
          p.dateFacture,
          Number(p.delaiPaiementJours),
        ),
      }));
    }
  }, [form.dateFacture, form.delaiPaiementJours]);

  // ─── Vendeur sélectionné ──────────────────────────────
  const vendeurSel = customers.find((c) => c.id === Number(form.vendeurId));
  const isMicro = vendeurSel?.estMicroEntreprise || false;

  // ─── Validation ───────────────────────────────────────
  const valider = () => {
    const e = {};
    if (!form.numeroFacture) e.numeroFacture = "Numéro requis";
    if (!form.acheteurId) e.acheteurId = "Acheteur requis";
    if (!form.dateFacture) e.dateFacture = "Date requise";
    if (lignes.length === 0) e.lignes = "Au moins une ligne requise";
    if (lignes.some((l) => !l.description || l.prixUnitaireHT === undefined))
      e.lignes = "Toutes les lignes doivent avoir une description et un prix";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Soumission ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valider()) {
      toast.error("Corrigez les erreurs avant de continuer");
      return;
    }

    setSubmitting(true);
    const tid = toast.loading("Génération du Factur-X en cours…");
    try {
      const payload = {
        ...form,
        vendeurId: Number(form.vendeurId),
        acheteurId: Number(form.acheteurId),
        delaiPaiementJours: Number(form.delaiPaiementJours),
        tauxPenalitesRetard: Number(form.tauxPenalitesRetard),
        indemniteRecouvrement: Number(form.indemniteRecouvrement),
        mentionMicroEntreprise: isMicro,
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
        ? await invoiceApi.update(id, payload)
        : await invoiceApi.create(payload);

      toast.dismiss(tid);
      toast.success("✅ Factur-X générée et signée !");
      setResult(res.data);
    } catch {
      toast.dismiss(tid);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Télécharger le PDF ───────────────────────────────
  const downloadPdf = async () => {
    if (!result?.id) return;
    try {
      const res = await invoiceApi.downloadPdf(result.id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture_${form.numeroFacture}_FacturX.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  // ─── Écran de chargement ──────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );

  // ─── Écran de succès ──────────────────────────────────
  if (result)
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div
          className="bg-white rounded-2xl border border-emerald-200
                      p-6 text-center shadow-sm animate-fade-in"
        >
          <div
            className="w-16 h-16 bg-emerald-100 rounded-full
                        flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Factur-X générée !
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Facture <strong>{result.numeroFacture}</strong> créée, signée et
            prête.
          </p>

          {/* Infos techniques */}
          <div
            className="bg-gray-50 rounded-xl p-4 text-left
                        space-y-2 mb-6 text-xs border border-gray-100"
          >
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 shrink-0">UUID traçabilité</span>
              <span className="font-mono text-gray-700 truncate">
                {result.uuid}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 shrink-0">Hash SHA-256</span>
              <span className="font-mono text-gray-700 truncate">
                {result.hashSha256?.substring(0, 16)}…
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Total TTC</span>
              <span className="font-bold text-emerald-700">
                {formatEuros(result.totalTtc)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={downloadPdf}
              className="flex items-center justify-center gap-2 w-full
                       py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700
                       text-white font-semibold transition-colors"
            >
              <Download size={18} /> Télécharger le PDF Factur-X
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-xl border border-gray-200
                       text-gray-600 hover:bg-gray-50 font-medium
                       transition-colors text-sm"
            >
              Retour au tableau de bord
            </button>
            <button
              onClick={() => setResult(null)}
              className="w-full py-3 rounded-xl border border-gray-200
                       text-gray-600 hover:bg-gray-50 font-medium
                       transition-colors text-sm"
            >
              Créer une autre facture
            </button>
          </div>
        </div>
      </div>
    );

  // ─── Formulaire principal ─────────────────────────────
  const mentionPenalites =
    `Pénalités de retard : ${form.tauxPenalitesRetard}% par an. ` +
    `Indemnité forfaitaire de recouvrement : ${form.indemniteRecouvrement} € ` +
    `(art. D441-5 C.com.).`;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto px-4 py-4 space-y-4"
    >
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? "Modifier la facture" : "Nouvelle facture Factur-X"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Conforme EN 16931 · DGFiP 2026
          </p>
        </div>
        <FileText size={28} className="text-emerald-400" />
      </div>

      {/* ══ SECTION 1 : Identification ═══════════════════ */}
      <Section title="Identification de la facture" icon={FileText}>
        <Field
          label="Numéro de facture"
          required
          error={errors.numeroFacture}
          hint="Format : FA-AAAA-MM-XXXX · Numérotation chronologique sans rupture"
        >
          <input
            type="text"
            value={form.numeroFacture}
            onChange={set("numeroFacture")}
            placeholder="FA-2026-01-0001"
            className={inputCls}
          />
        </Field>

        <Field
          label="UUID traçabilité DGFiP 2026"
          hint="Identifiant universel unique — généré automatiquement"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={form.uuid}
              readOnly
              className={`${inputCls} bg-gray-50 font-mono text-xs text-gray-500 flex-1`}
            />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, uuid: uuidv4() }))}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200
                         rounded-lg text-gray-600 transition-colors shrink-0"
            >
              ↺ Regen
            </button>
          </div>
        </Field>

        <Field label="Type de document">
          <select
            value={form.typeDocument}
            onChange={set("typeDocument")}
            className={selectCls}
          >
            <option value="Facture">Facture (code 380)</option>
            <option value="Avoir">Avoir / Note de crédit (code 381)</option>
            <option value="AvoirPartiel">Avoir partiel (code 384)</option>
          </select>
        </Field>

        <Field
          label="Objet de la facture"
          hint="Recommandé DGFiP 2026 — décrit la nature de la prestation"
        >
          <input
            type="text"
            value={form.objet}
            onChange={set("objet")}
            placeholder="Ex : Prestation de conseil — Janvier 2026"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date de facture" required error={errors.dateFacture}>
            <input
              type="date"
              value={form.dateFacture}
              onChange={set("dateFacture")}
              className={inputCls}
            />
          </Field>
          <Field label="Date d'échéance" hint="Calculée automatiquement">
            <input
              type="date"
              value={form.dateEcheance}
              onChange={set("dateEcheance")}
              className={`${inputCls} bg-orange-50 border-orange-200`}
            />
          </Field>
        </div>
      </Section>

      {/* ══ SECTION 2 : Émetteur (Vendeur) ═══════════════ */}
      <Section title="Émetteur (Vendeur)" icon={Building2}>
        <Field label="Sélectionner l'émetteur" required>
          <select
            value={form.vendeurId}
            onChange={(e) =>
              setForm((p) => ({ ...p, vendeurId: e.target.value }))
            }
            className={selectCls}
          >
            <option value="">— Choisir —</option>
            {customers
              .filter((c) => c.estVendeur)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale} — SIREN {c.siren}
                </option>
              ))}
          </select>
        </Field>

        {vendeurSel && (
          <div
            className="bg-emerald-50 rounded-xl p-3 text-xs
                          space-y-1 border border-emerald-100"
          >
            <p className="font-semibold text-emerald-800">
              {vendeurSel.raisonSociale}
            </p>
            <p className="text-emerald-700">
              {vendeurSel.adresse}, {vendeurSel.codePostal} {vendeurSel.ville}
            </p>
            <p className="text-emerald-700">SIREN : {vendeurSel.siren}</p>
            {vendeurSel.siret && (
              <p className="text-emerald-700">SIRET : {vendeurSel.siret}</p>
            )}
            {vendeurSel.numeroTvaIntracommunautaire && (
              <p className="text-emerald-700">
                N° TVA : {vendeurSel.numeroTvaIntracommunautaire}
              </p>
            )}
            {vendeurSel.estMicroEntreprise && (
              <div
                className="bg-amber-100 text-amber-800 rounded-lg
                              px-2 py-1 flex items-center gap-1 mt-1"
              >
                <Info size={11} />
                <span className="font-semibold">
                  Micro-entreprise — TVA non applicable, art. 293 B du CGI
                </span>
              </div>
            )}
            {vendeurSel.iban && (
              <p className="text-emerald-700 font-mono">
                IBAN : {vendeurSel.iban}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ══ SECTION 3 : Destinataire (Acheteur) ══════════ */}
      <Section title="Destinataire (Acheteur)" icon={User}>
        <Field
          label="Sélectionner l'acheteur"
          required
          error={errors.acheteurId}
        >
          <select
            value={form.acheteurId}
            onChange={(e) =>
              setForm((p) => ({ ...p, acheteurId: e.target.value }))
            }
            className={selectCls}
          >
            <option value="">— Choisir un client —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.raisonSociale} — SIREN {c.siren}
              </option>
            ))}
          </select>
        </Field>

        {form.acheteurId &&
          (() => {
            const ach = customers.find((c) => c.id === Number(form.acheteurId));
            return ach ? (
              <div
                className="bg-blue-50 rounded-xl p-3 text-xs
                            space-y-1 border border-blue-100"
              >
                <p className="font-semibold text-blue-800">
                  {ach.raisonSociale}
                </p>
                <p className="text-blue-700">
                  {ach.adresse}, {ach.codePostal} {ach.ville}
                </p>
                {ach.siret && (
                  <p className="text-blue-700">
                    SIRET (BT-29) : <strong>{ach.siret}</strong>
                  </p>
                )}
                {ach.numeroTvaIntracommunautaire && (
                  <p className="text-blue-700">
                    N° TVA (BT-48) : {ach.numeroTvaIntracommunautaire}
                  </p>
                )}
              </div>
            ) : null;
          })()}
      </Section>

      {/* ══ SECTION 4 : Références commerciales ══════════ */}
      <Section
        title="Références commerciales"
        icon={FileText}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="N° bon de commande (BT-13)"
            hint="Référence de l'acheteur"
          >
            <input
              type="text"
              value={form.numeroBonCommande}
              onChange={set("numeroBonCommande")}
              placeholder="BC-2026-001"
              className={inputCls}
            />
          </Field>
          <Field label="N° contrat (BT-12)">
            <input
              type="text"
              value={form.numeroContrat}
              onChange={set("numeroContrat")}
              placeholder="CTR-2026-001"
              className={inputCls}
            />
          </Field>
          <Field label="Référence projet (BT-11)">
            <input
              type="text"
              value={form.referenceProjet}
              onChange={set("referenceProjet")}
              placeholder="PROJ-001"
              className={inputCls}
            />
          </Field>
          <Field label="Référence acheteur (BT-10)">
            <input
              type="text"
              value={form.referenceAcheteur}
              onChange={set("referenceAcheteur")}
              placeholder="ACH-REF-001"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ══ SECTION 5 : Lignes de facturation ═══════════ */}
      <Section
        title="Lignes de facturation"
        icon={FileText}
        badge={errors.lignes ? "Requis" : undefined}
      >
        {errors.lignes && (
          <div
            className="bg-red-50 text-red-600 text-xs px-3 py-2
                          rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={13} /> {errors.lignes}
          </div>
        )}
        <InvoiceLines lines={lignes} onChange={setLignes} isMicro={isMicro} />
      </Section>

      {/* ══ SECTION 6 : Conditions de paiement ══════════ */}
      <Section title="Conditions de paiement" icon={CreditCard}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Délai de paiement">
            <select
              value={form.delaiPaiementJours}
              onChange={(e) =>
                setForm((p) => ({ ...p, delaiPaiementJours: e.target.value }))
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
          <Field label="Mode de règlement (BT-81)">
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

        <Field label="Conditions libres" hint="Texte affiché sur la facture">
          <textarea
            value={form.conditionsPaiement || ""}
            onChange={set("conditionsPaiement")}
            rows={2}
            placeholder={`Paiement à ${form.delaiPaiementJours} jours par virement.`}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </Section>

      {/* ══ SECTION 7 : Pénalités (obligatoire L441-10) ═ */}
      <Section title="Pénalités de retard" icon={AlertCircle}>
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl
                        p-3 text-xs text-amber-700"
        >
          <strong className="block mb-1">
            Mentions obligatoires (art. L441-10 C.com.)
          </strong>
          Toute facture B2B doit mentionner le taux de pénalités et l'indemnité
          forfaitaire de recouvrement de 40 € minimum.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Taux pénalités (%/an)"
            hint="Minimum légal : 3× taux d'intérêt légal"
          >
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.tauxPenalitesRetard}
              onChange={set("tauxPenalitesRetard")}
              className={inputCls}
            />
          </Field>
          <Field label="Indemnité recouvrement (€)" hint="Minimum légal : 40 €">
            <input
              type="number"
              step="1"
              min="40"
              value={form.indemniteRecouvrement}
              onChange={set("indemniteRecouvrement")}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Aperçu du texte légal généré */}
        <div
          className="bg-gray-50 rounded-xl p-3 text-xs
                        text-gray-500 italic border border-gray-100"
        >
          {mentionPenalites}
        </div>
      </Section>

      {/* ══ SECTION 8 : DGFiP 2026 — PDP ═══════════════ */}
      <Section
        title="Paramètres DGFiP 2026 — PDP"
        icon={Shield}
        defaultOpen={false}
      >
        <div
          className="bg-blue-50 border border-blue-200 rounded-xl
                        p-3 text-xs text-blue-700"
        >
          <strong className="block mb-1">
            Réforme facturation électronique 2026
          </strong>
          L'identifiant PDP est requis pour la transmission des factures
          électroniques via un Prestataire de Dématérialisation Partenaire (PDP)
          agréé DGFiP.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Identifiant PDP (BT-23)">
            <input
              type="text"
              value={form.identifiantPdp}
              onChange={set("identifiantPdp")}
              placeholder="PDP-001"
              className={inputCls}
            />
          </Field>
          <Field label="Nom du PDP">
            <input
              type="text"
              value={form.nomPdp}
              onChange={set("nomPdp")}
              placeholder="Chorus Pro…"
              className={inputCls}
            />
          </Field>
        </div>

        {isMicro && (
          <div
            className="bg-amber-50 rounded-xl p-3 text-xs
                          text-amber-700 border border-amber-200
                          flex items-center gap-2"
          >
            <Info size={13} />
            <span>
              Micro-entreprise détectée — la mention "TVA non applicable, art.
              293 B du CGI" sera ajoutée automatiquement.
            </span>
          </div>
        )}
      </Section>

      {/* ── Bouton de génération ── */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-bold text-base transition-colors
                   flex items-center justify-center gap-2
                   shadow-sm shadow-emerald-200"
      >
        {submitting ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Génération en cours…
          </>
        ) : (
          <>
            <Send size={20} /> Générer le Factur-X
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400 pb-2">
        PDF/A-3b · XML EN 16931 EXTENDED · Signature RSA SHA-256 · UUID DGFiP
        2026
      </p>
    </form>
  );
}
