// ============================================================
// src/api/apiClient.js
// Client HTTP Axios — communication avec l'API ASP.NET Core 8
//
// CORRECTIONS :
// — Ajout invoiceApi.update() manquant (utilisé dans InvoiceForm)
// — Ajout quoteApi.update() manquant (utilisé dans QuoteForm)
// — Ajout helper telechargerBlob() réutilisable
// — Gestion d'erreur centralisée avec messages précis
// ============================================================
import axios from "axios";
import toast from "react-hot-toast";

// URL de base : proxy via package.json en dev → /api/* → https://localhost:5001
const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 30000, // 30s pour la génération PDF
});

// ─── Intercepteur requêtes ────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Intercepteur réponses ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const msg =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      "Erreur inconnue";
    const status = error.response?.status;
    if (status === 400) toast.error(`Données invalides : ${msg}`);
    else if (status === 404) toast.error(`Introuvable : ${msg}`);
    else if (status === 409) toast.error(`Conflit : ${msg}`);
    else if (status >= 500) toast.error(`Erreur serveur : ${msg}`);
    else if (!error.response)
      toast.error(
        "Serveur injoignable — vérifiez que le backend est démarré sur https://localhost:5001",
      );
    return Promise.reject(error);
  },
);

// ═══ API Factures ═════════════════════════════════════════
export const invoiceApi = {
  getAll: (params) => apiClient.get("/api/invoice", { params }),
  getById: (id) => apiClient.get(`/api/invoice/${id}`),
  create: (data) => apiClient.post("/api/invoice", data),
  // CORRECTION : méthode update manquante — utilisée en mode édition (InvoiceForm)
  update: (id, data) => apiClient.put(`/api/invoice/${id}`, data),
  updateStatut: (id, statut, motif = null) =>
    apiClient.patch(`/api/invoice/${id}/statut`, { statut, motifRefus: motif }),
  enregistrerRelance: (id) => apiClient.post(`/api/invoice/${id}/relance`),
  downloadPdf: (id) =>
    apiClient.get(`/api/invoice/${id}/pdf`, { responseType: "blob" }),
  downloadXml: (id) =>
    apiClient.get(`/api/invoice/${id}/xml`, { responseType: "blob" }),
};

// ═══ API Devis ════════════════════════════════════════════
export const quoteApi = {
  getAll: (params) => apiClient.get("/api/quote", { params }),
  getById: (id) => apiClient.get(`/api/quote/${id}`),
  create: (data) => apiClient.post("/api/quote", data),
  // CORRECTION : méthode update manquante — utilisée en mode édition (QuoteForm)
  update: (id, data) => apiClient.put(`/api/quote/${id}`, data),
  updateStatut: (id, statut) =>
    apiClient.patch(`/api/quote/${id}/statut`, JSON.stringify(statut), {
      headers: { "Content-Type": "application/json" },
    }),
  convertirEnFacture: (id, data) =>
    apiClient.post(`/api/quote/${id}/convertir`, data),
};

// ═══ API Clients ══════════════════════════════════════════
export const customerApi = {
  getAll: (params) => apiClient.get("/api/customer", { params }),
  getVendeurs: () =>
    apiClient.get("/api/customer", { params: { vendeurSeulement: true } }),
  getById: (id) => apiClient.get(`/api/customer/${id}`),
  create: (data) => apiClient.post("/api/customer", data),
  update: (id, data) => apiClient.put(`/api/customer/${id}`, data),
  delete: (id) => apiClient.delete(`/api/customer/${id}`),
};

// ═══ API Dashboard ════════════════════════════════════════
export const dashboardApi = {
  getStats: () => apiClient.get("/api/dashboard/stats"),
};

// ═══ API Signature ════════════════════════════════════════
export const signatureApi = {
  signer: (id) => apiClient.post(`/api/signature/${id}/signer`),
  verifier: (id) => apiClient.get(`/api/signature/${id}/verifier`),
  getClePublique: () => apiClient.get("/api/signature/cle-publique"),
  validerConformite: (id) => apiClient.get(`/api/signature/${id}/conformite`),
};

// ═══ API Export ═══════════════════════════════════════════
export const exportApi = {
  transmettreAuPdp: (id) => apiClient.post(`/api/export/${id}/pdp`),
  exporterComptabilite: (id) =>
    apiClient.get(`/api/export/${id}/comptabilite`, { responseType: "blob" }),
};

// ═══ Helper téléchargement blob ═══════════════════════════
/**
 * Déclenche le téléchargement d'un fichier depuis un blob Axios.
 * @param {Blob}   blobData   — res.data d'une requête responseType:'blob'
 * @param {string} nomFichier — ex: "facture_FA-2026-01-0001.pdf"
 * @param {string} mimeType   — ex: "application/pdf"
 */
export const telechargerBlob = (
  blobData,
  nomFichier,
  mimeType = "application/octet-stream",
) => {
  const blob = new Blob([blobData], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default apiClient;
