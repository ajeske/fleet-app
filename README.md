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

### 1. System overview (runtime)

How the pieces talk to each other while developing locally.

```mermaid
flowchart TB
  User(["User"])

  subgraph Browser["Browser"]
    SPA["React SPA\nUI + client state"]
  end

  subgraph FE["Frontend process — :5173"]
    Vite["Vite 8\ndev server + HMR"]
    Proxy["/api proxy\n→ localhost:8000"]
    Tailwind["Tailwind CSS 4\n@tailwindcss/vite"]
  end

  subgraph BE["Backend process — :8000"]
    Uvicorn["Uvicorn\nASGI server --reload"]
    FastAPI["FastAPI app\nFleet Manager API"]
    CORS["CORSMiddleware\nallow localhost:5173"]
  end

  subgraph Persist["Persistence"]
    SQLite[("SQLite\nbackend/data/fleet.db")]
  end

  User --> SPA
  SPA -->|"static assets / HMR"| Vite
  SPA -->|"fetch('/api/...')"| Proxy
  Proxy -->|"HTTP JSON"| Uvicorn
  Uvicorn --> FastAPI
  FastAPI --> CORS
  FastAPI -->|"SQLAlchemy"| SQLite
  Tailwind -.->|"styles"| SPA
```

### 2. Frontend component & state architecture

```mermaid
flowchart TB
  subgraph Entry["Bootstrap"]
    Main["main.jsx"]
    IndexCSS["index.css\nTailwind"]
    App["App.jsx\nstate owner"]
  end

  subgraph UI["UI components"]
    Sidebar["Sidebar.jsx\ncategories · expand/collapse\nselected subcategory"]
    Panel["VehiclePanel.jsx\nlist · add form · status badges"]
  end

  subgraph LocalData["Frontend-only data"]
    FleetData["fleetData.js\ncategories taxonomy\nvehicleStatuses"]
  end

  subgraph ApiLayer["API layer"]
    VehiclesApi["api/vehicles.js\nfetchVehicles()\ncreateVehicle()"]
  end

  Main --> App
  Main --> IndexCSS
  App -->|"categories, selection"| Sidebar
  App -->|"vehicles, loading, error, saving"| Panel
  App --> FleetData
  App -->|"on subcategory change / add"| VehiclesApi
  Panel -->|"onAddVehicle(form)"| App
  Sidebar -->|"onSelectSubcategory(id)"| App
```

**State held in `App.jsx`:**

| State | Role |
| --- | --- |
| `selectedSubcategoryId` | Drives which vehicles to load |
| `vehicles` | Current list from the API |
| `loading` / `error` / `saving` | UX for fetch and create |

Categories stay in `fleetData.js` (static). Vehicles live in SQLite via the API.

### 3. Backend layered architecture

```mermaid
flowchart TB
  subgraph Transport["Transport"]
    Uvicorn["Uvicorn ASGI"]
  end

  subgraph AppLayer["app/main.py"]
    FastAPIApp["FastAPI(title='Fleet Manager API')"]
    CORS["CORSMiddleware"]
    Health["GET /health"]
    Mount["include_router(..., prefix='/api')"]
    CreateAll["Base.metadata.create_all()"]
  end

  subgraph RouterLayer["app/routers/vehicles.py"]
    List["GET /api/vehicles\n?subcategoryId="]
    Create["POST /api/vehicles\n201 + VehicleRead"]
    Validate["status whitelist\nrequired field checks"]
  end

  subgraph SchemaLayer["app/schemas.py — Pydantic"]
    VCreate["VehicleCreate\ncamelCase aliases in"]
    VRead["VehicleRead\ncamelCase aliases out"]
  end

  subgraph OrmLayer["ORM"]
    Model["models.py — Vehicle"]
    Db["database.py\nengine · SessionLocal · get_db()"]
  end

  subgraph Store["Store"]
    SQLite[("fleet.db\ntable: vehicles")]
  end

  Uvicorn --> FastAPIApp
  FastAPIApp --> CORS
  FastAPIApp --> Health
  FastAPIApp --> Mount
  FastAPIApp --> CreateAll
  Mount --> List
  Mount --> Create
  List --> VRead
  Create --> VCreate
  Create --> Validate
  Create --> VRead
  List --> Model
  Create --> Model
  List --> Db
  Create --> Db
  Model --> Db
  Db --> SQLite
  CreateAll --> SQLite
```

