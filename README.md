# Fleet App

## Features

- Browse cars by status in a flat sidebar (`Active`, `Maintenance`, `Inactive`, `Sold`)
- List cars filtered by the selected status
- Add a car with license plate, make, and model (status comes from the sidebar selection)
- Open a car profile (**View Car**) with tabs: Basic, Accidents (PDF upload), Maintenance, Payments history, Insurance

## Overview

Fleet App is a small full-stack fleet manager for cars. On the left you pick a status bucket; on the right you see cars with that status and can add new ones. **View Car** replaces the right panel with a resume-style profile (photo URL or placeholder, identity fields, kilometers, notes) while the sidebar stays. All vehicles are cars — there is no truck/van/type taxonomy. Status labels live in the React frontend; car records are stored in SQLite and served by a FastAPI backend.

## Screenshots

### Welcome

![Welcome screen with Add vehicle button](docs/screenshots/welcome.png)

### Status list

![Active cars list with add form and View Car action](docs/screenshots/status-list.png)

### Car profile

![Car profile Basic tab with identity fields and profile tabs](docs/screenshots/car-profile.png)

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
    Sidebar["Sidebar.jsx\nflat status list\nselected status"]
    Panel["VehiclePanel.jsx\nlist · add · View Car"]
    Detail["CarDetailPanel.jsx\nresume profile · edit"]
    Welcome["WelcomePanel.jsx"]
  end

  subgraph LocalData["Frontend-only data"]
    FleetData["fleetData.js\nvehicleStatuses"]
  end

  subgraph ApiLayer["API layer"]
    VehiclesApi["api/vehicles.js\nfetchVehicles · createVehicle\nfetchVehicle · updateVehicle"]
  end

  Main --> App
  Main --> IndexCSS
  App -->|"statuses, selection"| Sidebar
  App -->|"list or detail or welcome"| Panel
  App --> Detail
  App --> Welcome
  App --> FleetData
  App -->|"on status change / add / view"| VehiclesApi
  Panel -->|"onAddVehicle · onViewCar"| App
  Detail -->|"onBack · onSaved"| App
  Sidebar -->|"onSelectStatus(status)"| App
```

**State held in `App.jsx`:**

| State | Role |
| --- | --- |
| `selectedStatus` | Drives which cars to load (null = welcome) |
| `selectedVehicleId` | When set, right panel shows car profile |
| `vehicles` | Current list from the API |
| `loading` / `error` / `saving` | UX for fetch and create |

Statuses stay in `fleetData.js` (static). Cars live in SQLite via the API.

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
    List["GET /api/vehicles\n?status="]
    GetOne["GET /api/vehicles/{id}"]
    Create["POST /api/vehicles\n201 + VehicleRead"]
    Update["PATCH /api/vehicles/{id}"]
    Validate["status whitelist\nrequired field checks"]
  end

  subgraph SchemaLayer["app/schemas.py — Pydantic"]
    VCreate["VehicleCreate"]
    VUpdate["VehicleUpdate"]
    VRead["VehicleRead"]
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
  Mount --> GetOne
  Mount --> Create
  Mount --> Update
  List --> VRead
  GetOne --> VRead
  Create --> VCreate
  Create --> Validate
  Create --> VRead
  Update --> VUpdate
  Update --> Validate
  Update --> VRead
  List --> Model
  GetOne --> Model
  Create --> Model
  Update --> Model
  List --> Db
  GetOne --> Db
  Create --> Db
  Update --> Db
  Model --> Db
  Db --> SQLite
  CreateAll --> SQLite
```

### 4. Data model

Statuses for the sidebar live in the frontend (`vehicleStatuses`). The database stores cars and filters them by `status`.

```mermaid
erDiagram
  VEHICLES {
    string id PK "UUID"
    string license_plate
    string make
    string model
    string status "Active | Maintenance | Inactive | Sold"
    string image_url "optional photo URL"
    int kilometers
    int year "optional"
    string color "optional"
    string vin "optional"
    string notes "optional"
  }
```

```mermaid
flowchart LR
  subgraph FrontendStatuses["fleetData.js"]
    Active["Active"]
    Maint["Maintenance"]
    Inactive["Inactive"]
    Sold["Sold"]
  end

  subgraph DB["SQLite vehicles.status"]
    Rows["Car rows filter by status"]
  end

  Active -.-> Rows
  Maint -.-> Rows
  Inactive -.-> Rows
  Sold -.-> Rows
```

### 5. Sequence: list cars

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

  User->>Sidebar: select status
  Sidebar->>App: onSelectStatus(status)
  App->>App: setLoading(true)
  App->>Api: fetchVehicles(status)
  Api->>Vite: GET /api/vehicles?status=...
  Vite->>FastAPI: proxy GET /api/vehicles?...
  FastAPI->>Router: list_vehicles(Depends get_db)
  Router->>DB: SELECT * FROM vehicles\nWHERE status = ?\nORDER BY license_plate
  DB-->>Router: rows
  Router->>Schema: serialize → camelCase JSON
  Schema-->>Api: [{ id, licensePlate, make, model, status }]
  Api-->>App: data
  App->>App: setVehicles(data) · setLoading(false)
  App-->>User: VehiclePanel table updates
```

### 6. Sequence: create car

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
  App->>Api: createVehicle({ ...form, status: selectedStatus })
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
│   │   ├── components/       # Sidebar, VehiclePanel, WelcomePanel, CarDetailPanel
│   │   ├── data/fleetData.js # Status list
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
| `GET` | `/api/vehicles?status=` | List cars (optional status filter) |
| `GET` | `/api/vehicles/{id}` | Get one car (profile) |
| `POST` | `/api/vehicles` | Create a car |
| `PATCH` | `/api/vehicles/{id}` | Update car profile fields |
| `GET/POST` | `/api/vehicles/{id}/accidents` | List / create accidents (PDF via multipart) |
| `DELETE` | `/api/vehicles/{id}/accidents/{accidentId}` | Delete accident |
| `GET/POST` | `/api/vehicles/{id}/maintenance` | List / create maintenance records |
| `GET/POST` | `/api/vehicles/{id}/payments` | List / create insurance-related payments |
| `GET/POST` | `/api/vehicles/{id}/insurance` | List / create insurance policies |

Uploaded accident PDFs are stored under `backend/data/uploads/accidents/` and served at `/uploads/...` (Vite proxies `/uploads` in development).

Example create body:

```json
{
  "licensePlate": "TX-4821",
  "make": "Ford",
  "model": "F-350",
  "status": "Active"
}
```

Example patch body (all fields optional):

```json
{
  "kilometers": 50000,
  "imageUrl": "https://example.com/car.jpg",
  "year": 2021,
  "color": "White",
  "vin": "1FT8W3BT5MED12345",
  "notes": "Primary work truck.",
  "status": "Active"
}
```
