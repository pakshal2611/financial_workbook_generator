import fitz
import os
import requests
import tempfile

from app.models.document import Document
from app.models.document_extraction import DocumentExtraction


def extract_text_from_pdf(file_url):

    response = requests.get(file_url)

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as temp_file:

        temp_file.write(
            response.content
        )

        temp_path = temp_file.name

    text = ""

    pdf = fitz.open(temp_path)

    for page in pdf:

        text += page.get_text()

    pdf.close()

    os.remove(temp_path)

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

    document.status = "extracted"

    db.commit()

    db.refresh(extraction)

    return extraction