from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

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
    try:
        result = generate_analysis(
            db,
            document_id
        )
        if result is None:
            raise HTTPException(status_code=404, detail="Document or financial statements not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")