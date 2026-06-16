from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.services.financial_statement_service import (
    extract_financial_statements
)

router = APIRouter(
    prefix="/financial-statements",
    tags=["Financial Statements"]
)


@router.post("/extract/{document_id}")
def extract_statement(
    document_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = extract_financial_statements(
            db,
            document_id
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Financial statement extraction failed: {str(e)}")