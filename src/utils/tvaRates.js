// ============================================================
// src/utils/tvaRates.js
// Taux TVA France 2026, statuts DGFiP, moyens de paiement,
// validateurs SIREN/SIRET/TVA et fonctions utilitaires
// ============================================================

// ============================================================
// TAUX TVA FRANCE 2026
// Tous les taux applicables en France métropolitaine
// Chaque valeur "value" correspond EXACTEMENT à l'enum
// TvaCategory du backend C# (sérialisation string)
// ============================================================
export const TVA_RATES = [
  {
    value: "Normale",
    taux: 20.0,
    label: "20% — Taux normal",
    description:
      "Taux standard applicable à la majorité des biens et services " +
      "(art. 278 CGI)",
    codeXml: "S", // Code UNCL5305 utilisé dans le XML EN 16931
    color: "#dc3545",
  },
  {
    value: "Intermediaire",
    taux: 10.0,
    label: "10% — Taux intermédiaire",
    description:
      "Restauration, travaux de rénovation, transport de voyageurs, " +
      "médicaments non remboursables (art. 278bis CGI)",
    codeXml: "AA",
    color: "#fd7e14",
  },
  {
    value: "Reduite",
    taux: 5.5,
    label: "5,5% — Taux réduit",
    description:
      "Produits alimentaires, livres, abonnements gaz/électricité, " +
      "travaux d'économies d'énergie (art. 278-0 bis CGI)",
    codeXml: "AA",
    color: "#ffc107",
  },
  {
    value: "SuperReduite",
    taux: 2.1,
    label: "2,1% — Taux super réduit",
    description:
      "Médicaments remboursables par la Sécurité sociale, " +
      "publications de presse enregistrées (art. 281 quater CGI)",
    codeXml: "AA",
    color: "#20c997",
  },
  {
    value: "Exonere",
    taux: 0,
    label: "0% — Exonéré de TVA",
    description:
      "Exportations hors UE, livraisons intracommunautaires, " +
      "opérations bancaires, éducation, santé (art. 261 à 262 CGI)",
    codeXml: "E",
    color: "#0dcaf0",
  },
  {
    value: "MicroEntreprise",
    taux: 0,
    label: "Non applicable — Art. 293B CGI",
    description:
      "Micro-entreprise en franchise de base de TVA. " +
      'La mention "TVA non applicable, art. 293 B du CGI" ' +
      "est ajoutée automatiquement sur la facture.",
    codeXml: "O",
    mention: "TVA non applicable, art. 293 B du CGI",
    color: "#6c757d",
  },
];

/**
 * Retourne les informations d'un taux TVA par sa valeur enum.
 * @param {string} value - Ex: 'Normale', 'Reduite', 'MicroEntreprise'
 * @returns {object} Objet TVA_RATES correspondant, ou Normale par défaut
 */
export const getTvaRate = (value) =>
  TVA_RATES.find((r) => r.value === value) || TVA_RATES[0];

/**
 * Retourne le taux numérique d'une catégorie TVA.
 * @param {string} value - Valeur enum de la catégorie
 * @returns {number} Taux en % (ex: 20, 5.5, 0)
 */
export const getTauxNumerique = (value) => getTvaRate(value).taux;

// ============================================================
// DÉLAIS DE PAIEMENT
// Conformément à l'art. L441-10 du Code de commerce :
// délai maximum légal B2B = 60 jours date de facture
// ============================================================
export const DELAIS_PAIEMENT = [
  { value: 0, label: "Comptant (paiement immédiat)" },
  { value: 15, label: "15 jours" },
  { value: 30, label: "30 jours (standard)" },
  { value: 45, label: "45 jours fin de mois" },
  { value: 60, label: "60 jours (maximum légal B2B)" },
];

// ============================================================
// MOYENS DE PAIEMENT
// Valeurs correspondant EXACTEMENT à l'enum PaymentMeanCode C#
// ============================================================
export const MOYENS_PAIEMENT = [
  { value: "Virement", label: "Virement bancaire SEPA", icon: "🏦" },
  { value: "Cheque", label: "Chèque", icon: "📝" },
  { value: "Prelevement", label: "Prélèvement SEPA", icon: "🔄" },
  { value: "Especes", label: "Espèces", icon: "💵" },
  { value: "CarteCredit", label: "Carte bancaire", icon: "💳" },
  { value: "LCR", label: "LCR (Lettre de Change)", icon: "📄" },
];

