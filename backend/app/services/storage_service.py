import os
import uuid
from supabase import create_client

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def upload_pdf(
    filename,
    file_content
    ):

    unique_filename = (
        f"{uuid.uuid4()}-{filename}"
    )

    path = (
        f"documents/{unique_filename}"
    )

    supabase.storage.from_(
        "uploads"
    ).upload(
        path,
        file_content
    )

    return supabase.storage.from_(
        "uploads"
    ).get_public_url(
        path
    )

def upload_workbook(
    filename: str,
    file_content: bytes
    ):

    unique_filename = (
        f"{uuid.uuid4()}-{filename}"
    )

    storage_path = (
        f"generated/{unique_filename}"
    )

    supabase.storage.from_(
        "workbooks"
    ).upload(
        storage_path,
        file_content
    )

    return supabase.storage.from_(
        "workbooks"
    ).get_public_url(
        storage_path
    )