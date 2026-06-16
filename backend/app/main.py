from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.document import router as document_router

from app.api.extraction import router as extraction_router

from app.api.test_llm import router as llm_router

from app.api.financial_statement import router as financial_statement_router

from app.api.analysis import router as analysis_router

from app.api.workbook import router as workbook_router

import os
from fastapi.staticfiles import StaticFiles

# Create directories if they don't exist
os.makedirs("generated_workbooks", exist_ok=True)
os.makedirs("app/uploads", exist_ok=True)

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories to serve files
app.mount("/generated_workbooks", StaticFiles(directory="generated_workbooks"), name="workbooks")
app.mount("/app/uploads", StaticFiles(directory="app/uploads"), name="uploads")

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