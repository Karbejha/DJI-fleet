# Environment Variables & Secrets Reference

Configuration is managed via environment variables. Create a `.env` file at the root of the project using this specification.

---

## 1. Core Platform Configuration

```env
# Node Environment
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3000

# Authentication & Security
JWT_SECRET=super-secure-production-jwt-secret-key-at-least-32-characters
JWT_EXPIRATION=7d
COOKIE_SECRET=super-secure-cookie-secret-random-hex-string

# Database (PostgreSQL + PostGIS)
DATABASE_URL=postgresql://postgres:postgres_secure_password@postgres:5432/dji_fleet?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_password
POSTGRES_DB=dji_fleet

# Redis (Job Queues & Caching)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO / AWS S3 Object Storage
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=dji-raw-flight-logs
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true

# DJI Parser Microservice
PARSER_SERVICE_URL=http://parser:8000
PARSER_SERVICE_TIMEOUT_MS=60000

# DJI API Key for v13/v14 Keychain Decryption
# Leave blank to operate in PARTIAL mode (Header extraction only)
DJI_API_KEY=

# Frontend Configuration (apps/web)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=
```

---

## 2. Security Rules for DJI API Credentials

1. `DJI_API_KEY` must **never** be exposed in client bundles or public repositories.
2. The key is consumed strictly on the server side by the isolated parser microservice.
3. If no key is set:
   - All FlightRecord versions (1 through 14) are still inspected.
   - Header summary statistics (aircraft serial, battery serial, takeoff coords, max speed, max height, total distance) are accurately extracted.
   - Processing status is marked as `PARTIAL` with a clear explanation that keychain decryption credentials are required to decrypt high-frequency sub-second telemetry points.
