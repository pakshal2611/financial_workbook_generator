import fitz
import os
import requests
import tempfile
import logging

from pdf2image import convert_from_path
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

from app.models.document import Document
from app.models.document_extraction import DocumentExtraction


logger = logging.getLogger(__name__)

# If PyMuPDF extracts fewer than this many characters,
# the PDF is likely scanned and OCR will be attempted.
OCR_THRESHOLD = 500

# ---------- Image Preprocessing for OCR ---------- #

# Higher DPI produces sharper text for OCR (default pdf2image is 200).
OCR_DPI = 400


def _preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Apply a multi-step preprocessing pipeline to improve
    Tesseract accuracy on scanned financial documents.

    Steps:
        1. Convert to grayscale
        2. Up-scale small pages so text is large enough for OCR
        3. Enhance contrast
        4. Sharpen edges
        5. Adaptive-style binarization via point threshold
        6. Light median-filter to remove salt-and-pepper noise
    """

    # 1. Grayscale
    gray = image.convert("L")

    # 2. Up-scale if the image is small (width < 2000 px)
    w, h = gray.size
    if w < 2000:
        scale = 2000 / w
        gray = gray.resize(
            (int(w * scale), int(h * scale)),
            Image.LANCZOS,
        )

    # 3. Contrast enhancement
    enhancer = ImageEnhance.Contrast(gray)
    gray = enhancer.enhance(2.0)

    # 4. Sharpening
    gray = gray.filter(ImageFilter.SHARPEN)

    # 5. Binarization – simple Otsu-like point threshold.
    #    Using a threshold of 180 works well for printed text.
    threshold = 180
    gray = gray.point(lambda px: 255 if px > threshold else 0, "1")

    # 6. Median filter to clean up stray dots / noise (convert back
    #    to "L" mode first because MedianFilter needs it).
    gray = gray.convert("L")
    gray = gray.filter(ImageFilter.MedianFilter(size=3))

    return gray


# ---------- Tesseract configuration ---------- #

# PSM 6  = "Assume a single uniform block of text."
#           Best for full pages of structured / tabular content.
# OEM 3  = Use whatever OCR engine is available (LSTM is preferred).
TESSERACT_CONFIG = r"--oem 3 --psm 6"


def extract_text_from_pdf(file_url):
    """
    Download PDF from Supabase Storage and extract text using PyMuPDF.
    Returns (extracted_text, temp_file_path).
    The caller is responsible for deleting the temp file.
    """

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

    return text, temp_path


def extract_text_using_ocr(pdf_path):
    """
    Convert every page of the PDF to a high-resolution image,
    apply preprocessing, and run Tesseract OCR with optimised
    settings for financial / tabular documents.

    Returns the combined OCR text from all pages.
    """

    try:
        logger.info(
            f"Starting enhanced OCR extraction (DPI={OCR_DPI})..."
        )

        images = convert_from_path(
            pdf_path,
            dpi=OCR_DPI,
        )

        logger.info(
            f"Converted PDF to {len(images)} page images for OCR"
        )

        ocr_texts = []

        for i, image in enumerate(images):

            # Pre-process the image for better OCR accuracy
            processed = _preprocess_image_for_ocr(image)

            page_text = pytesseract.image_to_string(
                processed,
                config=TESSERACT_CONFIG,
            )

            logger.info(
                f"  Page {i + 1}: {len(page_text)} chars extracted"
            )

            ocr_texts.append(page_text)

        combined_text = "\n\n".join(ocr_texts)

        logger.info(
            f"OCR extraction complete: "
            f"{len(combined_text)} characters extracted total"
        )

        return combined_text

    except Exception as e:
        logger.error(f"OCR extraction failed: {str(e)}", exc_info=True)
        return ""


def extract_document(
    db,
    document_id
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        return None

    raw_text, temp_path = extract_text_from_pdf(
        document.file_path
    )

    try:
        stripped_length = len(raw_text.strip())

        if stripped_length < OCR_THRESHOLD:
            logger.info(
                f"PyMuPDF returned {stripped_length} chars "
                f"(< {OCR_THRESHOLD} threshold) for document {document_id}. "
                f"Falling back to OCR."
            )

            ocr_text = extract_text_using_ocr(temp_path)

            if ocr_text and len(ocr_text.strip()) > stripped_length:
                raw_text = ocr_text
                logger.info(
                    f"OCR produced {len(ocr_text.strip())} chars. "
                    f"Using OCR text for document {document_id}."
                )
            else:
                logger.warning(
                    f"OCR did not improve extraction for document {document_id}. "
                    f"Keeping PyMuPDF result."
                )
        else:
            logger.info(
                f"PyMuPDF extracted {stripped_length} chars for document {document_id}. "
                f"No OCR needed."
            )

    finally:
        os.remove(temp_path)

    extraction = DocumentExtraction(
        document_id=document.id,
        raw_text=raw_text
    )

    db.add(extraction)

    document.status = "extracted"

    db.commit()

    db.refresh(extraction)

    return extraction