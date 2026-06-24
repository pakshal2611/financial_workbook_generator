import json
import logging

from sqlalchemy.orm import Session

from app.models.document_extraction import DocumentExtraction
from app.models.financial_statements import FinancialStatement
from app.models.document import Document

from app.services.llm_service import client
from app.services.statement_page_detector import (
    detect_financial_pages,
    detect_financial_pages_by_section,
)
import os

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("MODEL_NAME")

# The LLM prompt template.  {financial_text} is substituted at call time.
_PROMPT_TEMPLATE = """You are a financial data extraction expert.

From the financial report text below, extract three financial statements and return them as a single JSON object.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no code fences.
2. Every value MUST be a plain number (not nested by year, not a string). Use the most recent year's figures.
3. Use positive numbers for normal items. Use negative numbers for losses or outflows.
4. If a line item is not found in the text, omit that key entirely. Do NOT guess or fabricate values.
5. Use the EXACT key names shown below.

Required JSON structure:

{{
  "income_statement": {{
    "revenue": <number>,
    "other_income": <number>,
    "total_income": <number>,
    "cost_of_materials": <number>,
    "purchase_of_stock_in_trade": <number>,
    "changes_in_inventories": <number>,
    "employee_benefit_expense": <number>,
    "finance_cost": <number>,
    "depreciation_and_amortization": <number>,
    "other_expenses": <number>,
    "total_expenses": <number>,
    "profit_before_tax": <number>,
    "current_tax": <number>,
    "deferred_tax": <number>,
    "total_tax_expense": <number>,
    "profit_after_tax": <number>,
    "earnings_per_share_basic": <number>,
    "earnings_per_share_diluted": <number>
  }},
  "balance_sheet": {{
    "property_plant_and_equipment": <number>,
    "intangible_assets": <number>,
    "right_of_use_assets": <number>,
    "investments": <number>,
    "other_non_current_financial_assets": <number>,
    "deferred_tax_assets": <number>,
    "total_non_current_assets": <number>,
    "inventories": <number>,
    "trade_receivables": <number>,
    "cash_and_cash_equivalents": <number>,
    "bank_balances_other": <number>,
    "other_financial_assets": <number>,
    "other_current_assets": <number>,
    "total_current_assets": <number>,
    "total_assets": <number>,
    "equity_share_capital": <number>,
    "other_equity": <number>,
    "total_equity": <number>,
    "non_current_borrowings": <number>,
    "non_current_lease_liabilities": <number>,
    "non_current_financial_liabilities": <number>,
    "total_non_current_liabilities": <number>,
    "current_borrowings": <number>,
    "current_lease_liabilities": <number>,
    "trade_payables": <number>,
    "other_current_financial_liabilities": <number>,
    "current_tax_liabilities": <number>,
    "other_current_liabilities": <number>,
    "total_current_liabilities": <number>,
    "total_liabilities": <number>,
    "total_equity_and_liabilities": <number>
  }},
  "cash_flow": {{
    "profit_before_tax": <number>,
    "depreciation_and_amortization": <number>,
    "finance_cost": <number>,
    "interest_income": <number>,
    "operating_profit_before_working_capital_changes": <number>,
    "changes_in_trade_receivables": <number>,
    "changes_in_inventories": <number>,
    "changes_in_trade_payables": <number>,
    "changes_in_other_working_capital": <number>,
    "cash_generated_from_operations": <number>,
    "taxes_paid": <number>,
    "net_cash_from_operating_activities": <number>,
    "purchase_of_fixed_assets": <number>,
    "sale_of_fixed_assets": <number>,
    "investment_activities_other": <number>,
    "net_cash_from_investing_activities": <number>,
    "proceeds_from_borrowings": <number>,
    "repayment_of_borrowings": <number>,
    "interest_paid": <number>,
    "dividends_paid": <number>,
    "proceeds_from_issue_of_shares": <number>,
    "net_cash_from_financing_activities": <number>,
    "net_increase_in_cash": <number>,
    "cash_at_beginning": <number>,
    "cash_at_end": <number>
  }}
}}

Financial Report Text:

{financial_text}
"""


def _clean_llm_response(raw: str) -> str:
    """Strip markdown fences and whitespace from the LLM response."""
    result = raw.strip()
    if result.startswith("```json"):
        result = result[len("```json"):]
    if result.startswith("```"):
        result = result[3:]
    if result.endswith("```"):
        result = result[:-3]
    return result.strip()


def _call_llm_for_section(financial_text: str) -> dict:
    """
    Send the financial text to the LLM and return the parsed JSON
    containing income_statement, balance_sheet, and cash_flow.
    """
    prompt = _PROMPT_TEMPLATE.format(financial_text=financial_text)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
    )

    cleaned = _clean_llm_response(response.choices[0].message.content)
    return json.loads(cleaned)


def _save_statements_for_section(
    db: Session,
    document_id: int,
    section_prefix: str,
    result_json: dict,
) -> int:
    """
    Save the three financial statements for a single section
    (standalone or consolidated).  Returns the number of statements saved.

    statement_type values will be e.g.:
        standalone_income_statement, standalone_balance_sheet,
        consolidated_cash_flow, etc.
    """
    count = 0
    for base_type in ("income_statement", "balance_sheet", "cash_flow"):
        if base_type in result_json and result_json[base_type]:
            stmt = FinancialStatement(
                document_id=document_id,
                statement_type=f"{section_prefix}_{base_type}",
                data_json=json.dumps(result_json[base_type]),
            )
            db.add(stmt)
            count += 1
    return count


def extract_financial_statements(
    db: Session,
    document_id: int,
):
    extraction = db.query(
        DocumentExtraction
    ).filter(
        DocumentExtraction.document_id == document_id
    ).first()

    if not extraction:
        return {"error": "No extraction found"}

    # Delete any existing statements for this document (supports re-extraction).
    db.query(FinancialStatement).filter(
        FinancialStatement.document_id == document_id
    ).delete()

    # --- Section-aware page detection ---
    sections = detect_financial_pages_by_section(extraction.raw_text)

    if not sections:
        # Fallback: try the single-section detector, then raw_text[:15000].
        single = detect_financial_pages(extraction.raw_text)
        if single:
            sections = {"standalone": single}
        else:
            sections = {"standalone": extraction.raw_text[:15000]}
            logger.info(
                f"All detection failed for document {document_id}, "
                f"using first 15000 chars fallback"
            )

    logger.info(
        f"Document {document_id}: extracting sections: "
        f"{list(sections.keys())}"
    )

    total_saved = 0

    for section_key, financial_text in sections.items():
        logger.info(
            f"Calling LLM for '{section_key}' section "
            f"({len(financial_text)} chars)..."
        )
        try:
            result_json = _call_llm_for_section(financial_text)
            saved = _save_statements_for_section(
                db, document_id, section_key, result_json
            )
            total_saved += saved
            logger.info(
                f"Saved {saved} statements for '{section_key}' section."
            )
        except Exception as e:
            logger.error(
                f"LLM extraction failed for '{section_key}' section "
                f"of document {document_id}: {e}",
                exc_info=True,
            )
            # Continue with other sections if one fails.

    document = db.query(Document).filter_by(id=document_id).first()
    if document:
        document.status = "statements"

    db.commit()

    return {
        "message": "Financial Statements Saved",
        "document_id": document_id,
        "sections_extracted": list(sections.keys()),
        "total_statements": total_saved,
    }