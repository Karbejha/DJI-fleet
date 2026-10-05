# Deployment & Docker Orchestration Guide

The platform is designed to run anywhere using Docker Compose, or standalone on local development workstations.

---

## 1. Container Topology (`docker-compose.yml`)

The infrastructure consists of 6 core services configured with persistent volumes and health checks:

| Service | Image / Base | Internal Port | Host Port | Role |
|---|---|---|---|---|
| `postgres` | `postgis/postgis:16-3.4` | 5432 | 5432 | PostGIS Relational & Spatial Database |
| `redis` | `redis:7-alpine` | 6379 | 6379 | In-memory message broker & BullMQ queues |
| `minio` | `minio/minio:latest` | 9000, 9001 | 9000, 9001 | S3-compatible raw file object storage |
| `parser` | Python 3.12 (`services/dji-parser`) | 8000 | 8000 | Pluggable binary DJI parser microservice |
| `api` | Node 22 (`apps/api`) | 4000 | 4000 | NestJS REST API & background ingestion worker |
| `web` | Node 22 (`apps/web`) | 3000 | 3000 | Next.js App Router aviation UI |

---

## 2. Quickstart with Docker Compose

1. Clone or navigate to the repository directory:
   ```bash
   cd c:/workspace/DJI-Fleet
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Boot up the entire stack:
   ```bash
   docker compose up -d
   ```
4. Check running containers:
   ```bash
   docker compose ps
   ```
5. Apply database schema and seed demonstration assets:
   ```bash
   docker compose exec api npm run db:migrate
   docker compose exec api npm run db:seed
   ```
6. Open your browser:
   - **Frontend Cockpit**: `http://localhost:3000`
   - **Backend API & Swagger Docs**: `http://localhost:4000/api/docs`
   - **MinIO Console**: `http://localhost:9001` (Default: `minioadmin` / `minioadmin`)

---

## 3. Data Persistence & Volumes

Named volumes guarantee that data persists across container restarts:
- `postgres_data`: PostGIS database records, spatial indexes, and users.
- `minio_data`: Immutably archived raw flight records (`.txt`), DAT dumps, and caches.
- `redis_data`: Queue state and job idempotency hashes.

---

## 4. Standalone Local Development (Without Docker)

When running directly on the host machine:
1. Python parser:
   ```bash
   cd services/dji-parser
   python -m uvicorn app.main:app --port 8000 --reload
   ```
2. NestJS API:
   ```bash
   cd apps/api
   npm run start:dev
   ```
3. Next.js Web:
   ```bash
   cd apps/web
   npm run dev
   ```
The application includes graceful fallbacks (such as local file storage when MinIO is not configured, and local database adapters) ensuring instant development velocity.
