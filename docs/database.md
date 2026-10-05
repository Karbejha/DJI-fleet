# Database Architecture & Spatial PostGIS Schema

The DJI Fleet & Flight Analytics Platform utilizes **PostgreSQL 16** with the **PostGIS** spatial extension. This architecture couples relational integrity for asset lifecycles with high-performance geospatial indexing for 3D flight trajectories.

---

## 1. Schema Overview & Entity Relationship

```text
               ┌─────────────┐
               │    Users    │
               └──────┬──────┘
                      │ 1:N
               ┌──────▼──────┐
               │  AuditLogs  │
               └─────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Department  │     │   Missions   │     │    Pilots    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │ 1:N                │ 1:N                │ 1:N
       └──────────────┬─────┴────────────────────┘
                      │
               ┌──────▼──────┐       1:N       ┌──────────────┐
               │   Flights   │ ─────────────── │ FlightFiles  │
               └──────┬──────┘                 └──────┬───────┘
                      │                               │
         ┌────────────┼────────────┐           ┌──────▼───────┐
         │ 1:N        │ 1:N        │ 1:N       │  ParserRuns  │
         ▼            ▼            ▼           └──────────────┘
  ┌─────────────┐┌───────────┐┌───────────┐
  │ Telemetry   ││  Flight   ││ Flight    │
  │ Points (3D) ││  Tracks   ││ Warnings  │
  └─────────────┘└───────────┘└───────────┘
         ▲
         │ Linked
  ┌──────┴──────┐  1:N   ┌─────────────┐  1:N   ┌─────────────┐
  │   Drones    │ ◄───── │ Batteries   │ ◄───── │ Controllers │
  └─────────────┘        └─────────────┘        └─────────────┘
```

---

## 2. Core Relational Tables (DDL Specifications)

### 2.1 Users, Roles & Permissions
```sql
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANALYST', 'PILOT', 'VIEWER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 Fleet Assets (Drones, Batteries, Controllers, Cameras, Pilots)
```sql
CREATE TYPE asset_status AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED', 'LOST');

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer VARCHAR(50) NOT NULL DEFAULT 'DJI',
    model VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    firmware_version VARCHAR(50),
    status asset_status NOT NULL DEFAULT 'ACTIVE',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    purchase_date DATE,
    total_flight_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_distance_meters DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_flight_count INTEGER NOT NULL DEFAULT 0,
    last_flight_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batteries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100),
    drone_id UUID REFERENCES drones(id) ON DELETE SET NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cycle_count INTEGER NOT NULL DEFAULT 0,
    nominal_capacity_mah INTEGER,
    latest_health_pct DOUBLE PRECISION,
    min_recorded_voltage DOUBLE PRECISION,
    max_recorded_temperature DOUBLE PRECISION,
    cell_deviation DOUBLE PRECISION,
    status asset_status NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE controllers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100),
    status asset_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100),
    drone_id UUID REFERENCES drones(id) ON DELETE SET NULL,
    status asset_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pilots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100),
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    total_flight_time_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3 Flights & Missions
```sql
CREATE TYPE processing_status AS ENUM (
    'PENDING', 'INSPECTING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'UNSUPPORTED'
);

CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    location_name VARCHAR(200),
    pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
    drone_id UUID REFERENCES drones(id) ON DELETE SET NULL,
    planned_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number VARCHAR(50) UNIQUE NOT NULL,
    uuid VARCHAR(100) UNIQUE,
    drone_id UUID REFERENCES drones(id) ON DELETE SET NULL,
    pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
    battery_id UUID REFERENCES batteries(id) ON DELETE SET NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    reported_distance_meters DOUBLE PRECISION,
    calculated_distance_meters DOUBLE PRECISION,
    
    max_altitude_meters DOUBLE PRECISION,
    max_horizontal_speed DOUBLE PRECISION,
    max_vertical_speed DOUBLE PRECISION,
    
    takeoff_location geometry(Point, 4326),
    landing_location geometry(Point, 4326),
    home_location geometry(Point, 4326),
    
    photo_count INTEGER NOT NULL DEFAULT 0,
    video_duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    health_score INTEGER DEFAULT 100,
    health_breakdown JSONB,
    
    processing_status processing_status NOT NULL DEFAULT 'PENDING',
    processing_notes TEXT,
    
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flights_started_at ON flights(started_at);
CREATE INDEX idx_flights_drone_id ON flights(drone_id);
CREATE INDEX idx_flights_pilot_id ON flights(pilot_id);
CREATE INDEX idx_flights_processing_status ON flights(processing_status);
CREATE INDEX idx_flights_takeoff_location ON flights USING GIST(takeoff_location);
```

