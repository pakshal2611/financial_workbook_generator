import json

from sqlalchemy.orm import Session

from app.models.financial_statements import FinancialStatement
from app.models.financial_analysis import FinancialAnalysis
from app.models.document import Document

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

    # Prefer standalone, then consolidated, then legacy unprefixed type.
    priority_types = [
        "standalone_income_statement",
        "consolidated_income_statement",
        "income_statement",
    ]

    for priority_type in priority_types:
        for statement in statements:
            if statement.statement_type == priority_type:
                income_statement = json.loads(statement.data_json)
                break
        if income_statement:
            break

    revenue = 0
    net_profit = 0

    if income_statement:
        print(f"DEBUG: Income statement keys: {list(income_statement.keys())}")
        print(f"DEBUG: Income statement data: {income_statement}")
        
        # First priority: look for specific net profit keywords
        priority_keywords = ["net profit", "net income", "profit after tax", "pat", 
                            "earnings after tax", "eat", "profit for the year", "net earnings", "bottom line"]
        
        for key, value in income_statement.items():
            key_lower = key.lower()
            
            # Clean up the value
            try:
                clean_val = str(value).replace('$', '').replace(',', '').strip()
                if clean_val.startswith('(') and clean_val.endswith(')'):
                    clean_val = '-' + clean_val[1:-1]
                numeric_val = float(clean_val)
            except ValueError:
                print(f"DEBUG: Could not convert '{key}': '{value}' to float")
                continue

            # Match Revenue
            if revenue == 0:
                if any(keyword in key_lower for keyword in ["revenue", "revenue from operations", "sales", "turnover", "gross revenue", "operating revenue"]):
                    print(f"DEBUG: Matched revenue - key: '{key}', value: {numeric_val}")
                    revenue = numeric_val
            
            # Match Net Profit - Priority 1: specific terms
            if net_profit == 0:
                if any(keyword in key_lower for keyword in priority_keywords):
                    print(f"DEBUG: Matched net profit (priority) - key: '{key}', value: {numeric_val}")
                    net_profit = numeric_val
        
        # Fallback: if no net profit found, look for generic "profit" or "earnings"
        if net_profit == 0:
            print(f"DEBUG: No net profit found in priority keywords, trying fallback...")
            for key, value in income_statement.items():
                key_lower = key.lower()
                
                try:
                    clean_val = str(value).replace('$', '').replace(',', '').strip()
                    if clean_val.startswith('(') and clean_val.endswith(')'):
                        clean_val = '-' + clean_val[1:-1]
                    numeric_val = float(clean_val)
                except ValueError:
                    continue
                
                # Fallback: match "profit (loss)" or generic "profit"
                if any(keyword in key_lower for keyword in ["profit (loss)", "profit", "earnings", "net profit (loss)"]):
                    print(f"DEBUG: Matched net profit (fallback) - key: '{key}', value: {numeric_val}")
                    net_profit = numeric_val
                    break

    profit_margin = 0

    if revenue != 0:
        profit_margin = (net_profit / revenue) * 100
    
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

    document = db.query(Document).filter_by(
        id=document_id
    ).first()

    if document:
        document.status = "analyzed"

    db.commit()
    db.refresh(analysis)
    
    return analysis_data