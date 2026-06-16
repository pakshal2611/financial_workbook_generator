from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class FinancialAnalysis(Base):

    __tablename__ = "financial_analysis"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    analysis_json = Column(Text)

    document = relationship("Document", back_populates="financial_analysis")