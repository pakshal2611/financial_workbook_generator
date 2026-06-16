from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

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
    try:
        extraction = extract_document(
            db,
            document_id
        )
        if extraction is None:
            raise HTTPException(status_code=404, detail="Document not found")
        return extraction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")