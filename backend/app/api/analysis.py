from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.services.analysis_service import (
    generate_analysis
)

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"]
)


@router.post("/{document_id}")
def analyze_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    return generate_analysis(
        db,
        document_id
    )