from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.services.workbook_service import (
    generate_workbook
)

router = APIRouter(
    prefix="/workbook",
    tags=["Workbook"]
)


@router.post("/{document_id}")
def create_workbook(
    document_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = generate_workbook(
            db,
            document_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workbook generation failed: {str(e)}")