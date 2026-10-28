# GridBricks — Wind Intelligence Dashboard

An operational analytics web application built for UK electricity retailer procurement teams to track day-ahead renewable wind forecasts and evaluate forecast accuracy quantitatively using official **Elexon BMRS** data.

---

## 🤖 AI Disclosure
This application, its software architecture, and the accompanying technical documentation were developed with the assistance of **Google Antigravity AI coding assistant** (utilizing Gemini and Claude models) in accordance with the project requirements.

---

## ⚡ Problem Setting & Solution Pitch

### The Client Problem
An electricity retailer in the UK serves commercial and residential power customers. To meet expected consumer demand, power procurement teams trade on the **UK Day-Ahead wholesale market**. 
Because renewable generation from wind is intermittent and weather-dependent:
1. Procurement decisions must be finalized **one day before delivery (D-1)** around market gate closure.
2. Teams must know the **latest wind generation forecasts available at decision time** to decide how much additional thermal/balancing power must be procured.
3. Without quantifying historical forecast accuracy, procurement teams either **over-procure** (incurring expensive surplus costs) or **under-procure** (forcing them to buy power in the Balancing Mechanism at punitive cashout prices).

### How GridBricks Solves This
1. **Accurate Market Timeline Representation**: Fetches national-level wind forecasts (`WINDFOR`) from Elexon BMRS, strictly selecting the **latest forecast published before day-ahead gate closure (D-1 12:00 UTC)**. No hindsight or forward-looking bias.
2. **Side-by-Side Actual Outturn Comparison**: Aligns forecasts with actual outturn (`FUELHH`, `fuelType=WIND`) across all 48 half-hour settlement periods.
3. **Rigorous Accuracy Quantification**: Calculates key error metrics across January 2026:
   - **MAE (Mean Absolute Error)**: Quantifies the expected forecast error magnitude to right-size procurement buffers.
   - **RMSE (Root Mean Squared Error)**: Penalizes extreme errors, crucial for worst-case risk management.
   - **MAPE (Mean Absolute Percentage Error)**: Provides scale-independent error tracking.
   - **Directional Bias**: Identifies whether forecasts systematically over-predict (risk of power deficit) or under-predict (risk of power surplus).
   - **Settlement Period & Daily Breakdown**: Pinpoints which hours of the day or days of the month exhibit the greatest forecasting uncertainty.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Date-fns
- **Backend**: Python 3.11, FastAPI (async), Uvicorn, httpx, Pandas, NumPy, Pydantic v2, Cachetools
- **Data Source**: Elexon BMRS Insights Solution REST API (public, `/datasets/FUELHH/stream` and `/datasets/WINDFOR/stream`)
- **Containerization**: Docker & Docker Compose (Multi-stage build)
- **Deployment Targets**: Heroku (Backend Container Registry) & Vercel (Frontend SPA)

---

## 🏛️ System Architecture

```
[ User Browser ]
       │
       ▼
[ React 19 Frontend ] (Vite / Nginx)
       │ (REST JSON via /api proxy)
       ▼
[ FastAPI Backend ] (Python 3.11 ASGI)
       ├── ElexonService (TTLCache 30m, async HTTP client)
       │         │
       │         ├── GET /datasets/FUELHH/stream?fuelType=WIND
       │         └── GET /datasets/WINDFOR/stream?publishDateTimeFrom=...
       │
       └── MetricsService (MAE, RMSE, MAPE, Bias, Pandas Aggregations)
```

### Why a Backend Proxy is Mandatory
The Elexon Insights Solution API at `data.elexon.co.uk` does **not** provide permissive `Access-Control-Allow-Origin: *` headers for arbitrary browser origins. Direct browser-side `fetch()` requests are rejected by browser CORS policy. The FastAPI backend acts as an authenticated caching reverse proxy, while also decoupling domain business logic from the presentation layer.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose **OR**
- Node.js 20+ and Python 3.11+

### Option A: Run with Docker Compose (Recommended)
```bash
docker-compose up --build
```
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Run Standalone Without Docker

#### 1. Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs at [http://localhost:5173](http://localhost:5173) and proxies `/api` calls directly to `http://localhost:8000`.

---

## 🧪 Testing

Run backend unit and integration tests:
```bash
cd backend
pytest -v
```

---

## 🌐 API Specification

### 1. `GET /api/forecasts?date=YYYY-MM-DD`
Returns the latest day-ahead wind forecast for each 30-minute settlement period for the specified date in January 2026.
- **Query Parameter**: `date` (e.g. `2026-01-15`)
- **Sample Response**:
```json
[
  {
    "startTime": "2026-01-15T00:00:00Z",
    "settlementPeriod": 1,
    "forecastMW": 5210.5,
    "publishTime": "2026-01-14T10:30:00Z"
  }
]
```

### 2. `GET /api/actuals?date=YYYY-MM-DD`
Returns actual half-hourly wind generation outturn (FUELHH, `fuelType=WIND`).
- **Sample Response**:
```json
[
  {
    "startTime": "2026-01-15T00:00:00Z",
    "settlementPeriod": 1,
    "actualMW": 4980.0
  }
]
```

### 3. `GET /api/accuracy`
Returns aggregated forecast performance metrics for January 2026:
- `mae`: Mean Absolute Error (MW)
- `rmse`: Root Mean Squared Error (MW)
- `mape`: Mean Absolute Percentage Error (%)
- `bias`: Directional error (MW, positive indicates over-forecasting)
- `error_by_period`: 48-period diurnal error profile
- `daily_summary`: Day-by-day metrics across January 2026
- `time_series`: Full 1,488-period time-series for granular charting

---

## ☁️ Deployment Instructions

### Deploy Backend to Heroku (Container Registry)
```bash
# Login to Heroku Container Registry
heroku login
heroku container:login

# Create app
heroku create gridbricks-api

# Build and push container
cd backend
heroku container:push web --app gridbricks-api
heroku container:release web --app gridbricks-api

# Verify deployment
heroku open --app gridbricks-api
```

### Deploy Frontend to Vercel
```bash
cd frontend
# Set production backend URL
echo "VITE_API_URL=https://gridbricks-api.herokuapp.com" > .env.production

# Deploy with Vercel CLI
vercel --prod
```
In Vercel Project Settings, ensure `VITE_API_URL` is configured to point to your live backend endpoint.

---

## 📋 Technical Lead Review Notes
- **Gate Closure Logic**: For delivery day $D$, forecasts published up to $D-1\text{ 12:00 UTC}$ are considered. NESO publishes WINDFOR runs at fixed times (`03:30, 05:30, 08:30, 10:30, 12:30, 16:30, 19:30, 23:30 UTC`). The $10:30\text{ UTC}$ run is the final run available prior to gate closure.
- **In-Memory Caching**: `cachetools.TTLCache` (30-minute TTL) prevents redundant heavy stream queries against the Elexon API.
- **Data Normalization**: Both WINDFOR and FUELHH payloads are validated and cast into consistent Pydantic models.
