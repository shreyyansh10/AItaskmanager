# AI Task Manager

A full-stack task manager application with an AI-driven agentic backend and a modern React frontend.

## Project Structure

```
AItaskmanager/
├── backend/            # FastAPI Backend
│   ├── app/            # Source code
│   │   ├── api/        # Routes/endpoints
│   │   ├── core/       # Configurations and logs
│   │   ├── database/   # Database setup
│   │   ├── models/     # Database models
│   │   ├── providers/  # AI Provider integrations
│   │   ├── repository/ # Database access layer
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── services/   # Business logic / agents
│   │   ├── utils/      # Shared utilities
│   │   └── main.py     # FastAPI Entrypoint
│   ├── .env.example    # Template environment file
│   ├── .gitignore      # Git ignore patterns for backend
│   └── requirements.txt# Python dependencies
├── frontend/           # Vite + React Frontend (Tailwind CSS v4)
│   ├── src/            # React codebase
│   │   ├── App.jsx     # Main view
│   │   └── index.css   # Main CSS entry
│   ├── package.json    # Frontend configuration and scripts
│   └── vite.config.js  # Vite settings
├── README.md           # This guide
└── .gitignore          # Root Git ignore
```

## Running the Application

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend/` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and configure keys:
   ```bash
   cp .env.example .env
   ```
5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
6. Verify the server is running by visiting: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup (Vite + React)

1. Navigate to the `frontend/` directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the local dev server:
   ```bash
   npm run dev
   ```
4. Open the site in your browser: [http://localhost:5173](http://localhost:5173)
