// ============================================================
// Types — derived directly from backend SQLAlchemy models
// ============================================================

/** Matches backend: models/financial_statements.py → FinancialStatement */
export interface FinancialStatement {
  id: number;
  document_id: number;
  statement_type: 
    | "standalone_income_statement" 
    | "standalone_balance_sheet" 
    | "standalone_cash_flow"
    | "consolidated_income_statement" 
    | "consolidated_balance_sheet" 
    | "consolidated_cash_flow"
    | "income_statement" 
    | "balance_sheet" 
    | "cash_flow";
  data_json: string;
}

/** Matches backend: models/workbooks.py → Workbook */
export interface Workbook {
  id: number;
  document_id: number;
  file_path: string;
}

/** Matches backend: models/document_extraction.py → DocumentExtraction */
export interface DocumentExtraction {
  id: number;
  document_id: number;
  raw_text: string;
}

/** Matches backend: models/financial_analysis.py → FinancialAnalysis */
export interface FinancialAnalysisRecord {
  id: number;
  document_id: number;
  analysis_json: string;
}

/**
 * Document list item — returned by GET /documents/
 * (SQLAlchemy model serialized via FastAPI, no relationships)
 */
export interface DocumentListItem {
  id: number;
  filename: string;
  file_path: string;
  status: string;
}

/**
 * Full document detail — returned by GET /documents/{id}
 * Includes all related entities explicitly queried by document_service.
 */
export interface DocumentDetail {
  id: number;
  filename: string;
  file_path: string;
  status: string;
  extraction: DocumentExtraction | null;
  financial_statements: FinancialStatement[];
  analysis: FinancialAnalysisRecord | null;
  workbook: Workbook | null;
}

/**
 * Parsed analysis data.
 * Keys use the exact strings the backend analysis_service produces.
 */
export interface FinancialAnalysis {
  Revenue: number;
  "Net Profit": number;
  "Profit Margin (%)": number;
}

/** Generic message response from backend */
export interface MessageResponse {
  message: string;
  document_id?: number;
  file_path?: string;
}

/** Error response from backend */
export interface ErrorResponse {
  error: string;
}

// ============================================================
// UI helper types
// ============================================================

export type WorkflowStep =
  | "uploaded"
  | "extracted"
  | "statements"
  | "analyzed"
  | "workbook";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}
