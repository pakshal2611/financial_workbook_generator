from app.db.base import Base
from app.db.database import engine
from app.models.document import Document
from app.models.financial_statements import FinancialStatement
from app.models.workbooks import Workbook
from app.models.document_extraction import DocumentExtraction
from app.models.financial_analysis import FinancialAnalysis

Base.metadata.create_all(bind=engine)

print("Tables Created Successfully")