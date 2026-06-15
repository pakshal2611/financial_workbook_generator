import fitz

from app.models.document import Document
from app.models.document_extraction import DocumentExtraction


def extract_text_from_pdf(file_path):

    text = ""

    pdf = fitz.open(file_path)

    for page in pdf:

        text += page.get_text()

    pdf.close()

    return text


def extract_document(
    db,
    document_id
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        return None

    raw_text = extract_text_from_pdf(
        document.file_path
    )

    extraction = DocumentExtraction(
        document_id=document.id,
        raw_text=raw_text
    )

    db.add(extraction)

    db.commit()

    db.refresh(extraction)

    return extraction