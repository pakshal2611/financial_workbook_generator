from fastapi import APIRouter
from fastapi import Depends

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

    return extract_financial_statements(
        db,
        document_id
    )