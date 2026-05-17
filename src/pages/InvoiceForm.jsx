// ============================================================
// src/pages/InvoiceForm.jsx
// Formulaire Factur-X — Création ET Modification
//
// CORRECTIONS :
// 1. Payload JSON nettoyé : plus d'objets Vendeur/Acheteur
//    dans le corps — seulement vendeurId et acheteurId (int)
//    pour éviter l'erreur "one or more validations occurred"
// 2. Bouton Supprimer ajouté en mode édition
// 3. Chargement des clients corrigé (customerApi.getAll)
// 4. Gestion d'erreur améliorée
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
  Trash2,
} from "lucide-react";

import { invoiceApi, customerApi } from "../api/apiClient";
import { InvoiceLines } from "../components/InvoiceLines";
import {
  DELAIS_PAIEMENT,
  MOYENS_PAIEMENT,
  genererNumeroFacture,
  calculerEcheance,
  formatEuros,
} from "../utils/tvaRates";

// ─── Section accordéon ────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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

// ─── Champ formulaire ─────────────────────────────────────
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
  const [deleting, setDeleting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({
    numeroFacture: genererNumeroFacture(
      Math.floor(Math.random() * 9000) + 1000,
    ),
    uuid: uuidv4(),
    typeDocument: "Facture",
    vendeurId: "",
    acheteurId: "",
    dateFacture: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    numeroBonCommande: "",
    numeroContrat: "",
    referenceProjet: "",
    referenceAcheteur: "",
    objet: "",
    notes: "",
    conditionsPaiement: "",
    delaiPaiementJours: 30,
    moyenPaiement: "Virement",
    tauxPenalitesRetard: 15,
    indemniteRecouvrement: 40,
    identifiantPdp: "PDP-001",
    nomPdp: "Chorus Pro",
  });

  const set = (f) => (e) =>
    setForm((p) => ({ ...p, [f]: e.target?.value ?? e }));

  // ─── Chargement initial ───────────────────────────────
  useEffect(() => {
    // Charger les clients depuis l'API
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
            numeroFacture: inv.numeroFacture || p.numeroFacture,
            uuid: inv.uuid || p.uuid,
            typeDocument: inv.typeDocument || p.typeDocument,
            vendeurId: inv.vendeurId || "",
            acheteurId: inv.acheteurId || "",
            dateFacture: inv.dateFacture?.split("T")[0] || p.dateFacture,
            dateEcheance: inv.dateEcheance?.split("T")[0] || "",
            numeroBonCommande: inv.numeroBonCommande || "",
            numeroContrat: inv.numeroContrat || "",
            referenceProjet: inv.referenceProjet || "",
            referenceAcheteur: inv.referenceAcheteur || "",
            objet: inv.objet || "",
            notes: inv.notes || "",
            conditionsPaiement: inv.conditionsPaiement || "",
            delaiPaiementJours: inv.delaiPaiementJours || 30,
            moyenPaiement: inv.moyenPaiement || "Virement",
            tauxPenalitesRetard: inv.tauxPenalitesRetard || 15,
            indemniteRecouvrement: inv.indemniteRecouvrement || 40,
            identifiantPdp: inv.identifiantPdp || "PDP-001",
            nomPdp: inv.nomPdp || "Chorus Pro",
          }));
          setLignes(inv.lignes || []);
        })
        .catch(() => toast.error("Facture introuvable"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // ─── Recalcul échéance automatique ───────────────────
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

  const vendeurSel = customers.find((c) => c.id === Number(form.vendeurId));
  const isMicro = vendeurSel?.estMicroEntreprise || false;

  // ─── Validation ───────────────────────────────────────
  const valider = () => {
    const e = {};
    if (!form.numeroFacture) e.numeroFacture = "Numéro requis";
    if (!form.vendeurId) e.vendeurId = "Émetteur requis";
    if (!form.acheteurId) e.acheteurId = "Acheteur requis";
    if (!form.dateFacture) e.dateFacture = "Date requise";
    if (lignes.length === 0) e.lignes = "Au moins une ligne requise";
    if (lignes.some((l) => !l.description || Number(l.prixUnitaireHT) < 0))
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
    const tid = toast.loading(
      isEdit ? "Mise à jour en cours…" : "Génération du Factur-X…",
    );

    try {
      // CORRECTION CLEF :
      // On envoie UNIQUEMENT les IDs (vendeurId, acheteurId)
      // et PAS les objets Vendeur/Acheteur complets.
      // Cela évite l'erreur "one or more validations occurred"
      // car ASP.NET Core essayait de valider ces objets imbriqués.
      const payload = {
        numeroFacture: form.numeroFacture,
        uuid: form.uuid,
        typeDocument: form.typeDocument,
        vendeurId: Number(form.vendeurId),
        acheteurId: Number(form.acheteurId),
        dateFacture: form.dateFacture,
        dateEcheance: form.dateEcheance || null,
        numeroBonCommande: form.numeroBonCommande || null,
        numeroContrat: form.numeroContrat || null,
        referenceProjet: form.referenceProjet || null,
        referenceAcheteur: form.referenceAcheteur || null,
        objet: form.objet || null,
        notes: form.notes || null,
        conditionsPaiement: form.conditionsPaiement || null,
        delaiPaiementJours: Number(form.delaiPaiementJours),
        moyenPaiement: form.moyenPaiement,
        tauxPenalitesRetard: Number(form.tauxPenalitesRetard),
        indemniteRecouvrement: Number(form.indemniteRecouvrement),
        identifiantPdp: form.identifiantPdp || null,
        nomPdp: form.nomPdp || null,
        mentionMicroEntreprise: isMicro,
        // Lignes : uniquement les champs nécessaires
        lignes: lignes.map((l, i) => ({
          numeroLigne: i + 1,
          description: l.description,
          referenceVendeur: l.referenceVendeur || null,
          quantite: Number(l.quantite) || 1,
          unite: l.unite || "UN",
          prixUnitaireHT: Number(l.prixUnitaireHT) || 0,
          remiseMontant: Number(l.remiseMontant) || 0,
          categorieTva: l.categorieTva,
          tauxTva: Number(l.tauxTva) || 0,
        })),
      };

      const res = isEdit
        ? await invoiceApi.update(id, payload)
        : await invoiceApi.create(payload);

      toast.dismiss(tid);
      toast.success(
        isEdit ? "✅ Facture mise à jour !" : "✅ Factur-X générée et signée !",
      );
      setResult(res.data);
    } catch (err) {
      toast.dismiss(tid);
      // L'intercepteur Axios affiche déjà le toast d'erreur
      console.error("Erreur soumission facture:", err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Suppression ──────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await invoiceApi.delete(id);
      toast.success("Facture supprimée");
      navigate("/dashboard");
    } catch {
      /* géré par intercepteur */
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  // ─── Télécharger PDF ──────────────────────────────────
  const downloadPdf = async () => {
    const factureId = result?.id || id;
    if (!factureId) return;
    try {
      const res = await invoiceApi.downloadPdf(factureId);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture_${form.numeroFacture}_FacturX.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF non disponible");
    }
  };

  // ─── Écran chargement ─────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );

  // ─── Écran succès ─────────────────────────────────────
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
            {isEdit ? "Facture mise à jour !" : "Factur-X générée !"}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Facture{" "}
            <strong>{result.numeroFacture || form.numeroFacture}</strong>{" "}
            enregistrée avec succès.
          </p>

          {/* Infos techniques */}
          {result.uuid && (
            <div
              className="bg-gray-50 rounded-xl p-4 text-left
                          space-y-2 mb-6 text-xs border border-gray-100"
            >
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 shrink-0">UUID</span>
                <span className="font-mono text-gray-700 truncate">
                  {result.uuid}
                </span>
              </div>
              {result.hashSha256 && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">Hash SHA-256</span>
                  <span className="font-mono text-gray-700 truncate">
                    {result.hashSha256.substring(0, 16)}…
                  </span>
                </div>
              )}
              {result.totalTtc && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Total TTC</span>
                  <span className="font-bold text-emerald-700">
                    {formatEuros(result.totalTtc)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {(result.hashSha256 || result.pdfUrl) && (
              <button
                onClick={downloadPdf}
                className="flex items-center justify-center gap-2 w-full
                         py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700
                         text-white font-semibold transition-colors"
              >
                <Download size={18} /> Télécharger le PDF Factur-X
              </button>
            )}
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
              {isEdit ? "Continuer à modifier" : "Créer une autre facture"}
            </button>
          </div>
        </div>
      </div>
    );

  // ─── Texte légal pénalités ────────────────────────────
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

      {/* ── Confirmation suppression ── */}
      {showDelete && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">
            Supprimer la facture {form.numeroFacture} ?
          </p>
          <p className="text-xs text-red-600 mb-3">
            Cette action est irréversible. Les archives légales doivent être
            conservées 10 ans.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700
                         text-white text-sm font-semibold transition-colors
                         disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin mx-auto" />
              ) : (
                "Confirmer la suppression"
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="flex-1 py-2 rounded-lg border border-gray-200
                         text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ══ SECTION 1 : Identification ══ */}
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
              className={`${inputCls} bg-gray-50 font-mono text-xs
                          text-gray-500 flex-1`}
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

        <Field label="Objet de la facture" hint="Recommandé DGFiP 2026">
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

      {/* ══ SECTION 2 : Émetteur ══ */}
      <Section title="Émetteur (Vendeur)" icon={Building2}>
        <Field
          label="Sélectionner l'émetteur"
          required
          error={errors.vendeurId}
        >
          <select
            value={form.vendeurId}
            onChange={(e) =>
              setForm((p) => ({ ...p, vendeurId: e.target.value }))
            }
            className={selectCls}
          >
            <option value="">— Choisir un émetteur —</option>
            {customers
              .filter((c) => c.estVendeur)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale} — SIREN {c.siren}
                </option>
              ))}
          </select>
        </Field>

        {customers.filter((c) => c.estVendeur).length === 0 && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-xl
                          p-3 text-xs text-amber-700 flex items-center gap-2"
          >
            <Info size={13} />
            Aucun émetteur trouvé.{" "}
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="underline font-semibold"
            >
              Créer un émetteur dans Clients
            </button>
          </div>
        )}

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
          </div>
        )}
      </Section>

      {/* ══ SECTION 3 : Acheteur ══ */}
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

        {customers.length === 0 && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-xl
                          p-3 text-xs text-amber-700 flex items-center gap-2"
          >
            <Info size={13} />
            Aucun client trouvé.{" "}
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="underline font-semibold"
            >
              Créer un client dans Clients
            </button>
          </div>
        )}

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
              </div>
            ) : null;
          })()}
      </Section>

      {/* ══ SECTION 4 : Références ══ */}
      <Section
        title="Références commerciales"
        icon={FileText}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="N° bon de commande (BT-13)">
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

      {/* ══ SECTION 5 : Lignes ══ */}
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

      {/* ══ SECTION 6 : Conditions de paiement ══ */}
      <Section title="Conditions de paiement" icon={CreditCard}>
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
        <Field label="Conditions libres">
          <textarea
            value={form.conditionsPaiement}
            onChange={set("conditionsPaiement")}
            rows={2}
            placeholder={`Paiement à ${form.delaiPaiementJours} jours par virement.`}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </Section>

      {/* ══ SECTION 7 : Pénalités ══ */}
      <Section title="Pénalités de retard" icon={AlertCircle}>
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl
                        p-3 text-xs text-amber-700"
        >
          <strong className="block mb-1">
            Mentions obligatoires (art. L441-10 C.com.)
          </strong>
          Toute facture B2B doit mentionner le taux de pénalités et l'indemnité
          forfaitaire de 40 € minimum.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taux pénalités (%/an)">
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.tauxPenalitesRetard}
              onChange={set("tauxPenalitesRetard")}
              className={inputCls}
            />
          </Field>
          <Field label="Indemnité recouvrement (€)">
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
        <div
          className="bg-gray-50 rounded-xl p-3 text-xs
                        text-gray-500 italic border border-gray-100"
        >
          {mentionPenalites}
        </div>
      </Section>

      {/* ══ SECTION 8 : DGFiP 2026 ══ */}
      <Section
        title="Paramètres DGFiP 2026 — PDP"
        icon={Shield}
        defaultOpen={false}
      >
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
              placeholder="Chorus Pro"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── Boutons d'action ── */}
      <div className="space-y-3 pb-2">
        {/* Générer / Sauvegarder */}
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
              <Loader2 size={20} className="animate-spin" /> En cours…
            </>
          ) : (
            <>
              <Send size={20} />
              {isEdit ? "Mettre à jour la facture" : "Générer le Factur-X"}
            </>
          )}
        </button>

        {/* Supprimer (mode édition uniquement) */}
        {isEdit && !showDelete && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="w-full py-3 rounded-xl border border-red-200
                       text-red-500 hover:bg-red-50 font-medium text-sm
                       transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Supprimer cette facture
          </button>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        PDF/A-3b · XML EN 16931 EXTENDED · Signature RSA SHA-256 · UUID DGFiP
        2026
      </p>
    </form>
  );
}
