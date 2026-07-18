# Fleet App

A full-stack fleet management app for browsing vehicle categories and managing vehicles (list + create) by subcategory.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, Pydantic |
| Data | SQLAlchemy 2, SQLite |
| Tooling | ESLint, Python `venv` |

## Architecture

```mermaid
flowchart LR
  Browser["Browser"]

  subgraph Frontend["Frontend — localhost:5173"]
    React["React 19"]
    Vite["Vite 8"]
    Tailwind["Tailwind CSS 4"]
    ApiClient["api/vehicles.js"]
  end

  subgraph Backend["Backend — localhost:8000"]
    FastAPI["FastAPI"]
    Uvicorn["Uvicorn"]
    Pydantic["Pydantic schemas"]
    SQLAlchemy["SQLAlchemy ORM"]
  end

  subgraph Data["Data"]
    SQLite[("SQLite\nbackend/data/fleet.db")]
  end

  Browser --> React
  React --> Vite
  React --> Tailwind
  React --> ApiClient
  ApiClient -->|"HTTP /api (Vite proxy)"| FastAPI
  FastAPI --> Uvicorn
  FastAPI --> Pydantic
  FastAPI --> SQLAlchemy
  SQLAlchemy --> SQLite
```

### Request flow

```mermaid
sequenceDiagram
  participant UI as React UI
  participant Vite as Vite Dev Server
  participant API as FastAPI
  participant ORM as SQLAlchemy
  participant DB as SQLite

  UI->>Vite: fetch /api/vehicles?subcategoryId=...
  Vite->>API: proxy → http://localhost:8000/api/vehicles
  API->>ORM: query / insert Vehicle
  ORM->>DB: SQL
  DB-->>ORM: rows
  ORM-->>API: Vehicle models
  API-->>UI: JSON (camelCase aliases)
```

### Technology layers

```mermaid
flowchart TB
  subgraph Client
    A["React components\nApp · Sidebar · VehiclePanel"]
    B["Static category data\nfleetData.js"]
    C["API client\nfetchVehicles · createVehicle"]
  end

  subgraph Server
    D["FastAPI app\nCORS · /health · /api router"]
    E["Vehicles router\nGET/POST /api/vehicles"]
    F["Pydantic models\nVehicleCreate · VehicleRead"]
    G["SQLAlchemy model\nVehicle"]
  end

  subgraph Persistence
    H[("SQLite fleet.db")]
  end

  A --> B
  A --> C
  C --> D
  D --> E
  E --> F
  E --> G
  G --> H
```

## Features

- Browse vehicle categories and subcategories (trucks, vans, cars)
- List vehicles filtered by subcategory
- Add a vehicle with license plate, make, model, and status
- Statuses: `Active`, `Maintenance`, `Retired`, `Out of Service`

## Project structure

```text
fleet-app/
├── frontend/                 # React + Vite UI
│   ├── src/
│   │   ├── api/vehicles.js   # API client
│   │   ├── components/       # Sidebar, VehiclePanel
│   │   ├── data/fleetData.js # Category taxonomy
│   │   └── App.jsx
│   └── vite.config.js        # Proxies /api → :8000
└── backend/                  # FastAPI API
    ├── app/
    │   ├── main.py           # App entry, CORS, routers
    │   ├── database.py       # SQLite + session
    │   ├── models.py         # SQLAlchemy Vehicle
    │   ├── schemas.py        # Pydantic request/response
    │   └── routers/vehicles.py
    ├── data/fleet.db         # Local SQLite DB (gitignored)
    ├── seed.py               # Optional sample data
    └── requirements.txt
```

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional seed data:

```bash
cd backend
source .venv/bin/activate
python seed.py
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Vite proxies `/api` requests to the backend on port `8000`.

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/vehicles?subcategoryId=` | List vehicles (optional filter) |
| `POST` | `/api/vehicles` | Create a vehicle |

Example create body:

```json
{
  "subcategoryId": "trucks-heavy",
  "licensePlate": "TX-4821",
  "make": "Ford",
  "model": "F-350",
  "status": "Active"
}
```
