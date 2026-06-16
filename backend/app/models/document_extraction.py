from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class DocumentExtraction(Base):

    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    raw_text = Column(Text)

    document = relationship("Document", back_populates="document_extraction")