from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.services.extraction_service import extract_document


router = APIRouter(
    prefix="/extractions",
    tags=["Extractions"]
)


@router.post("/{document_id}")
def extract_pdf(
    document_id: int,
    db: Session = Depends(get_db)
):

    extraction = extract_document(
        db,
        document_id
    )

    return extraction