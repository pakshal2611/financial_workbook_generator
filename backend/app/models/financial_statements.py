from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base

class FinancialStatement(Base):

    __tablename__ = "financial_statements"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False
    )

    statement_type = Column(String, nullable=False)

    year = Column(Integer)

    data_json = Column(Text)

    document = relationship(
    "Document",
    back_populates="financial_statements"
    )