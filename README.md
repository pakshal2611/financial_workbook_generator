# Financial Workbook Builder

A comprehensive full-stack application for analyzing financial documents and generating professional workbooks using advanced document extraction and data analysis capabilities.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The Financial Workbook Builder is a modern web application that leverages AI-powered document processing to:
- Extract financial data from documents
- Perform comprehensive financial analysis
- Generate automated Excel workbooks with insights
- Provide an intuitive user interface for document management

---

## ✨ Features

- **Document Upload & Management**: Upload and manage financial documents with ease
- **Advanced Document Extraction**: Automatically extract text and data from various document formats
- **Financial Analysis**: Perform in-depth financial analysis on extracted data
- **Workbook Generation**: Generate professional Excel workbooks with analysis results
- **RESTful API**: Complete REST API for all operations
- **Modern UI**: React-based responsive frontend with TypeScript
- **Real-time Processing**: Fast document processing and analysis
- **Database Integration**: Persistent storage of documents and analysis results

---

## 📁 Project Structure

```
demo_deloitte/
├── backend/                          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── create_tables.py         # Database initialization
│   │   ├── api/                     # API endpoints
│   │   │   ├── document.py          # Document management endpoints
│   │   │   ├── extraction.py        # Document extraction endpoints
│   │   │   ├── financial_statement.py # Financial statement endpoints
│   │   │   ├── analysis.py          # Analysis endpoints
│   │   │   ├── workbook.py          # Workbook generation endpoints
│   │   │   ├── test_llm.py          # LLM testing endpoints
│   │   │   └── ...
│   │   ├── models/                  # SQLAlchemy database models
│   │   │   ├── document.py
│   │   │   ├── document_extraction.py
│   │   │   ├── financial_statements.py
│   │   │   ├── financial_analysis.py
│   │   │   ├── workbooks.py
│   │   │   └── ...
│   │   ├── schemas/                 # Pydantic schemas for validation
│   │   │   └── document.py
│   │   ├── services/                # Business logic layer
│   │   │   ├── document_service.py
│   │   │   ├── extraction_service.py
│   │   │   ├── financial_statement_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── workbook_service.py
│   │   │   ├── llm_service.py
│   │   │   └── ...
│   │   ├── db/                      # Database configuration
│   │   │   ├── database.py
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   ├── core/                    # Core utilities
│   │   ├── uploads/                 # Uploaded files storage
│   │   └── generated_workbooks/     # Generated workbook storage
│   ├── venv/                        # Python virtual environment
│   ├── temp.py                      # Temporary test file
│   └── test_connection.py           # Connection test file
│
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── main.tsx                 # Application entry point
│   │   ├── App.tsx                  # Main React component
│   │   ├── App.css                  # App styles
│   │   ├── index.css                # Global styles
│   │   └── assets/                  # Static assets
│   ├── public/                      # Public assets
│   ├── package.json                 # Node.js dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite configuration
│   ├── eslint.config.js             # ESLint configuration
│   └── index.html                   # HTML entry point
│
├── docs/                            # Documentation
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy ORM
- **API**: RESTful API with OpenAPI documentation
- **Language Version**: Python 3.8+
- **Async Support**: Uvicorn ASGI server

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with Tailwind CSS support
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Linting**: ESLint
- **Node Version**: 18+

### Additional Libraries
- **Document Processing**: For text extraction and analysis
- **Excel Generation**: For workbook creation
- **LLM Integration**: AI-powered analysis capabilities

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 18 or higher with npm
- **Git**
- **pip** (Python package manager)

### Verify Installation
```bash
python --version
node --version
npm --version
```

---

## 🚀 Getting Started

### Step 1: Clone or Navigate to Project
```bash
cd demo_deloitte
```

### Step 2: Backend Setup

#### Create and Activate Virtual Environment
```bash
cd backend

# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Initialize Database
```bash
python app/create_tables.py
```

#### Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`
- API Documentation (Swagger): `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### Step 3: Frontend Setup

#### In a new terminal, navigate to frontend
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Step 4: Verify Everything is Running
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- Backend Swagger Docs: http://localhost:8000/docs

---

## 💻 Usage

### Uploading and Processing Documents

1. **Open the Frontend**: Navigate to `http://localhost:5173`
2. **Upload Document**: Use the document upload interface to select a file
3. **Extract Data**: Click "Extract" to process the document
4. **View Analysis**: Review the extracted financial data and analysis
5. **Generate Workbook**: Create an Excel workbook with the analysis results
6. **Download**: Download the generated workbook to your machine

### Using the API Directly

Examples using `curl` or API client (Postman, Insomnia, etc.):

#### Upload a Document
```bash
curl -X POST "http://localhost:8000/documents/upload" \
  -F "file=@path/to/document.pdf"
```

#### List Documents
```bash
curl "http://localhost:8000/documents/"
```

#### Extract Data from Document
```bash
curl -X POST "http://localhost:8000/extraction/extract" \
  -H "Content-Type: application/json" \
  -d '{"document_id": 1}'
```

#### Generate Workbook
```bash
curl -X POST "http://localhost:8000/workbooks/generate" \
  -H "Content-Type: application/json" \
  -d '{"document_id": 1}'
```

---

## 📡 API Endpoints

### Document Management
- `GET /documents/` - List all documents
- `POST /documents/upload` - Upload a new document
- `GET /documents/{id}` - Get document details
- `DELETE /documents/{id}` - Delete a document

### Document Extraction
- `POST /extraction/extract` - Extract data from document
- `GET /extraction/{id}` - Get extraction results

### Financial Analysis
- `POST /analysis/analyze` - Perform financial analysis
- `GET /analysis/{id}` - Get analysis results

### Financial Statements
- `POST /financial-statements/create` - Create financial statement
- `GET /financial-statements/{id}` - Get financial statement

### Workbook Generation
- `POST /workbooks/generate` - Generate Excel workbook
- `GET /workbooks/{id}` - Get workbook details
- `GET /workbooks/{id}/download` - Download workbook

### LLM Testing
- `POST /llm/test` - Test LLM integration

Full API documentation available at: `http://localhost:8000/docs`

---

## 📦 Build for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
# Output will be in dist/ directory
```

---

## 🧪 Development

### Running Linting (Frontend)
```bash
cd frontend
npm run lint
```

### Building TypeScript (Frontend)
```bash
cd frontend
npm run build
```

### Preview Production Build
```bash
cd frontend
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [SQLAlchemy Documentation](https://www.sqlalchemy.org/)
- [Vite Documentation](https://vitejs.dev/)

---

## 📅 Project Status

Active Development - Version 1.0.0

---

**Happy coding! 🚀**