### 4. Data model

Categories exist only on the frontend. The database stores vehicles keyed by `subcategory_id`.

```mermaid
erDiagram
  VEHICLES {
    string id PK "UUID"
    string subcategory_id "e.g. trucks-heavy"
    string license_plate
    string make
    string model
    string status "Active | Maintenance | Retired | Out of Service"
  }
```

```mermaid
flowchart LR
  subgraph FrontendTaxonomy["fleetData.js taxonomy"]
    Trucks["Trucks"]
    Vans["Vans"]
    Cars["Cars"]
    TH["trucks-heavy"]
    TL["trucks-light"]
    VC["vans-cargo"]
    VP["vans-passenger"]
    CS["cars-sedan"]
    CU["cars-suv"]
    Trucks --> TH
    Trucks --> TL
    Vans --> VC
    Vans --> VP
    Cars --> CS
    Cars --> CU
  end

  subgraph DB["SQLite vehicles.subcategory_id"]
    Rows["Vehicle rows filter by subcategory_id"]
  end

  TH -.-> Rows
  VC -.-> Rows
```

### 5. Sequence: list vehicles

```mermaid
sequenceDiagram
  actor User
  participant Sidebar
  participant App as App.jsx
  participant Api as api/vehicles.js
  participant Vite as Vite proxy :5173
  participant FastAPI as FastAPI :8000
  participant Router as vehicles router
  participant Schema as VehicleRead
  participant DB as SQLite

  User->>Sidebar: select subcategory
  Sidebar->>App: onSelectSubcategory(id)
  App->>App: setLoading(true)
  App->>Api: fetchVehicles(subcategoryId)
  Api->>Vite: GET /api/vehicles?subcategoryId=...
  Vite->>FastAPI: proxy GET /api/vehicles?...
  FastAPI->>Router: list_vehicles(Depends get_db)
  Router->>DB: SELECT * FROM vehicles\nWHERE subcategory_id = ?\nORDER BY license_plate
  DB-->>Router: rows
  Router->>Schema: serialize → camelCase JSON
  Schema-->>Api: [{ id, subcategoryId, licensePlate, ... }]
  Api-->>App: data
  App->>App: setVehicles(data) · setLoading(false)
  App-->>User: VehiclePanel table updates
```

### 6. Sequence: create vehicle

```mermaid
sequenceDiagram
  actor User
  participant Panel as VehiclePanel
  participant App as App.jsx
  participant Api as api/vehicles.js
  participant Vite as Vite proxy
  participant FastAPI as FastAPI
  participant Router as vehicles router
  participant Schema as VehicleCreate / VehicleRead
  participant DB as SQLite

  User->>Panel: fill form · Save
  Panel->>App: onAddVehicle(form)
  App->>App: setSaving(true)
  App->>Api: createVehicle({ subcategoryId, ...form })
  Api->>Vite: POST /api/vehicles JSON
  Vite->>FastAPI: proxy POST
  FastAPI->>Schema: parse body (aliases → snake_case)
  Schema->>Router: VehicleCreate payload
  Router->>Router: validate status + required fields
  Router->>DB: INSERT vehicle (uuid id)
  DB-->>Router: committed row
  Router->>Schema: VehicleRead response
  Schema-->>Api: created vehicle JSON
  Api-->>App: created
  App->>App: append to vehicles · setSaving(false)
  App-->>User: new row in table
```

### 7. Tech map by concern

```mermaid
flowchart LR
  subgraph Presentation["Presentation"]
    R["React 19"]
    T["Tailwind CSS 4"]
  end

  subgraph Tooling["Build / DX"]
    V["Vite 8"]
    E["ESLint"]
    UV["Uvicorn --reload"]
  end

  subgraph API["HTTP API"]
    F["FastAPI"]
    P["Pydantic v2"]
  end

  subgraph DataAccess["Data access"]
    S["SQLAlchemy 2"]
    Q[("SQLite")]
  end

  R --> V
  R --> T
  V -->|"/api proxy"| F
  F --> P
  F --> S
  S --> Q
  UV --> F
  E -.-> R
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
