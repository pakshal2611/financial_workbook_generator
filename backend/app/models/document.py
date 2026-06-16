from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.financial_statements import FinancialStatement
from app.models.workbooks import Workbook

class Document(Base):

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    file_path = Column(String, nullable=False)

    status = Column(String, default="uploaded")

    document_extraction = relationship(
        "DocumentExtraction",
        cascade="all, delete-orphan",
        back_populates="document"
    )

    financial_statements = relationship(
        "FinancialStatement",
        back_populates="document",
        foreign_keys="FinancialStatement.document_id",
        cascade="all, delete-orphan"
    )

    financial_analysis = relationship(
        "FinancialAnalysis",
        cascade="all, delete-orphan",
        back_populates="document"
    )

    workbook = relationship(
        "Workbook",
        back_populates="document",
        foreign_keys="Workbook.document_id",
        cascade="all, delete-orphan"
    )