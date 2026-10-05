from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

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
    log_version: Optional[int] = None
    signature: Optional[str] = None
    capabilities: ParserCapabilities
    aircraft_model: Optional[str] = None
    aircraft_sn: Optional[str] = None
    camera_sn: Optional[str] = None
    rc_sn: Optional[str] = None
    battery_sn: Optional[str] = None
    uuid: Optional[str] = None
    start_time: Optional[str] = None
    approx_duration_sec: Optional[float] = None
    total_distance_m: Optional[float] = None
    max_height_m: Optional[float] = None
    max_horizontal_speed_ms: Optional[float] = None
    max_vertical_speed_ms: Optional[float] = None
    takeoff_lat: Optional[float] = None
    takeoff_lon: Optional[float] = None
    can_decode_telemetry: bool = False
    notes: Optional[str] = None

class TelemetrySampleModel(BaseModel):
    timestampMs: int
    timeOffsetSec: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gpsAltitude: Optional[float] = None
    relativeAltitude: Optional[float] = None
    barometricAltitude: Optional[float] = None
    velocityX: Optional[float] = None
    velocityY: Optional[float] = None
    velocityZ: Optional[float] = None
    horizontalSpeed: Optional[float] = None
    verticalSpeed: Optional[float] = None
    pitch: Optional[float] = None
    roll: Optional[float] = None
    yaw: Optional[float] = None
    heading: Optional[float] = None
    satellites: Optional[int] = None
    gpsLevel: Optional[int] = None
    batteryPercent: Optional[float] = None
    batteryVoltage: Optional[float] = None
    batteryCurrent: Optional[float] = None
    batteryTemperature: Optional[float] = None
    rcSignal: Optional[float] = None
    flightMode: Optional[str] = None
    gimbalPitch: Optional[float] = None
    gimbalRoll: Optional[float] = None
    gimbalYaw: Optional[float] = None
    isRecording: Optional[bool] = None
    isTakingPhoto: Optional[bool] = None
    raw: Optional[Dict[str, Any]] = None

class FlightSummaryData(BaseModel):
    aircraft_name: Optional[str] = None
    aircraft_sn: Optional[str] = None
    camera_sn: Optional[str] = None
    rc_sn: Optional[str] = None
    battery_sn: Optional[str] = None
    app_version: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_seconds: float = 0.0
    reported_distance_m: Optional[float] = None
    calculated_distance_m: Optional[float] = None
    max_altitude_m: Optional[float] = None
    max_horizontal_speed_ms: Optional[float] = None
    max_vertical_speed_ms: Optional[float] = None
    takeoff_lat: Optional[float] = None
    takeoff_lon: Optional[float] = None
    takeoff_alt_m: Optional[float] = None
    landing_lat: Optional[float] = None
    landing_lon: Optional[float] = None
    home_lat: Optional[float] = None
    home_lon: Optional[float] = None
    photo_count: int = 0
    video_time_sec: float = 0.0

class ParseResult(BaseModel):
    parser_name: str
    parser_version: str
    status: str  # COMPLETED, PARTIAL, UNSUPPORTED, FAILED
    status_reason: Optional[str] = None
    inspection: FileInspection
    summary: FlightSummaryData
    telemetry: List[TelemetrySampleModel] = Field(default_factory=list)
    track_geojson: Optional[Dict[str, Any]] = None
    events: List[Dict[str, Any]] = Field(default_factory=list)