// ============================================================
// STATUTS DE FACTURE — CYCLE DE VIE DGFIP 2026
// Valeurs correspondant EXACTEMENT à l'enum InvoiceStatus C#
// Chaque statut a : label (affiché), color (classes Tailwind),
// icon (emoji)
// ============================================================
export const INVOICE_STATUTS = {
  Brouillon: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700",
    icon: "📝",
  },
  Deposee: { label: "Déposée", color: "bg-blue-100 text-blue-700", icon: "📤" },
  EnvoyeeAcheteur: {
    label: "Envoyée acheteur",
    color: "bg-indigo-100 text-indigo-700",
    icon: "📨",
  },
  Recue: { label: "Reçue", color: "bg-cyan-100 text-cyan-700", icon: "📥" },
  EnTraitement: {
    label: "En traitement",
    color: "bg-yellow-100 text-yellow-700",
    icon: "⏳",
  },
  Acceptee: {
    label: "Acceptée",
    color: "bg-green-100 text-green-700",
    icon: "✅",
  },
  Refusee: { label: "Refusée", color: "bg-red-100 text-red-700", icon: "❌" },
  EnLitige: {
    label: "En litige",
    color: "bg-orange-100 text-orange-700",
    icon: "⚠️",
  },
  Payee: {
    label: "Payée",
    color: "bg-emerald-100 text-emerald-700",
    icon: "💰",
  },
  Annulee: { label: "Annulée", color: "bg-gray-200 text-gray-500", icon: "🚫" },
  Archivee: {
    label: "Archivée",
    color: "bg-slate-100 text-slate-500",
    icon: "🗄️",
  },
};

// ============================================================
// STATUTS DE DEVIS / BON DE COMMANDE
// Valeurs correspondant EXACTEMENT à l'enum QuoteStatus C#
// ============================================================
export const QUOTE_STATUTS = {
  Brouillon: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  EnvoyeClient: {
    label: "Envoyé au client",
    color: "bg-blue-100 text-blue-700",
  },
  AccepteClient: { label: "Accepté", color: "bg-green-100 text-green-700" },
  RefuseClient: { label: "Refusé", color: "bg-red-100 text-red-700" },
  Expire: { label: "Expiré", color: "bg-gray-200 text-gray-500" },
  ConvVertiEnFacture: {
    label: "Converti en facture",
    color: "bg-purple-100 text-purple-700",
  },
};

// ============================================================
// VALIDATEURS SIREN / SIRET / TVA / IBAN
// ============================================================

/**
 * Algorithme de Luhn — vérifie la clé de contrôle.
 * Utilisé pour valider SIREN (9 chiffres) et SIRET (14 chiffres).
 * @param {string} numero - Chaîne de chiffres uniquement
 * @returns {boolean}
 */
const algorithmeluhn = (numero) => {
  let somme = 0;
  let alterner = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let n = parseInt(numero[i], 10);
    if (alterner) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
    alterner = !alterner;
  }
  return somme % 10 === 0;
};

/**
 * Valide un numéro SIREN (9 chiffres) par l'algorithme de Luhn.
 * @param {string} siren
 * @returns {boolean}
 */
export const validerSiren = (siren) => {
  if (!siren) return false;
  const s = siren.replace(/\s/g, "");
  if (!/^\d{9}$/.test(s)) return false;
  return algorithmeluhn(s);
};

/**
 * Valide un numéro SIRET (14 chiffres = SIREN + NIC).
 * Cas particulier : La Poste (SIREN 356000000) = toujours valide.
 * @param {string} siret
 * @returns {boolean}
 */
export const validerSiret = (siret) => {
  if (!siret) return false;
  const s = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(s)) return false;
  if (s.startsWith("356000000")) return true; // La Poste
  return algorithmeluhn(s);
};

/**
 * Valide un numéro de TVA intracommunautaire français.
 * Format : FR + 2 caractères alphanumériques + 9 chiffres SIREN
 * Ex valides : FR12345678901, FRAB345678901
 * @param {string} numeroTva
 * @returns {boolean} true si valide ou vide (champ optionnel)
 */
export const validerTvaIntracommunautaire = (numeroTva) => {
  if (!numeroTva) return true; // Champ optionnel
  const n = numeroTva.replace(/\s/g, "").toUpperCase();
  return /^FR[A-Z0-9]{2}\d{9}$/.test(n);
};

/**
 * Valide un IBAN français (FR + 25 caractères alphanumériques).
 * Vérifie la structure ET le code de contrôle modulo 97.
 *
 * CORRECTION : BigInt() peut échouer si la chaîne contient des
 * espaces résiduels ou des caractères inattendus après le map().
 * On utilise à la place un modulo par blocs de 9 chiffres,
 * plus robuste et compatible avec tous les environnements JS.
 *
 * @param {string} iban
 * @returns {boolean} true si valide ou vide (champ optionnel)
 */
