import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import forecasts, accuracy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="GridBricks Wind Intelligence API",
    description="""
## GridBricks Wind Intelligence API

Backend API for the GridBricks Wind Intelligence Dashboard — a tool for UK electricity
procurement teams to understand day-ahead wind generation forecasts and evaluate their accuracy.

### Data Source
All data comes from the [Elexon BMRS Insights Solution API](https://bmrs.elexon.co.uk/api-documentation)
(public, no authentication required).

### Datasets Used
- **FUELHH** (`fuelType=WIND`): Half-hourly actual wind generation outturn
- **WINDFOR**: Wind generation forecasts published by NESO

### Scope
January 2026, national GB level wind only.

### Gate Closure Logic
For each delivery period, the "day-ahead forecast" is the latest WINDFOR record
published before D-1 12:00 UTC (the proxy for day-ahead market gate closure).
NESO publishes forecasts at 03:30, 05:30, 08:30, **10:30**, 12:30, 16:30, 19:30, 23:30 UTC —
so the 10:30 UTC run on D-1 is the last one available before gate closure.

### AI Disclosure
This application was built with the assistance of Google Antigravity AI coding assistant.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Vite dev server and production Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        # Allow all origins or specify domains
        "*",
    ],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(forecasts.router, prefix="/api", tags=["Wind Data"])
app.include_router(accuracy.router, prefix="/api", tags=["Accuracy Metrics"])


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "gridbricks-api", "version": "1.0.0"}


@app.get("/", tags=["Health"])
async def root():
    return {"message": "GridBricks Wind Intelligence API", "docs": "/docs"}
