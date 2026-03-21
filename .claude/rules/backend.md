# Backend Rules
# Load this ONLY when building or editing API/server files in src/backend/

## Tech Stack
- Python 3.11+
- FastAPI for REST endpoints
- `httpx` for async HTTP calls
- `python-dotenv` for environment variables
- `anthropic` SDK for Claude API calls

## Project Structure
```
src/backend/
├── main.py           ← FastAPI app entry point
├── routes/           ← API route handlers
├── services/         ← Business logic (scoring, analysis)
├── models/           ← Pydantic data models
├── data_loader.py    ← Load static datasets
└── .env              ← API keys (never commit this)
```

## API Conventions
- All endpoints: `/api/v1/[resource]`
- Always return: `{"status": "ok|error", "data": {...}, "message": "..."}`
- Use Pydantic models for request/response validation
- Add CORS middleware for frontend access

## Standard FastAPI Setup
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HackASU 2025")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

## Environment Variables
Required in `.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

Never hardcode API keys. Always use `os.getenv("ANTHROPIC_API_KEY")`.

## Error Handling
```python
from fastapi import HTTPException
raise HTTPException(status_code=400, detail="Missing required field: soil_type")
```