export const validerIban = (iban) => {
  if (!iban) return true; // Champ optionnel — pas d'erreur si vide

  // 1. Nettoyer : supprimer espaces, tirets, mettre en majuscules
  const i = iban.replace(/[\s\-]/g, "").toUpperCase();

  // 2. Vérifier le format FR + 2 chiffres + 23 caractères alphanumériques
  if (!/^FR\d{2}[A-Z0-9]{23}$/.test(i)) return false;

  // 3. Réorganiser : déplacer les 4 premiers caractères à la fin
  //    "FR7630..." → "7630...FR76"
  const rearranged = i.slice(4) + i.slice(0, 4);

  // 4. Convertir les lettres en chiffres (A=10, B=11, ... Z=35)
  //    Chaque caractère est converti individuellement pour éviter
  //    les erreurs de BigInt sur de très longues chaînes
  const numeric = rearranged
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      // Si c'est un chiffre (0-9) : retourner tel quel
      // Si c'est une lettre (A-Z) : A=10, B=11, ..., Z=35
      return code >= 48 && code <= 57
        ? c // chiffre → inchangé
        : String(code - 55); // lettre → nombre à 2 chiffres
    })
    .join("");

  // 5. Vérifier que la chaîne ne contient que des chiffres
  if (!/^\d+$/.test(numeric)) return false;

  // 6. Calcul modulo 97 par blocs de 9 chiffres
  //    Cette méthode évite les problèmes de précision sur les grands entiers
  //    et ne dépend pas de BigInt.
  //    Principe : on calcule (reste × 10^n + bloc) % 97 de gauche à droite
  let reste = 0;
  for (let j = 0; j < numeric.length; j += 9) {
    const bloc = reste.toString() + numeric.slice(j, j + 9);
    reste = parseInt(bloc, 10) % 97;
  }

  // 7. Un IBAN valide doit donner un reste de 1
  return reste === 1;
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Formate un montant en euros selon le format français.
 * Ex: 1234.5 → "1 234,50 €"
 * @param {number} montant
 * @returns {string}
 */
export const formatEuros = (montant) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant || 0);

/**
 * Formate une date ISO en format français jj/mm/aaaa.
 * Retourne "—" si la date est nulle ou invalide.
 * @param {string|null} dateStr - Date ISO 8601 ou null
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Calcule le nombre de jours de retard d'une facture.
 * Retourne 0 si la date d'échéance n'est pas encore dépassée.
 * @param {string|null} dateEcheance - Date ISO 8601
 * @returns {number} Nombre de jours de retard (≥ 0)
 */
export const calculerJoursRetard = (dateEcheance) => {
  if (!dateEcheance) return 0;
  const diff = new Date() - new Date(dateEcheance);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Calcule la date d'échéance à partir d'une date de facture
 * et d'un délai en jours.
 * @param {string} dateFacture - Date ISO 8601 (ex: "2026-01-15")
 * @param {number} delaiJours  - Nombre de jours (ex: 30)
 * @returns {string} Date d'échéance au format YYYY-MM-DD
 */
export const calculerEcheance = (dateFacture, delaiJours) => {
  const d = new Date(dateFacture);
  d.setDate(d.getDate() + Number(delaiJours));
  return d.toISOString().split("T")[0];
};

/**
 * Génère un numéro de facture au format DGFiP 2026.
 * Format : FA-AAAA-MM-XXXX (séquentiel sur l'année et le mois)
 * Ex: FA-2026-01-0042
 * @param {number} compteur - Numéro séquentiel (1 à 9999)
 * @returns {string}
 */
export const genererNumeroFacture = (compteur) => {
  const now = new Date();
  const annee = now.getFullYear();
  const mois = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(compteur).padStart(4, "0");
  return `FA-${annee}-${mois}-${seq}`;
};

/**
 * Génère un numéro de devis au format recommandé.
 * Format : DEV-AAAA-XXXX
 * Ex: DEV-2026-0017
 * @param {number} compteur - Numéro séquentiel
 * @returns {string}
 */
export const genererNumeroDevis = (compteur) => {
  const annee = new Date().getFullYear();
  const seq = String(compteur).padStart(4, "0");
  return `DEV-${annee}-${seq}`;
};

/**
 * Formate un numéro SIRET en groupes lisibles.
 * Ex: "12345678900015" → "123 456 789 00015"
 * @param {string} siret
 * @returns {string}
 */
export const formatSiret = (siret) => {
  if (!siret) return "";
  const s = siret.replace(/\s/g, "");
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
};

/**
 * Formate un numéro SIREN en groupes lisibles.
 * Ex: "123456789" → "123 456 789"
 * @param {string} siren
 * @returns {string}
 */
export const formatSiren = (siren) => {
  if (!siren) return "";
  const s = siren.replace(/\s/g, "");
  return s.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
};
