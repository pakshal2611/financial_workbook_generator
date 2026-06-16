from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.services.document_service import delete_document, get_document, save_document

from app.services.document_service import get_documents

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
    ):

    document = save_document(
        db=db,
        file=file
    )

    return document

@router.get("/")
def list_documents(
    db: Session = Depends(get_db)
    ):

    return get_documents(db)

@router.get("/{document_id}")
def get_single_document(
    document_id: int,
    db: Session = Depends(get_db)
    ):

    return get_document(
        db,
        document_id
    )

@router.delete("/{document_id}")
def remove_document(
    document_id: int,
    db: Session = Depends(get_db)
    ):
    try:
        result = delete_document(
            db,
            document_id
        )
        if result is None:
            raise HTTPException(status_code=404, detail="Document not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")