// ============================================================
// src/components/StatusBadge.jsx
// Badge coloré pour les statuts DGFiP 2026
// Utilisé dans Dashboard, InvoiceForm et QuoteForm
// ============================================================
import React from "react";
import { INVOICE_STATUTS, QUOTE_STATUTS } from "../utils/tvaRates";

/**
 * Affiche un badge coloré représentant le statut d'une facture
 * ou d'un devis, avec icône et couleur selon le statut DGFiP 2026.
 *
 * @param {string} statut - Valeur de l'enum (ex: "Payee", "Refusee")
 * @param {string} type   - "invoice" (défaut) ou "quote"
 *
 * Exemple :
 *   <StatusBadge statut="Payee" />
 *   <StatusBadge statut="ConvVertiEnFacture" type="quote" />
 */
export function StatusBadge({ statut, type = "invoice" }) {
  const map = type === "quote" ? QUOTE_STATUTS : INVOICE_STATUTS;
  const info = map[statut] || {
    label: statut,
    color: "bg-gray-100 text-gray-700",
    icon: "❓",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1
                  rounded-full text-xs font-semibold ${info.color}`}
    >
      {info.icon && (
        <span className="text-sm leading-none" aria-hidden="true">
          {info.icon}
        </span>
      )}
      {info.label}
    </span>
  );
}
