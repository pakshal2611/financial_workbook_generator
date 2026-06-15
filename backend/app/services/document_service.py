import os
import shutil

from sqlalchemy.orm import Session

from app.models.document import Document


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

    return db.query(Document).filter(
        Document.id == document_id
    ).first()

def delete_document(
    db: Session,
    document_id: int
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        return None

    db.delete(document)

    db.commit()

    return document