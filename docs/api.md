# REST API Specifications (`/api/v1`)

All endpoints are versioned under `/api/v1`. Authentication uses JSON Web Tokens (JWT) supplied via `Authorization: Bearer <token>` or secure HTTP-only cookies.

---

## 1. Authentication & RBAC

- `POST /api/v1/auth/login`: Authenticate with email and password. Returns JWT and user profile with assigned role.
- `POST /api/v1/auth/logout`: Invalidate session / clear auth cookie.
- `GET  /api/v1/auth/me`: Current authenticated user identity and permissions.

Roles:
- `SUPER_ADMIN`: Full system administrative control.
- `ADMIN`: Fleet and user management, file reprocessing.
- `ANALYST`: Flight analytics, incident investigation, custom exports.
- `PILOT`: View flights, missions, personal flight statistics.
- `VIEWER`: Read-only access to dashboard and historical flights.

---

## 2. Ingestion & File Inspector

- `POST /api/v1/imports/upload`: Multi-part file upload (supports single or batch files). Computes SHA-256 immediately. Checks for duplicates:
  - If duplicate exists: Returns `409 Conflict` with existing flight ID and reference.
  - If new: Stores raw file in S3/MinIO and enqueues background processing job.
- `GET /api/v1/imports/:jobId`: Returns real-time status of the ingestion pipeline (`INSPECTING`, `PARSING`, `EXTRACTING_TRACK`, `COMPLETED`, `FAILED`).
- `GET /api/v1/files/:id`: File inspector endpoint returning raw metadata, SHA-256 fingerprint, storage location, parser version, detected capabilities, and association confidence.
- `POST /api/v1/files/:id/reprocess`: Triggers re-parsing of an existing stored log file.

---

## 3. Flight Management & Telemetry

- `GET /api/v1/flights`: Filterable and paginated flight list.
  - Query parameters: `page`, `limit`, `droneId`, `pilotId`, `batteryId`, `startDate`, `endDate`, `status`, `minDistance`, `maxAltitude`, `q` (search string).
- `GET /api/v1/flights/:id`: Full flight summary including header stats, aircraft info, calculated statistics, health score breakdown, and associated files.
- `DELETE /api/v1/flights/:id`: Soft-delete or hard-delete flight record (requires explicit confirmation).
- `GET /api/v1/flights/:id/track`: PostGIS GeoJSON track (3D LineString) and key coordinate waypoints (Takeoff, Landing, Home Point).
- `GET /api/v1/flights/:id/telemetry`: Query downsampled or full-resolution telemetry stream.
  - Query parameters: `resolution` (`100ms`, `500ms`, `1000ms`, `all`), `fields` (comma-separated list of metrics).
- `GET /api/v1/flights/:id/events`: Chronological list of flight warnings, incidents, and operational triggers.

---

## 4. Multi-Format Exports & Reports

- `GET /api/v1/flights/:id/export/csv`: Download normalized telemetry stream as CSV.
- `GET /api/v1/flights/:id/export/geojson`: Export PostGIS flight geometry and point features as GeoJSON.
- `GET /api/v1/flights/:id/export/kml`: Export Google Earth 3D flight trajectory file.
- `GET /api/v1/flights/:id/report`: Generates printable aviation briefing report.

---

## 5. Fleet & Asset Management

- `GET /api/v1/drones`: List all drones with flight count, total airtime, distance, and health status.
- `GET /api/v1/drones/:id`: Detailed aircraft profile, associated hardware serials, maintenance history, and flight history.
- `POST /api/v1/drones`: Register or update drone asset.
- `GET /api/v1/batteries`: Battery fleet dashboard with cycle counts and degradation indicators.
- `GET /api/v1/batteries/:id`: Battery health history, cycle curve, temperature extremes, and cell voltage trends.
- `GET /api/v1/controllers`: List RC controllers and paired aircraft.
- `GET /api/v1/pilots`: Pilot directory with flight hours and mission rosters.

---

## 6. Spatial GIS Queries & Dashboard

- `POST /api/v1/gis/query`: Spatial filter for flights intersecting a drawn polygon, bounding box, or radial buffer (`ST_Intersects`, `ST_DWithin`).
- `GET /api/v1/analytics/dashboard`: Executive KPI metrics (Total Flights, Total Flight Time, Total Distance, Active Drones, Active Batteries, Warnings, Incidents, Flights this Month) and monthly breakdown charts.
