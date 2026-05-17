// ============================================================
// src/pages/CustomerList.jsx
// Gestion CRUD complète des Clients et Émetteurs (Vendeurs)
// — Lister, Créer, Modifier, Supprimer
// — Validation SIREN/SIRET en temps réel
// — Mobile-first
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  AlertCircle,
  User,
  CreditCard,
  Info,
} from "lucide-react";
import { customerApi } from "../api/apiClient";
import { validerSiren, validerSiret, formatSiret } from "../utils/tvaRates";

// ─── Classes CSS partagées ────────────────────────────────
const inputCls = `w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200
                  focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  outline-none placeholder:text-gray-300`;
const selectCls = `${inputCls} bg-white`;

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

// ─── Formulaire Client (création + édition) ───────────────
function CustomerForm({ customer, onSave, onCancel }) {
  const isEdit = Boolean(customer?.id);

  const [form, setForm] = useState({
    raisonSociale: customer?.raisonSociale || "",
    siren: customer?.siren || "",
    siret: customer?.siret || "",
    numeroTvaIntracommunautaire: customer?.numeroTvaIntracommunautaire || "",
    formeJuridique: customer?.formeJuridique || "",
    capitalSocial: customer?.capitalSocial || "",
    numeroRcs: customer?.numeroRcs || "",
    adresse: customer?.adresse || "",
    complementAdresse: customer?.complementAdresse || "",
    codePostal: customer?.codePostal || "",
    ville: customer?.ville || "",
    pays: customer?.pays || "FR",
    email: customer?.email || "",
    telephone: customer?.telephone || "",
    iban: customer?.iban || "",
    bic: customer?.bic || "",
    nomBanque: customer?.nomBanque || "",
    estVendeur: customer?.estVendeur ?? false,
    estMicroEntreprise: customer?.estMicroEntreprise ?? false,
    identifiantPdp: customer?.identifiantPdp || "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBanque, setShowBanque] = useState(false);

  const set = (f) => (e) =>
    setForm((p) => ({
      ...p,
      [f]:
        e.target?.type === "checkbox"
          ? e.target.checked
          : (e.target?.value ?? e),
    }));

  // Validation temps réel SIREN
  const sirenValide = form.siren.length === 9 ? validerSiren(form.siren) : null;
  const siretValide =
    form.siret.length === 14 ? validerSiret(form.siret) : null;

  const valider = () => {
    const e = {};
    if (!form.raisonSociale) e.raisonSociale = "Raison sociale requise";
    if (!form.siren) e.siren = "SIREN requis (9 chiffres)";
    else if (!validerSiren(form.siren)) e.siren = "SIREN invalide";
    if (form.siret && !validerSiret(form.siret))
      e.siret = "SIRET invalide (14 chiffres)";
    if (!form.adresse) e.adresse = "Adresse requise";
    if (!form.codePostal) e.codePostal = "Code postal requis";
    if (!form.ville) e.ville = "Ville requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valider()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        capitalSocial: form.capitalSocial ? Number(form.capitalSocial) : null,
        id: customer?.id,
      };
      if (isEdit) {
        await customerApi.update(customer.id, payload);
        toast.success("Client mis à jour !");
      } else {
        await customerApi.create(payload);
        toast.success("Client créé !");
      }
      onSave();
    } catch {
      /* géré par intercepteur */
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* En-tête */}
      <div
        className="flex items-center justify-between px-4 py-3
                      bg-emerald-50 border-b border-emerald-100"
      >
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-emerald-800 text-sm">
            {isEdit
              ? `Modifier : ${customer.raisonSociale}`
              : "Nouveau client / émetteur"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type de client */}
        <div className="flex gap-3">
          <label
            className="flex items-center gap-2 cursor-pointer flex-1
                            p-3 rounded-xl border-2 transition-colors
                            border-emerald-200 bg-emerald-50"
          >
            <input
              type="checkbox"
              checked={form.estVendeur}
              onChange={set("estVendeur")}
              className="w-4 h-4 accent-emerald-600"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Émetteur</p>
              <p className="text-xs text-emerald-600">
                Peut émettre des factures
              </p>
            </div>
          </label>
          <label
            className="flex items-center gap-2 cursor-pointer flex-1
                            p-3 rounded-xl border-2 transition-colors
                            border-blue-200 bg-blue-50"
          >
            <input
              type="checkbox"
              checked={form.estMicroEntreprise}
              onChange={set("estMicroEntreprise")}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Micro-entreprise
              </p>
              <p className="text-xs text-blue-600">TVA non applicable 293B</p>
            </div>
          </label>
        </div>

        {/* Identification */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Identification légale
          </h3>
          <Field label="Raison sociale" required error={errors.raisonSociale}>
            <input
              type="text"
              value={form.raisonSociale}
              onChange={set("raisonSociale")}
              placeholder="Ma Société SAS"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="SIREN"
              required
              error={errors.siren}
              hint="9 chiffres — identifiant INSEE"
            >
              <div className="relative">
                <input
                  type="text"
                  value={form.siren}
                  onChange={set("siren")}
                  maxLength={9}
                  placeholder="123456789"
                  className={`${inputCls} ${
                    sirenValide === false
                      ? "border-red-300"
                      : sirenValide === true
                        ? "border-green-400"
                        : ""
                  }`}
                />
                {sirenValide !== null && (
                  <span
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-sm
                    ${sirenValide ? "text-green-500" : "text-red-500"}`}
                  >
                    {sirenValide ? "✓" : "✗"}
                  </span>
                )}
              </div>
            </Field>
            <Field
              label="SIRET"
              error={errors.siret}
              hint="14 chiffres (optionnel)"
            >
              <div className="relative">
                <input
                  type="text"
                  value={form.siret}
                  onChange={set("siret")}
                  maxLength={14}
                  placeholder="12345678900015"
                  className={`${inputCls} ${
                    siretValide === false
                      ? "border-red-300"
                      : siretValide === true
                        ? "border-green-400"
                        : ""
                  }`}
                />
                {siretValide !== null && (
                  <span
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-sm
                    ${siretValide ? "text-green-500" : "text-red-500"}`}
                  >
                    {siretValide ? "✓" : "✗"}
                  </span>
                )}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° TVA intracommunautaire" hint="FR + 2 car. + SIREN">
              <input
                type="text"
                value={form.numeroTvaIntracommunautaire}
                onChange={set("numeroTvaIntracommunautaire")}
                placeholder="FR12123456789"
                className={inputCls}
              />
            </Field>
            <Field label="Forme juridique">
              <select
                value={form.formeJuridique}
                onChange={set("formeJuridique")}
                className={selectCls}
              >
                <option value="">— Choisir —</option>
                {[
                  "SAS",
                  "SARL",
                  "SA",
                  "EURL",
                  "SASU",
                  "EI",
                  "Auto-entrepreneur",
                  "Association",
                  "Autre",
                ].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Capital social (€)">
              <input
                type="number"
                value={form.capitalSocial}
                onChange={set("capitalSocial")}
                placeholder="10000"
                className={inputCls}
              />
            </Field>
            <Field label="Numéro RCS">
              <input
                type="text"
                value={form.numeroRcs}
                onChange={set("numeroRcs")}
                placeholder="RCS Paris B 123 456 789"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Adresse
          </h3>
          <Field label="Adresse" required error={errors.adresse}>
            <input
              type="text"
              value={form.adresse}
              onChange={set("adresse")}
              placeholder="1 rue de la Paix"
              className={inputCls}
            />
          </Field>
          <Field label="Complément d'adresse">
            <input
              type="text"
              value={form.complementAdresse}
              onChange={set("complementAdresse")}
              placeholder="Bâtiment A, 3e étage"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code postal" required error={errors.codePostal}>
              <input
                type="text"
                value={form.codePostal}
                onChange={set("codePostal")}
                maxLength={5}
                placeholder="75001"
                className={inputCls}
              />
            </Field>
            <Field label="Ville" required error={errors.ville}>
              <input
                type="text"
                value={form.ville}
                onChange={set("ville")}
                placeholder="Paris"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pays">
              <select
                value={form.pays}
                onChange={set("pays")}
                className={selectCls}
              >
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
              </select>
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="contact@societe.fr"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Téléphone">
            <input
              type="tel"
              value={form.telephone}
              onChange={set("telephone")}
              placeholder="01 23 45 67 89"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Coordonnées bancaires (accordéon) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowBanque(!showBanque)}
            className="w-full flex items-center justify-between px-4 py-3
                       text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Coordonnées bancaires
              </span>
              {form.iban && (
                <span
                  className="text-xs bg-green-100 text-green-700
                                 px-2 py-0.5 rounded-full"
                >
                  IBAN renseigné
                </span>
              )}
            </div>
            {showBanque ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showBanque && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
              <Field label="IBAN" hint="FR76 3000 6000 0112 3456 7890 189">
                <input
                  type="text"
                  value={form.iban}
                  onChange={set("iban")}
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="BIC / SWIFT">
                  <input
                    type="text"
                    value={form.bic}
                    onChange={set("bic")}
                    placeholder="BNPAFRPPXXX"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Nom de la banque">
                  <input
                    type="text"
                    value={form.nomBanque}
                    onChange={set("nomBanque")}
                    placeholder="BNP Paribas"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* PDP DGFiP 2026 (émetteurs uniquement) */}
        {form.estVendeur && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              PDP DGFiP 2026
            </h3>
            <Field
              label="Identifiant PDP (BT-23)"
              hint="Requis pour la transmission des factures électroniques"
            >
              <input
                type="text"
                value={form.identifiantPdp}
                onChange={set("identifiantPdp")}
                placeholder="PDP-001"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2
                       py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700
                       disabled:opacity-50 text-white font-semibold text-sm
                       transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enregistrement…
              </>
            ) : (
              <>
                <Check size={16} /> {isEdit ? "Mettre à jour" : "Créer"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-gray-200
                       text-gray-600 hover:bg-gray-50 font-medium text-sm
                       transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Carte Client ─────────────────────────────────────────
function CustomerCard({ customer, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900 text-sm">
              {customer.raisonSociale}
            </span>
            {customer.estVendeur && (
              <span
                className="text-xs bg-emerald-100 text-emerald-700
                               px-2 py-0.5 rounded-full font-semibold"
              >
                Émetteur
              </span>
            )}
            {customer.estMicroEntreprise && (
              <span
                className="text-xs bg-amber-100 text-amber-700
                               px-2 py-0.5 rounded-full font-semibold"
              >
                Micro
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            SIREN : {customer.siren}
            {customer.siret && ` · SIRET : ${formatSiret(customer.siret)}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {customer.adresse}, {customer.codePostal} {customer.ville}
          </p>
          {customer.email && (
            <p className="text-xs text-gray-400">{customer.email}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(customer)}
            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500
                       hover:text-blue-700 transition-colors"
            title="Modifier"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-400
                       hover:text-red-600 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════
export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll();
      setCustomers(res.data || []);
    } catch {
      toast.error("Erreur de chargement des clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Filtrage local
  const filtered = customers.filter((c) => {
    const matchSearch =
      !search ||
      c.raisonSociale?.toLowerCase().includes(search.toLowerCase()) ||
      c.siren?.includes(search) ||
      c.ville?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "tous"
        ? true
        : filter === "emetteurs"
          ? c.estVendeur
          : filter === "clients"
            ? !c.estVendeur
            : true;
    return matchSearch && matchFilter;
  });

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (customer) => {
    if (deleteConfirm?.id !== customer.id) {
      setDeleteConfirm(customer);
      return;
    }
    try {
      await customerApi.delete(customer.id);
      toast.success(`${customer.raisonSociale} supprimé`);
      setDeleteConfirm(null);
      loadCustomers();
    } catch {
      /* géré par intercepteur */
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditCustomer(null);
    loadCustomers();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Clients & Émetteurs
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {customers.length} fiche(s) enregistrée(s)
          </p>
        </div>
        <button
          onClick={() => {
            setEditCustomer(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-emerald-600 hover:bg-emerald-700 text-white
                     font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {/* Formulaire (création ou édition) */}
      {showForm && (
        <CustomerForm
          customer={editCustomer}
          onSave={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditCustomer(null);
          }}
        />
      )}

      {/* Recherche + filtre */}
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
            placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl
                       border border-gray-200 outline-none
                       focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200
                     bg-white outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="tous">Tous</option>
          <option value="emetteurs">Émetteurs</option>
          <option value="clients">Clients</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {search ? "Aucun résultat" : "Aucun client enregistré"}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700
                         text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Créer le premier client
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Confirmation suppression */}
          {deleteConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-3">
                Supprimer <strong>{deleteConfirm.raisonSociale}</strong> ?
              </p>
              <p className="text-xs text-red-600 mb-3">
                Impossible si ce client est associé à des factures (archives
                légales 10 ans).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700
                             text-white text-sm font-semibold transition-colors"
                >
                  Confirmer la suppression
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200
                             text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {filtered.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
