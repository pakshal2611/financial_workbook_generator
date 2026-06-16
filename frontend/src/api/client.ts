import axios from "axios";
import type {
  DocumentListItem,
  DocumentDetail,
  DocumentExtraction,
  FinancialAnalysis,
  MessageResponse,
} from "../types";

// ============================================================
// Axios instance — all requests go through the Vite dev proxy
// ============================================================

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 second timeout
});

// Add error interceptor for better debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout - backend may be slow or unresponsive");
    } else if (error.code === "ECONNREFUSED" || !error.response) {
      console.error(
        "Connection refused - is backend running on http://localhost:8000?",
        error.message
      );
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Health Check
// ============================================================

/** GET / — check if backend is alive */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await axios.get("http://localhost:8000/", {
      timeout: 5000,
    });
    console.log("✓ Backend is reachable:", response.data);
    return true;
  } catch (error) {
    console.error("✗ Backend is not reachable:", error);
    return false;
  }
}

// ============================================================
// Documents
// ============================================================

/** POST /documents/upload — multipart file upload */
export async function uploadDocument(file: File): Promise<DocumentListItem> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<DocumentListItem>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** GET /documents/ — list all documents (no relationships) */
export async function getDocuments(): Promise<DocumentListItem[]> {
  const { data } = await api.get<DocumentListItem[]>("/documents/");
  return data;
}

/** GET /documents/{id} — single document WITH all related data */
export async function getDocument(id: number): Promise<DocumentDetail> {
  const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
  return data;
}

/** DELETE /documents/{id} */
export async function deleteDocument(id: number): Promise<DocumentListItem> {
  const { data } = await api.delete<DocumentListItem>(`/documents/${id}`);
  return data;
}

// ============================================================
// Extraction
// ============================================================

/** POST /extractions/{documentId} — extract text from PDF */
export async function extractText(
  documentId: number
): Promise<DocumentExtraction> {
  const { data } = await api.post<DocumentExtraction>(
    `/extractions/${documentId}`
  );
  return data;
}

// ============================================================
// Financial Statements
// ============================================================

/** POST /financial-statements/extract/{documentId} */
export async function extractStatements(
  documentId: number
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(
    `/financial-statements/extract/${documentId}`
  );
  return data;
}

// ============================================================
// Analysis
// ============================================================

/** POST /analysis/{documentId} */
export async function generateAnalysis(
  documentId: number
): Promise<FinancialAnalysis> {
  const { data } = await api.post<FinancialAnalysis>(
    `/analysis/${documentId}`
  );
  return data;
}

// ============================================================
// Workbook
// ============================================================

/** POST /workbook/{documentId} */
export async function generateWorkbook(
  documentId: number
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(
    `/workbook/${documentId}`
  );
  return data;
}
