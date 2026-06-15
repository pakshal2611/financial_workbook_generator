import json

from sqlalchemy.orm import Session

from app.models.document_extraction import DocumentExtraction
from app.models.financial_statements import FinancialStatement

from app.services.llm_service import client
import os

MODEL_NAME = os.getenv("MODEL_NAME")

def extract_financial_statements(
    db: Session,
    document_id: int
):

    extraction = db.query(
        DocumentExtraction
    ).filter(
        DocumentExtraction.document_id == document_id
    ).first()

    if not extraction:

        return {
            "error": "No extraction found"
        }

    prompt = f"""
    You are a financial analyst.

    Extract:

    1. Income Statement
    2. Balance Sheet
    3. Cash Flow Statement

    Return ONLY valid JSON.

    Format:

    {{
      "income_statement": {{}},
      "balance_sheet": {{}},
      "cash_flow": {{}}
    }}

    Financial Report Text:

    {extraction.raw_text[:15000]}
    """

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    result = response.choices[0].message.content
    result_json = json.loads(result)

    income_statement = FinancialStatement(
        document_id=document_id,
        statement_type="income_statement",
        data_json=json.dumps(
            result_json["income_statement"]
        )
    )

    balance_sheet = FinancialStatement(
        document_id=document_id,
        statement_type="balance_sheet",
        data_json=json.dumps(
            result_json["balance_sheet"]
        )
    )

    cash_flow = FinancialStatement(
        document_id=document_id,
        statement_type="cash_flow",
        data_json=json.dumps(
            result_json["cash_flow"]
        )
    )

    db.add(income_statement)
    db.add(balance_sheet)
    db.add(cash_flow)

    db.commit()

    return {
        "message": "Financial Statements Saved",
        "document_id": document_id
    }   