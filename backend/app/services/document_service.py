import os
import shutil

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_extraction import DocumentExtraction
from app.models.financial_statements import FinancialStatement
from app.models.financial_analysis import FinancialAnalysis
from app.models.workbooks import Workbook


UPLOAD_DIR = "app/uploads"


def save_document(
    db: Session,
    file
):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    document = Document(
        filename=file.filename,
        file_path=file_path,
        status="uploaded"
    )

    db.add(document)

    db.commit()

    db.refresh(document)

    return document

def get_documents(db: Session):

    return db.query(Document).all()

def get_document(
    db: Session,
    document_id: int
    ):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        return None

    # Fetch all related entities explicitly
    # (SQLAlchemy lazy-loaded relationships don't serialize via FastAPI)

    extraction = db.query(DocumentExtraction).filter(
        DocumentExtraction.document_id == document_id
    ).first()

    statements = db.query(FinancialStatement).filter(
        FinancialStatement.document_id == document_id
    ).all()

    analysis = db.query(FinancialAnalysis).filter(
        FinancialAnalysis.document_id == document_id
    ).first()

    workbook = db.query(Workbook).filter(
        Workbook.document_id == document_id
    ).first()

    return {
        "id": document.id,
        "filename": document.filename,
        "file_path": document.file_path,
        "status": document.status,
        "extraction": {
            "id": extraction.id,
            "document_id": extraction.document_id,
            "raw_text": extraction.raw_text,
        } if extraction else None,
        "financial_statements": [
            {
                "id": s.id,
                "document_id": s.document_id,
                "statement_type": s.statement_type,
                "year": s.year,
                "data_json": s.data_json,
            }
            for s in statements
        ],
        "analysis": {
            "id": analysis.id,
            "document_id": analysis.document_id,
            "analysis_json": analysis.analysis_json,
        } if analysis else None,
        "workbook": {
            "id": workbook.id,
            "document_id": workbook.document_id,
            "file_path": workbook.file_path,
        } if workbook else None,
    }

def delete_document(
    db: Session,
    document_id: int
):
    try:
        # Find the document
        document = db.query(Document).filter(
            Document.id == document_id
        ).first()

        if not document:
            return None

        # Delete Physical PDF file first (before DB records are deleted)
        if document.file_path and os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except OSError as e:
                print(f"Warning: Failed to delete PDF file: {str(e)}")

        # Delete associated workbook file (before DB record is deleted)
        workbook = db.query(Workbook).filter(
            Workbook.document_id == document_id
        ).first()
        
        if workbook and workbook.file_path and os.path.exists(workbook.file_path):
            try:
                os.remove(workbook.file_path)
            except OSError as e:
                print(f"Warning: Failed to delete workbook file: {str(e)}")

        # Delete all related records manually before deleting the document
        # This ensures cascade deletes work properly with PostgreSQL
        db.query(DocumentExtraction).filter(
            DocumentExtraction.document_id == document_id
        ).delete()
        
        db.query(FinancialStatement).filter(
            FinancialStatement.document_id == document_id
        ).delete()
        
        db.query(FinancialAnalysis).filter(
            FinancialAnalysis.document_id == document_id
        ).delete()
        
        db.query(Workbook).filter(
            Workbook.document_id == document_id
        ).delete()
        
        # Now delete the document
        db.delete(document)
        db.commit()

        return document

    except Exception as e:
        db.rollback()
        print(f"Error deleting document {document_id}: {str(e)}")
        raise