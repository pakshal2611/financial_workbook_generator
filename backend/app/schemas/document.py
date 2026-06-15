from pydantic import BaseModel

class DocumentResponse(BaseModel):

    id: int

    filename: str

    file_path: str

    status: str

    class Config:
        from_attributes = True