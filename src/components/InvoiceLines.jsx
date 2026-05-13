// ============================================================
// src/components/InvoiceLines.jsx
// Gestion des lignes de facture avec TVA multi-taux
// Interface mobile-first : chaque ligne est une carte
// CORRECTION : import React unique + fichier séparé de StatusBadge
// ============================================================
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { TVA_RATES, formatEuros } from "../utils/tvaRates";

/**
 * Composant de gestion des lignes d'une facture ou d'un devis.
 *
 * Props :
 * @param {Array}    lines    - Tableau des lignes courantes
 * @param {Function} onChange - Callback appelé à chaque modification
 * @param {boolean}  isMicro  - Si true : TVA non applicable (art. 293B CGI)
 *
 * Chaque ligne contient :
 *   numeroLigne, description, referenceVendeur, quantite, unite,
 *   prixUnitaireHT, remiseMontant, categorieTva, tauxTva,
 *   totalHT, montantTva, totalTTC
 */
export function InvoiceLines({ lines, onChange, isMicro = false }) {
  // ─── Calcul des montants d'une ligne ──────────────────
  const calculerLigne = (ligne) => {
    const taux = isMicro
      ? 0
      : (TVA_RATES.find((r) => r.value === ligne.categorieTva)?.taux ?? 20);
    const totalHt =
      Math.round(
        (ligne.quantite * ligne.prixUnitaireHT - (ligne.remiseMontant || 0)) *
          100,
      ) / 100;
    const montantTva = Math.round(((totalHt * taux) / 100) * 100) / 100;
    return {
      ...ligne,
      tauxTva: taux,
      totalHT: totalHt,
      montantTva: montantTva,
      totalTTC: totalHt + montantTva,
    };
  };

  // ─── Modification d'un champ ──────────────────────────
  const updateLine = (idx, field, value) => {
    const updated = lines.map((l, i) => {
      if (i !== idx) return l;
      return calculerLigne({ ...l, [field]: value });
    });
    onChange(updated);
  };

  // ─── Ajout d'une ligne vide ───────────────────────────
  const addLine = () => {
    const newLine = calculerLigne({
      numeroLigne: lines.length + 1,
      description: "",
      referenceVendeur: "",
      quantite: 1,
      unite: "UN",
      prixUnitaireHT: 0,
      remiseMontant: 0,
      categorieTva: isMicro ? "MicroEntreprise" : "Normale",
      tauxTva: isMicro ? 0 : 20,
      totalHT: 0,
      montantTva: 0,
      totalTTC: 0,
    });
    onChange([...lines, newLine]);
  };

  // ─── Suppression d'une ligne ──────────────────────────
  const removeLine = (idx) => {
    onChange(
      lines
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, numeroLigne: i + 1 })),
    );
  };

  // ─── Totaux globaux ───────────────────────────────────
  const totalHT = lines.reduce((s, l) => s + (l.totalHT || 0), 0);
  const totalTVA = lines.reduce((s, l) => s + (l.montantTva || 0), 0);
  const totalTTC = totalHT + totalTVA;

  // ─── Ventilation TVA groupée par taux ─────────────────
  const ventilationTva = lines.reduce((acc, l) => {
    const key = `${l.categorieTva}-${l.tauxTva}`;
    if (!acc[key]) {
      const rate = TVA_RATES.find((r) => r.value === l.categorieTva);
      acc[key] = {
        label: rate?.label || l.categorieTva,
        taux: l.tauxTva,
        baseHT: 0,
        montantTva: 0,
      };
    }
    acc[key].baseHT += l.totalHT || 0;
    acc[key].montantTva += l.montantTva || 0;
    return acc;
  }, {});

  // ─── Classes CSS partagées ────────────────────────────
  const inputCls = `w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                    focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                    outline-none`;

  return (
    <div className="space-y-3">
      {/* ══ LISTE DES LIGNES ═════════════════════════════ */}
      {lines.map((ligne, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-gray-200
                     overflow-hidden shadow-sm animate-fade-in"
        >
          {/* ── En-tête de carte ligne ── */}
          <div
            className="flex items-center justify-between
                          px-4 py-2 bg-gray-50 border-b border-gray-100"
          >
            <span
              className="text-xs font-semibold text-gray-500
                             uppercase tracking-wide"
            >
              Ligne {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeLine(idx)}
              aria-label={`Supprimer la ligne ${idx + 1}`}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600
                         hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* ── Corps de la carte ── */}
          <div className="p-4 space-y-3">
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ligne.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                placeholder="Intitulé du produit ou service"
                className={inputCls}
                required
              />
            </div>

            {/* Référence + Unité */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={ligne.referenceVendeur || ""}
                  onChange={(e) =>
                    updateLine(idx, "referenceVendeur", e.target.value)
                  }
                  placeholder="REF-001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unité
                </label>
                <select
                  value={ligne.unite}
                  onChange={(e) => updateLine(idx, "unite", e.target.value)}
                  className={`${inputCls} bg-white`}
                >
                  {[
                    ["UN", "Unité"],
                    ["HUR", "Heure"],
                    ["DAY", "Jour"],
                    ["MON", "Mois"],
                    ["KGM", "Kg"],
                    ["MTR", "Mètre"],
                    ["LTR", "Litre"],
                  ].map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantité + Prix unitaire HT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={ligne.quantite}
                  onChange={(e) =>
                    updateLine(idx, "quantite", parseFloat(e.target.value) || 0)
                  }
                  className={`${inputCls} text-right`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Prix unitaire HT (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.prixUnitaireHT}
                  onChange={(e) =>
                    updateLine(
                      idx,
                      "prixUnitaireHT",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={`${inputCls} text-right`}
                />
              </div>
            </div>

            {/* Remise + Taux TVA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Remise (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.remiseMontant || 0}
                  onChange={(e) =>
                    updateLine(
                      idx,
                      "remiseMontant",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={`${inputCls} text-right`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Taux TVA <span className="text-red-500">*</span>
                </label>

                {/* Micro-entreprise : TVA non applicable */}
                {isMicro ? (
                  <div
                    className="px-3 py-2 text-xs bg-amber-50 text-amber-700
                                  rounded-lg border border-amber-200 font-medium"
                  >
                    TVA non applicable — Art. 293B CGI
                  </div>
                ) : (
                  <select
                    value={ligne.categorieTva}
                    onChange={(e) =>
                      updateLine(idx, "categorieTva", e.target.value)
                    }
                    className={`${inputCls} bg-white`}
                  >
                    {TVA_RATES.filter((r) => r.value !== "MicroEntreprise").map(
                      (r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* ── Sous-total de la ligne (calculé, lecture seule) ── */}
            <div
              className="flex items-center justify-between pt-2
                            border-t border-gray-100 text-sm"
            >
              <span className="text-gray-500">
                HT :{" "}
                <strong className="text-gray-700">
                  {formatEuros(ligne.totalHT)}
                </strong>
              </span>
              {!isMicro && (
                <span className="text-gray-500">
                  TVA :{" "}
                  <strong className="text-gray-700">
                    {formatEuros(ligne.montantTva)}
                  </strong>
                </span>
              )}
              <span className="font-bold text-emerald-700">
                TTC : {formatEuros(ligne.totalTTC)}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* ── Bouton Ajouter une ligne ── */}
      <button
        type="button"
        onClick={addLine}
        className="w-full py-3 rounded-xl border-2 border-dashed
                   border-emerald-300 text-emerald-600 hover:bg-emerald-50
                   transition-colors flex items-center justify-center
                   gap-2 text-sm font-medium"
      >
        <Plus size={18} />
        Ajouter une ligne
      </button>

      {/* ══ RÉCAPITULATIF TVA MULTI-TAUX ═════════════════ */}
      {lines.length > 0 && (
        <div
          className="bg-white rounded-xl border border-gray-200
                        overflow-hidden shadow-sm"
        >
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <h3
              className="text-xs font-semibold text-gray-500
                           uppercase tracking-wide"
            >
              Récapitulatif TVA
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {/* Ventilation par taux */}
            {Object.values(ventilationTva).map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 text-xs">{v.label}</span>
                <div className="flex gap-3 text-right">
                  <span className="text-gray-400 text-xs">
                    Base : {formatEuros(v.baseHT)}
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatEuros(v.montantTva)}
                  </span>
                </div>
              </div>
            ))}

            {/* Totaux */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span className="font-semibold">{formatEuros(totalHT)}</span>
              </div>
              {!isMicro && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total TVA</span>
                  <span className="font-semibold">{formatEuros(totalTVA)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-base font-bold
                              text-emerald-700 border-t border-gray-200 pt-2"
              >
                <span>Total TTC</span>
                <span>{formatEuros(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
