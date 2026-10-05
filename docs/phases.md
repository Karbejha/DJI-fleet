# Implementation Phases & Development Roadmap

This document outlines the systematic implementation phases for the DJI Drone Fleet & Flight Analytics Platform.

---

## Phase 1: Platform Foundation & Core Ingestion Pipeline
- **Monorepo Architecture**: Setup pnpm / npm workspace with `apps/web`, `apps/api`, `services/dji-parser`, and `packages/shared`.
- **Infrastructure Services**: Docker Compose configurations for PostgreSQL + PostGIS, Redis, MinIO, NestJS API, Python FastAPI Parser, and Next.js Web frontend.
- **Relational & Spatial Database**: Schema definition with Prisma & PostGIS migrations covering users, roles, drones, batteries, controllers, cameras, pilots, flights, flight_files, and telemetry.
- **Authentication & RBAC**: JWT and secure HTTP-only cookies supporting `SUPER_ADMIN`, `ADMIN`, `ANALYST`, `PILOT`, and `VIEWER`.
- **Python Parser Service (`services/dji-parser`)**:
  - FastAPI application with `/parse`, `/inspect`, `/reprocess`, `/supported-formats`, and `/health`.
  - Pluggable parser architecture: `DJIFlightRecordParser` (v1-v14 with `pydjirecord`), `DJICompanionMetadataParser` (for `si_cache` companion files), and `DJIDatParser` (for `DJI_LOG_V3T` DAT logs).
- **File Upload & Storage Engine**:
  - Drag-and-drop multi-file upload.
  - Asynchronous background parsing jobs via BullMQ.
  - SHA-256 fingerprinting for duplicate detection.
  - S3 / MinIO permanent object storage preserving raw files.
  - Automatic fleet asset extraction (detecting and registering drone serials, battery serials, camera serials, and RC serials).

---

## Phase 2: Flight Analytics, GIS & Interactive Map
- **Flight Analytics Core**: Calculation of true 3D distance, maximum speed, climb/sink rates, flight envelope, and spatial bounding boxes.
- **Interactive MapLibre GL Visualization**:
  - High-performance vector rendering of flight tracks.
  - Dynamic path coloring: Altitude, Speed, Battery, RC Signal, and Flight Mode.
  - Visual waypoints for Takeoff, Landing, Home Point, and Photo/Video locations.
  - Satellite, Street, and Dark aviation map style toggling.
- **Synchronized Telemetry Charts**:
  - ECharts/Recharts displays for Altitude, Speeds (horizontal/vertical), Battery voltage/current/percentage/temperature, Satellites & Signal, and Gimbal/Attitude (Pitch/Roll/Yaw).
  - Cross-linked interactive scrubbing: hovering or clicking on the chart updates the drone marker on the map.
- **Multi-Format Flight Exports**:
  - Normalized CSV export.
  - GeoJSON export with 3D LineString and feature properties.
  - KML export formatted for Google Earth with altitude clamps and telemetry metadata.

---

## Phase 3: Chronological Flight Replay & Operations Cockpit
- **Playback Engine**:
  - 60fps clock-driven replay loop with variable speeds (0.25x, 0.5x, 1x, 2x, 4x, 8x).
  - Aircraft orientation marker moving in real-time with heading/yaw interpolation.
- **Synchronized Glass-Cockpit HUD**:
  - Tactical instrument display: current altitude, vertical speed indicator (VSI), ground speed, battery voltage/percentage, GPS satellite count, and flight mode.
- **Chronological Event Timeline**:
  - Time-stamped event stream: Motor start, Takeoff, Camera recording, GPS warnings, Signal attenuation, RTH initiation, and Landing.

---

## Phase 4: Fleet & Battery Asset Lifecycle Management
- **Drone Registry**:
  - Inventory tracking, total accumulated flight hours, distance traveled, flight count, and maintenance logs.
  - Automatic association of discovered aircraft serial numbers.
- **Battery Health & Lifecycle Tracker**:
  - Historical cycle count tracking, cell deviation analysis, min/max recorded operating temperatures, and health degradation curves.
- **Hardware Inventory**:
  - Controllers and camera payload tracking associated with flights.
- **Pilot & Mission Management**:
  - Pilot profiles, certifications, flight hour logs, and mission assignments.

---

## Phase 5: Incident Rule Engine & Advanced GIS Analytics
- **Configurable Incident Rule Engine**:
  - Transparent threshold checks: Rapid battery voltage drop, cell imbalance, thermal runaway, critical RC signal loss, GPS dilution, uncommanded altitude drops, and failsafe RTH triggers.
- **Rule-Based Flight Health Score (0-100)**:
  - Transparent point deductions with explanatory logs for GPS, Battery, RC Signal, Navigation, and Propulsion.
- **Spatial GIS Queries**:
  - Area intersection (`ST_Intersects`), buffer radius search (`ST_DWithin`), polygon containment, and geofence breach detection.
- **Global Operations Map (`/map`)**:
  - Aggregated multi-flight tracks with spatial clustering and fleet filtering.

---

## Phase 6: Printable Reports, Audit Logging & Extensible Inputs
- **Printable Aviation Reports**:
  - Comprehensive, print-ready PDF/HTML flight briefing sheets with map thumbnails, telemetry statistics, incident logs, and asset serials.
- **Comprehensive Audit Trail**:
  - Security and operational logging for logins, uploads, deletions, manual associations, and setting adjustments.
- **Future Extensibility**:
  - Stubs and interfaces for SRT video subtitles, RTK base station logs, and photogrammetry EXIF payloads.
