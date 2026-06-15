from fastapi import FastAPI

from app.api.document import router as document_router

from app.api.extraction import router as extraction_router

from app.api.test_llm import router as llm_router

from app.api.financial_statement import router as financial_statement_router

from app.api.analysis import router as analysis_router

from app.api.workbook import router as workbook_router

app = FastAPI()

app.include_router(document_router)
app.include_router(extraction_router)
app.include_router(financial_statement_router)
app.include_router(llm_router)
app.include_router(analysis_router)
app.include_router(workbook_router)
@app.get("/")
def home():

    return {
        "message": "Financial Workbook Builder API"
    }