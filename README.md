# DJI Drone Fleet & Flight Analytics Platform

An enterprise-grade, production-quality platform for importing, analyzing, visualizing, managing, and investigating DJI drone flight logs, high-frequency telemetry, PostGIS geospatial tracks, and fleet hardware assets.

---

## 1. Key Capabilities

- **Multi-Format Ingestion**:
  - Binary `DJIFlightRecord*.txt` (V1 through V14) via `pydjirecord`.
  - Proprietary engineering black-box DAT dumps (`*.DAT` with `DJI_LOG_V3T` signature).
  - Companion metadata caches (`.txt_<size>` from `si_cache`).
- **Cryptographic & Key Handling**:
  - Header inspection without decryption (extracts aircraft model, serials, takeoff point, max speed/altitude, total distance).
  - Server-side keychain decryption for V13/V14 records when `DJI_API_KEY` is provided.
  - Transparent `PARTIAL` status when decryption keys are unconfigured (no fabricated telemetry).
- **Duplicate Prevention & Association**:
  - Instant SHA-256 fingerprinting for duplicate detection.
  - Multi-file flight association engine correlating by flight UUID, aircraft serial, and timestamp window.
- **Flight Analytics & 3D Interactive Map**:
  - MapLibre GL JS vector map with 3D trajectories.
  - Color track by Altitude, Speed, Battery, RC Signal, and Flight Mode.
  - Chronological 60fps flight replay with variable speeds (0.25x - 8x) and tactical glass-cockpit HUD.
  - ECharts telemetry charts synchronized with the map and cursor crosshair.
- **Explainable Health & Incident Engine**:
  - Transparent rule-based health score (0-100) with itemized deduction explanations.
  - Automated anomaly detection: RC signal degradation, GPS quality drop, high vertical sink rates, thermal runaway.
- **Fleet & Battery Lifecycle Management**:
  - Auto-discovery of drone, battery, camera, and RC serial numbers.
  - Historical battery health degradation trend curves, cell voltage deviation, and cycle counts.
- **PostGIS Spatial Analytics**:
  - Spatial queries for flights intersecting bounding boxes, radius buffers (`ST_DWithin`), and polygon geofences.
  - Global multi-flight operations map (`/map`).
- **Multi-Format Exports & Reports**:
  - Normalized CSV, GeoJSON 3D FeatureCollection, and KML for Google Earth.
  - Formal printable flight dossier reports.
- **Bilingual & Responsive Operations UI**:
  - Arabic and English (LTR / RTL toggle).
  - Tactical aviation dark theme default.

---

## 2. Architecture & Monorepo Structure

```text
c:\workspace\DJI-Fleet\
├── apps/
│   ├── web/                     # Next.js 15 App Router, Tailwind CSS, MapLibre GL, ECharts, i18n
│   └── api/                     # NestJS Core API, PostGIS, S3/MinIO, Rule Engine, Export Services
├── services/
│   └── dji-parser/              # Python 3.12+ FastAPI Microservice (pydjirecord, binary parsers)
├── packages/
│   ├── shared/                  # Shared TypeScript types, telemetry interfaces, enums, SI units
│   ├── contracts/               # OpenAPI contracts & validation schemas
│   └── config/                  # Shared configs
├── docker/                      # Container Dockerfiles
├── docs/                        # Comprehensive documentation
│   ├── adr/                     # Architecture Decision Records
│   ├── architecture.md          # System topology & design
│   ├── database.md              # PostGIS schema & relational models
│   ├── parser.md                # Parser microservice & capability matrix
│   ├── api.md                   # REST API documentation (/api/v1)
│   ├── deployment.md            # Docker Compose orchestration
│   ├── environment.md           # Environment variables & secrets
│   └── troubleshooting.md       # Operational guides & decrypt FAQs
├── docker-compose.yml           # Development container stack
├── docker-compose.production.yml# Production container stack
└── .env.example                 # Environment configuration template
```

---

## 3. Quickstart with Docker Compose

### Prerequisites
- Docker & Docker Compose v2+ installed.

### Setup
1. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Start the multi-container stack:
   ```bash
   docker compose up -d
   ```
3. Open your browser:
   - **Operations Cockpit (Web)**: `http://localhost:3000`
   - **Backend API & Swagger Docs**: `http://localhost:4000/api/docs`
   - **MinIO Object Console**: `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)

---

## 4. Standalone Local Development (Without Docker)

You can run each service directly on your development host:

### 1. Python Parser Service
```bash
cd services/dji-parser
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 2. NestJS Backend API
```bash
cd apps/api
npm install
npm run start:dev
```

### 3. Next.js Web Frontend
```bash
cd apps/web
npm install
npm run dev
```

---

## 5. Testing

- **Python Parser Tests**:
  ```bash
  cd services/dji-parser
  python -c "from tests.test_parsers import *; test_registry_has_all_parsers(); test_companion_parser_inspection(); test_dat_parser_inspection(); test_corrupt_or_unsupported_file(); print('All parser tests passed!')"
  ```
- **Backend API Build Test**:
  ```bash
  cd apps/api
  npm run build
  ```
- **Frontend Web Build Test**:
  ```bash
  cd apps/web
  npm run build
  ```

---

## 6. Real Sample Data Verification

The platform was verified against real-world DJI FlightRecord samples:
- `DJIFlightRecord_2025-12-27_[15-40-51].txt` (Version 14, DJI Mini 4 Pro, SN `1581F6Z9C2516003`)
- `2024-08-29_14-35-35_FLY022.DAT` (96 MB DAT dump, `DJI_LOG_V3T` signature)
- `DJIFlightRecord_2025-09-09_[12-43-37].txt_275337` (Companion metadata cache, UUID `90aef0c2-6cce-4648-9962-71abc18f5773`)
