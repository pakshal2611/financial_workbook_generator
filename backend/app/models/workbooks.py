from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class Workbook(Base):

    __tablename__ = "workbooks"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False
    )

    file_path = Column(String, nullable=False)

    document = relationship(
    "Document",
    back_populates="workbook"
    )