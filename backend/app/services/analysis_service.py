import json

from sqlalchemy.orm import Session

from app.models.financial_statements import FinancialStatement
from app.models.financial_analysis import FinancialAnalysis

def generate_analysis(
        db: Session,
        document_id: int,
    ):
    statements = db.query(
        FinancialStatement
    ).filter(
        FinancialStatement.document_id == document_id
    ).all()

    if not statements:

        return {
            "error": "No financial statements found"
        }

    income_statement = None

    for statement in statements:

        if statement.statement_type == "income_statement":

            income_statement = json.loads(
                statement.data_json
            )

            break
    
    revenue = (
    income_statement.get("Revenue")
    or
    income_statement.get("Revenue from Operations")
    or
    0
    )

    net_profit = (
        income_statement.get("Net Profit")
        or
        income_statement.get("Profit After Tax")
        or
        0
    )

    profit_margin = 0

    if revenue:

        profit_margin = (
            net_profit / revenue
        ) * 100
    
    analysis_data = {

        "Revenue": revenue,

        "Net Profit": net_profit,

        "Profit Margin (%)": round(
            profit_margin,
            2
        )
    }

    analysis = FinancialAnalysis(

        document_id=document_id,

        analysis_json=json.dumps(
            analysis_data
        )
    )

    db.add(analysis)

    db.commit()

    db.refresh(analysis)

    return analysis_data