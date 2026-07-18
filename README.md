# Fleet App

## Features

- Browse vehicle categories and subcategories (trucks, vans, cars)
- List vehicles filtered by subcategory
- Add a vehicle with license plate, make, model, and status
- Statuses: `Active`, `Maintenance`, `Retired`, `Out of Service`

## Overview

Fleet App is a small full-stack fleet manager. On the left you pick a vehicle subcategory (for example Heavy Duty trucks or Cargo vans); on the right you see the vehicles in that group and can add new ones with a license plate, make, model, and status. Category labels live in the React frontend; vehicle records are stored in SQLite and served by a FastAPI backend.

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

## Vite proxy (development)

During local development the React app runs on **port 5173** and the FastAPI API on **port 8000**. Browsers treat those as different origins. This project uses Vite’s **dev-server proxy** so the frontend can call the API with same-origin relative URLs (`/api/...`) while Vite forwards those requests to the backend.

### How it is configured

**1. Vite proxy** — `frontend/vite.config.js`:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

Any request from the browser to `http://localhost:5173/api/...` is forwarded by the Vite process to `http://localhost:8000/api/...`. The path is preserved; only the host/port change.

**2. API client default base URL** — `frontend/src/api/vehicles.js`:

```js
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
```

With no env override, calls look like `fetch('/api/vehicles')`. That hits the Vite origin, so the proxy applies. Paths after `/api` (for example `/vehicles`) are appended by the client helpers.

**3. Backend routes** — FastAPI mounts the vehicles router under `/api`:

```python
app.include_router(vehicles.router, prefix="/api")
# → GET/POST /api/vehicles
```

So the path the browser uses (`/api/vehicles`) matches the path FastAPI serves after the proxy rewrite.

```mermaid
flowchart LR
  Browser["Browser\norigin: localhost:5173"]
  Vite["Vite dev server :5173"]
  API["FastAPI :8000"]

  Browser -->|"1. GET /api/vehicles\n(same origin)"| Vite
  Vite -->|"2. proxy forward\nGET http://localhost:8000/api/vehicles"| API
  API -->|"3. JSON response"| Vite
  Vite -->|"4. response to browser"| Browser
```

### Why this helps in development

| Benefit | What it means in practice |
| --- | --- |
| Avoids CORS for day-to-day UI work | The browser only talks to `:5173`. Cross-origin checks do not apply to the proxied hop (Vite → FastAPI is server-to-server). |
| Simple relative URLs | The client uses `/api` instead of hard-coding `http://localhost:8000` in every call. |
| Matches a common production shape | Many deployments serve the SPA and API under one public origin (or a gateway). Relative `/api` paths stay valid when you later put a reverse proxy in front. |
| One mental model while coding | Open the app at `:5173`; API traffic still goes through that origin. Backend stays on `:8000` for docs (`/docs`) and direct testing. |
| Easy to override later | `VITE_API_URL` can point somewhere else without changing call sites. |

**Note:** CORS is still configured on FastAPI (`allow_origins=["http://localhost:5173"]`) so direct browser calls to `:8000` (or a no-proxy setup below) can work. With the proxy, that CORS policy is usually unused for the SPA’s `/api` fetches.

### Running without the Vite proxy

Use this when you want the browser to call FastAPI **directly** (different origin), for example to debug CORS, hit a remote API, or drop the proxy entirely.

**1. Point the API client at the backend**

Create `frontend/.env.local` (gitignored if you add `.env*` patterns; otherwise keep secrets out of commits):

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000/api
```

Restart `npm run dev` after changing env files. Vite only reads `VITE_*` vars at startup.

The client already supports this via:

```js
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
```

Requests become `http://localhost:8000/api/vehicles` instead of `/api/vehicles`.

**2. Keep backend CORS aligned with the UI origin**

In `backend/app/main.py`, `CORSMiddleware` must allow the frontend origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If the UI is served from another host/port, add that origin to `allow_origins` (or temporarily use a broader list only for local debugging).

**3. Optionally remove or disable the Vite proxy**

In `frontend/vite.config.js`, delete the `server.proxy` block (or leave it; unused if the client never calls `/api` on `:5173`):

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // no server.proxy — browser talks to FastAPI directly
})
```

**4. Checklist**

| Step | Action |
| --- | --- |
| Env | Set `VITE_API_URL=http://localhost:8000/api` |
| Restart | Restart Vite after env changes |
| CORS | Ensure FastAPI allows `http://localhost:5173` |
| Proxy | Optional: remove `server.proxy` from `vite.config.js` |
| Verify | Network tab should show requests to `:8000`, not only `:5173/api` |

```mermaid
flowchart LR
  Browser["Browser\norigin: localhost:5173"]
  API["FastAPI :8000"]

  Browser -->|"GET http://localhost:8000/api/vehicles\n(cross-origin + CORS)"| API
  API -->|"Access-Control-Allow-Origin\n+ JSON"| Browser
```

**Production note:** Prefer a reverse proxy (nginx, Caddy, cloud gateway) or same-origin hosting instead of exposing `localhost` URLs. Set `VITE_API_URL` (or bake the public API base at build time) to your real API origin when you are not serving `/api` from the same host as the SPA.

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

By default, Vite proxies `/api` to the backend on port `8000`. See [Vite proxy (development)](#vite-proxy-development) for how that works, why it helps, and how to call the API directly without the proxy.

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
