# ADR 001: Architecture Overview for DJI Drone Fleet & Flight Analytics Platform

## Status
Accepted

## Context
The organization requires an enterprise-grade platform for importing, analyzing, visualizing, managing, and investigating DJI drone flight logs. The system must scale from single-operator field use to multi-tenant, fleet-wide operations handling thousands of flights, diverse drone models (e.g., DJI Mini 4 Pro, Matrice series, Mavic series), multiple payloads, pilots, and heterogeneous file types (binary FlightRecord v1-v14, proprietary DAT files, companion metadata caches, SRT files, and future RTK/photogrammetry streams).

Key architectural constraints:
1. **Binary DJI Protocols & Cryptographic Realities**: Modern DJI FlightRecord logs (v13 and v14) require DJI keychain credentials for payload decryption. However, headers and high-level flight summaries are extractable without decryption. Proprietary DAT files (`DJI_LOG_V3T`) require specialized forensic parsers. The platform must never fabricate missing telemetry, must preserve raw artifacts, and must clearly distinguish between `COMPLETED`, `PARTIAL`, and `UNSUPPORTED` states.
2. **High-Frequency Telemetry**: Drone flights generate 10-50 Hz telemetry streams (30,000+ points per flight). Inefficient persistence or transfer directly degrades browser and database performance. A multi-tier storage strategy (raw object storage, downsampled GIS Linestrings, and queryable normalized telemetry) is mandatory.
3. **Operations & Aviation UX**: The user interface must feel like an operational tactical cockpit: dark mode default with high contrast, MapLibre GL vector maps, linked synchronized crosshairs across 10+ telemetry metrics, chronological playback scrubbing with aircraft attitude/heading indicators, and bilingual LTR/RTL support (English and Arabic).

## Architecture Decisions

### 1. Service Topology
- **Web Frontend (`apps/web`)**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui design tokens, TanStack Query for caching, MapLibre GL for GIS rendering, ECharts/Recharts for synchronized telemetry charting, and lightweight client-side state for the 60fps flight replay loop.
- **API Gateway & Core Backend (`apps/api`)**: NestJS modular service handling authentication (JWT + HTTP-only cookies), role-based access control (RBAC), fleet inventory, flight lifecycle, spatial querying via PostGIS, rule-based incident detection, export generation, and asynchronous job queuing.
- **DJI Parser Service (`services/dji-parser`)**: Dedicated, non-public Python 3.12+ FastAPI service leveraging `pydjirecord`, binary parsers, and pluggable parser interfaces. Separated from the Node.js backend to cleanly isolate native binary decoding, cryptographic routines, and heavy numeric computing.
- **Asynchronous Processing (`BullMQ + Redis`)**: File ingestion, checksum calculation, object storage upload, binary parser RPC, spatial track generation, and anomaly rule evaluation are offloaded to background workers.
- **Storage Tier**:
  - **Relational & Spatial**: PostgreSQL 16 with PostGIS extension for metadata, assets, audit trails, and indexed 2D/3D flight geometries.
  - **Object Storage**: MinIO (development) / AWS S3 (production) for unmodified source logs, companion files, and full-resolution telemetry blobs.

```
┌────────────────────────────────────────────────────────┐
│              Next.js Frontend (Aviation UI)           │
│   MapLibre GL + Telemetry Charts + Replay Controller   │
│                 (English & Arabic / RTL)               │
└───────────────────────────▲────────────────────────────┘
                            │ REST / WebSocket / SSE
┌───────────────────────────▼────────────────────────────┐
│                    NestJS Core API                     │
│   Auth (RBAC) │ Fleet Management │ Flight Analytics   │
│   Spatial GIS │ Incident Engine  │ Report & Export    │
└─────────────▲───────────────────────────▲──────────────┘
              │                           │
     BullMQ Job Queue              Internal REST
              │                           │
┌─────────────▼─────────────┐ ┌───────────▼──────────────┐
│       Worker Queue        │ │   Python Parser Service  │
│  Validation & Checksums   │ │  FastAPI + pydjirecord   │
│  PostGIS Track Ingestion  │ │  FlightRecord V1-V14     │
│  Rule Anomaly Evaluation  │ │  DAT V3T & Companion     │
└─────────────┬─────────────┘ └──────────────────────────┘
              │
  ┌───────────┴───────────┐
  │                       │
┌─▼──────────────────┐ ┌──▼──────────────────┐
│ PostgreSQL 16 +    │ │ S3 / MinIO          │
│ PostGIS Spatial    │ │ Immutable Raw Logs  │
└────────────────────┘ └─────────────────────┘
```

### 2. File Ingestion & Parsing Strategy
1. **Pluggable Parser Pipeline**:
   - `DJIFlightRecordParser`: Dispatches to `pydjirecord`. Performs header extraction and optional keychain decryption if `DJI_API_KEY` is provisioned.
   - `DJICompanionMetadataParser`: Extracts device serials (aircraft, gimbal, RC, battery), model name, and flight UUID from `.txt_size` cache files.
   - `DJIDatParser`: Identifies `DJI_LOG_V3T` signatures and build metadata, archives raw files, and provides an honest `PARTIAL` status without data hallucination.
2. **Duplicate Ingestion Prevention**: Files are fingerprinted with SHA-256 before storage. Duplicate uploads trigger immediate association navigation rather than re-ingestion.
3. **Flight Association Engine**: Multi-evidence correlation based on flight UUID, timestamp overlaps (±30s), aircraft serial numbers, and geographic proximity.

### 3. Spatial & Telemetry Storage
- Telemetry points are stored normalized in PostGIS as 3D Point geometries (`ST_MakePoint(lon, lat, alt)`) and aggregated into spatial `LINESTRING` / `MULTILINESTRING` for efficient spatial queries (bounding boxes, geofences, distance calculations).
- For sub-second browser replay, downsampled LODs (Level-Of-Detail) are streamed via range-based API queries (`resolution=100ms|500ms|1000ms`).

### 4. Rule-Based Health & Incident Evaluation
- Transparent, explainable rule engine scoring flights from 0 to 100 based on quantifiable physical metrics:
  - GPS dilution of precision / satellite drops
  - Battery cell voltage deviation and sudden drops
  - Radio control (RC) signal attenuation (<20% thresholds)
  - Rapid descent / attitude deviations / RTH activations
- Missing telemetry explicitly triggers an un-scored category ("Insufficient telemetry") rather than an artificial penalty or false pass.

## Consequences
- Clean separation of concerns between binary parsing (Python) and application lifecycle (TypeScript/NestJS).
- Zero data loss: raw logs remain immutably archived.
- Immediate usability even without DJI API keys, with simple reprocessing when keys or parsers become available.
