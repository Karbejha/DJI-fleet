# DJI Parser Service Architecture & Pluggable Specifications

The DJI Parser Service is an internal Python 3.12+ FastAPI microservice located in `services/dji-parser`. It provides an isolated, memory-efficient, and secure environment for inspecting, decoding, and normalizing complex binary DJI flight records and proprietary DAT dumps.

---

## 1. Pluggable Parser Interface (`DroneLogParser`)

All log decoders implement a common abstract base class ensuring modularity, clear capability detection, and non-blocking extensible parsing:

```python
from abc import ABC, abstractmethod
from typing import BinaryIO
from pydantic import BaseModel

class ParserCapabilities(BaseModel):
    has_metadata: bool = False
    has_telemetry: bool = False
    has_gps: bool = False
    has_imu: bool = False
    has_battery: bool = False
    has_motor_esc: bool = False
    has_rc: bool = False
    has_camera: bool = False
    has_events: bool = False

class FileInspection(BaseModel):
    file_type: str
    log_version: int | None = None
    signature: str | None = None
    capabilities: ParserCapabilities
    aircraft_model: str | None = None
    aircraft_sn: str | None = None
    start_time: str | None = None
    approx_duration_sec: float | None = None
    can_decode_telemetry: bool = False
    notes: str | None = None

class DroneLogParser(ABC):
    @abstractmethod
    def can_handle(self, stream: BinaryIO, filename: str) -> bool:
        """Inspects magic bytes and headers to determine if this parser can handle the stream."""
        pass

    @abstractmethod
    def inspect(self, stream: BinaryIO, filename: str) -> FileInspection:
        """Fast non-decrypting inspection of headers and metadata."""
        pass

    @abstractmethod
    def parse(self, stream: BinaryIO, filename: str, api_key: str | None = None) -> dict:
        """Full extraction of flight metadata and normalized telemetry frames."""
        pass

    @abstractmethod
    def get_capabilities(self) -> ParserCapabilities:
        """Returns the capabilities supported by this parser implementation."""
        pass
```

---

## 2. Parser Implementations

### 2.1 `DJIFlightRecordParser`
- **Supported Formats**: `DJIFlightRecord_YYYY-MM-DD_[HH-MM-SS].txt` (versions 1 through 14).
- **Core Engine**: `pydjirecord` with custom fallback binary readers.
- **Capabilities**:
  - **Header Inspection (No API Key Required)**: Reads `Prefix` and `Details` blocks to extract:
    - Log version (e.g. 14)
    - Aircraft model (e.g. `DJI Mini 4 Pro`)
    - Hardware serial numbers: Aircraft, Camera/Gimbal, RC, Battery
    - Start timestamp, total distance, max altitude, horizontal/vertical top speed
    - Takeoff coordinates & altitude, landing coordinates, line count
  - **Telemetry Decryption (v13/v14 with `DJI_API_KEY`)**:
    - Queries DJI Keychain service using encrypted feature points
    - Decodes records: OSDFlight (GPS, attitude, velocities), RC status, Battery status, Gimbal angles
    - Normalizes into unified `TelemetrySample` series.
  - **Graceful Partial Fallback**: If no DJI API key is configured, parsing returns status `PARTIAL` with all header data and explains that keychain credentials are required for detailed sub-second telemetry.

### 2.2 `DJICompanionMetadataParser`
- **Supported Formats**: `DJIFlightRecord_*.txt_<filesize>` cache files (from DJI Fly App `si_cache`).
- **Signature & Extraction**:
  - Extracts aircraft model (e.g. `DJI Mini 4 Pro`)
  - Extracts aircraft SN, camera SN, RC SN, battery SN
  - Extracts flight session UUID (e.g. `90aef0c2-6cce-4648-9962-71abc18f5773`)
  - Enables 100% deterministic flight association across multiple uploaded files.

### 2.3 `DJIDatParser`
- **Supported Formats**: Aircraft internal black-box dumps (`*.DAT` files, e.g. `FLY022.DAT`).
- **Signature Detection**: Detects `DJI_LOG_V3T` signature (typically found at byte offset 242) and firmware build stamps (e.g. `BUILD Aug 12 2024`).
- **Policy**: In accordance with Rule 9, the parser preserves the 96+ MB file immutably in object storage, records the forensic signature, file size, and timestamp approximations, and flags status as `PARTIAL` / `UNSUPPORTED_DECODER`. It never fabricates simulated telemetry.

---

## 3. Microservice REST Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health status and available parser modules |
| `/supported-formats` | `GET` | Matrix of supported DJI formats, versions, and capabilities |
| `/inspect` | `POST` | Inspects an uploaded file stream and returns format detection |
| `/parse` | `POST` | Executes complete parsing and telemetry extraction |
| `/reprocess` | `POST` | Reprocesses an existing stored log with an updated key or parser |
