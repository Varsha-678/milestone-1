from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import (
    UPLOAD_DIR,
    RESULT_DIR,
    REPORT_DIR,
    CORS_ORIGINS
)
from backend.app.database.session import init_db
from backend.app.services.yolo_service import get_yolo_manager
from backend.app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and Warm Up Model
    init_db()
    yolo_mgr = get_yolo_manager()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="SafeSight AI Backend",
    description="Intelligent PPE Detection and Workplace Safety Analyzer API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for generated results, uploaded media, and reports
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/results", StaticFiles(directory=str(RESULT_DIR)), name="results")
app.mount("/reports", StaticFiles(directory=str(REPORT_DIR)), name="reports")

# Include API routes
app.include_router(api_router)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred during processing. Please verify file format and model status."
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