### 2.4 Flight Files & Storage
```sql
CREATE TYPE file_category AS ENUM (
    'DJI_FLIGHT_RECORD', 'DJI_DAT', 'COMPANION_METADATA', 'SRT', 'PHOTO', 'VIDEO', 'RTK', 'UNKNOWN'
);

CREATE TABLE flight_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    storage_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) UNIQUE NOT NULL,
    file_category file_category NOT NULL DEFAULT 'UNKNOWN',
    detected_format VARCHAR(100),
    detected_version INTEGER,
    parser_name VARCHAR(100),
    parser_version VARCHAR(50),
    association_confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    association_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_files_sha256 ON flight_files(sha256);
CREATE INDEX idx_flight_files_flight_id ON flight_files(flight_id);
```

### 2.5 Spatial Flight Tracks & Telemetry Points
```sql
CREATE TABLE flight_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE UNIQUE,
    track_geometry geometry(LineStringZ, 4326) NOT NULL,
    simplified_geometry geometry(LineString, 4326) NOT NULL,
    bounding_box geometry(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_tracks_geom ON flight_tracks USING GIST(track_geometry);
CREATE INDEX idx_flight_tracks_simple_geom ON flight_tracks USING GIST(simplified_geometry);
CREATE INDEX idx_flight_tracks_bbox ON flight_tracks USING GIST(bounding_box);

CREATE TABLE telemetry_points (
    id BIGSERIAL PRIMARY KEY,
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    location geometry(PointZ, 4326),
    altitude_relative DOUBLE PRECISION,
    altitude_barometric DOUBLE PRECISION,
    speed_horizontal DOUBLE PRECISION,
    speed_vertical DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    pitch DOUBLE PRECISION,
    roll DOUBLE PRECISION,
    yaw DOUBLE PRECISION,
    satellites INTEGER,
    rc_signal DOUBLE PRECISION,
    battery_percent DOUBLE PRECISION,
    battery_voltage DOUBLE PRECISION,
    battery_current DOUBLE PRECISION,
    battery_temperature DOUBLE PRECISION,
    flight_mode VARCHAR(50),
    gimbal_pitch DOUBLE PRECISION,
    gimbal_roll DOUBLE PRECISION,
    gimbal_yaw DOUBLE PRECISION,
    is_recording BOOLEAN,
    is_taking_photo BOOLEAN,
    raw_extra JSONB
);

CREATE INDEX idx_telemetry_flight_time ON telemetry_points(flight_id, timestamp_ms);
CREATE INDEX idx_telemetry_location ON telemetry_points USING GIST(location);
```

### 2.6 Incident Rules, Flight Warnings & Audit Logs
```sql
CREATE TYPE warning_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE warning_category AS ENUM (
    'INFO', 'WARNING', 'CRITICAL', 'SYSTEM', 'PILOT', 'BATTERY', 'GPS', 'RC', 'RTH', 'CAMERA', 'MOTOR'
);

CREATE TABLE flight_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    time_offset_seconds DOUBLE PRECISION NOT NULL,
    category warning_category NOT NULL,
    severity warning_severity NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_location geometry(Point, 4326),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_events_flight ON flight_events(flight_id);
CREATE INDEX idx_flight_events_category ON flight_events(category);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```
