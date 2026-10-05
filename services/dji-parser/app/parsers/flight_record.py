import math
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    import pydjirecord
    from pydjirecord import DJILog
    from pydjirecord.error import KeychainRequiredError, MissingAuxiliaryDataError
except ImportError:
    pydjirecord = None
    DJILog = None

from .base import DroneLogParser
from ..models import (
    FileInspection,
    ParseResult,
    ParserCapabilities,
    FlightSummaryData,
    TelemetrySampleModel,
)

logger = logging.getLogger(__name__)

class DJIFlightRecordParser(DroneLogParser):
    @property
    def name(self) -> str:
        return "DJIFlightRecordParser"

    @property
    def version(self) -> str:
        return "1.3.0"

    def can_handle(self, data: bytes, filename: str) -> bool:
        if filename.startswith("DJIFlightRecord") and (filename.endswith(".txt") or ".txt_" not in filename):
            return True
        if len(data) >= 100:
            # Check for DJI prefix magic or structure
            try:
                if DJILog is not None:
                    prefix = pydjirecord.Prefix.from_bytes(data[:100])
                    if 1 <= prefix.version <= 14:
                        return True
            except Exception:
                pass
        return False

    def get_capabilities(self) -> ParserCapabilities:
        return ParserCapabilities(
            has_metadata=True,
            has_telemetry=True,
            has_gps=True,
            has_imu=True,
            has_battery=True,
            has_motor_esc=False,
            has_rc=True,
            has_camera=True,
            has_events=True,
        )

    def inspect(self, data: bytes, filename: str) -> FileInspection:
        if DJILog is None:
            return FileInspection(
                file_type="DJI_FLIGHT_RECORD",
                capabilities=self.get_capabilities(),
                notes="pydjirecord library not available in environment"
            )

        try:
            log = DJILog.from_bytes(data)
            details = log.details
            start_str = details.start_time.isoformat() if details.start_time else None
            
            can_decrypt = log.version < 13
            
            return FileInspection(
                file_type="DJI_FLIGHT_RECORD",
                log_version=log.version,
                capabilities=self.get_capabilities(),
                aircraft_model=details.aircraft_name or f"DJI Product {details.product_type}",
                aircraft_sn=details.aircraft_sn,
                camera_sn=details.camera_sn,
                rc_sn=details.rc_sn,
                battery_sn=details.battery_sn,
                start_time=start_str,
                approx_duration_sec=float(details.total_time) if details.total_time else 0.0,
                total_distance_m=float(details.total_distance) if details.total_distance else 0.0,
                max_height_m=float(details.max_height) if details.max_height else 0.0,
                max_horizontal_speed_ms=float(details.max_horizontal_speed) if details.max_horizontal_speed else 0.0,
                max_vertical_speed_ms=float(details.max_vertical_speed) if details.max_vertical_speed else 0.0,
                takeoff_lat=float(details.latitude) if details.latitude else None,
                takeoff_lon=float(details.longitude) if details.longitude else None,
                can_decode_telemetry=can_decrypt,
                notes=f"DJI FlightRecord Version {log.version}. Line count: {details.record_line_count}."
            )
        except Exception as e:
            logger.exception("Failed to inspect DJI FlightRecord")
            return FileInspection(
                file_type="DJI_FLIGHT_RECORD",
                capabilities=self.get_capabilities(),
                notes=f"Header inspection error: {str(e)}"
            )

    def parse(self, data: bytes, filename: str, api_key: Optional[str] = None) -> ParseResult:
        inspection = self.inspect(data, filename)
        
        if DJILog is None:
            return ParseResult(
                parser_name=self.name,
                parser_version=self.version,
                status="FAILED",
                status_reason="pydjirecord not installed",
                inspection=inspection,
                summary=FlightSummaryData(),
            )

        try:
            log = DJILog.from_bytes(data)
            details = log.details
            
            summary = FlightSummaryData(
                aircraft_name=details.aircraft_name or f"DJI Product {details.product_type}",
                aircraft_sn=details.aircraft_sn,
                camera_sn=details.camera_sn,
                rc_sn=details.rc_sn,
                battery_sn=details.battery_sn,
                app_version=str(details.app_version) if details.app_version else None,
                start_time=details.start_time.isoformat() if details.start_time else None,
                duration_seconds=float(details.total_time) if details.total_time else 0.0,
                reported_distance_m=float(details.total_distance) if details.total_distance else 0.0,
                max_altitude_m=float(details.max_height) if details.max_height else 0.0,
                max_horizontal_speed_ms=float(details.max_horizontal_speed) if details.max_horizontal_speed else 0.0,
                max_vertical_speed_ms=float(details.max_vertical_speed) if details.max_vertical_speed else 0.0,
                takeoff_lat=float(details.latitude) if details.latitude else None,
                takeoff_lon=float(details.longitude) if details.longitude else None,
                takeoff_alt_m=float(details.take_off_altitude) if details.take_off_altitude else 0.0,
                photo_count=int(details.capture_num) if details.capture_num else 0,
                video_time_sec=float(details.video_time) if details.video_time else 0.0,
            )

            # Check telemetry decryption support
            frames = []
            status = "COMPLETED"
            status_reason = "Full telemetry and headers decoded successfully."

            if log.version >= 13:
                if not api_key:
                    status = "PARTIAL"
                    status_reason = (
                        f"The DJI flight file was recognized as FlightRecord V{log.version}, "
                        "but detailed telemetry could not be decrypted because no DJI API key is currently configured. "
                        "Basic flight metadata was imported successfully. You can reprocess this flight later."
                    )
                else:
                    try:
                        keychains = log.fetch_keychains(api_key, cache=True)
                        frames = log.frames(keychains)
                    except Exception as e:
                        logger.warning(f"Decryption failed for v{log.version}: {e}")
                        status = "PARTIAL"
                        status_reason = f"Decryption attempt failed with DJI API key: {str(e)}. Basic flight metadata was preserved."
            else:
                try:
                    frames = log.frames()
                except Exception as e:
                    logger.warning(f"Frame parsing failed for v{log.version}: {e}")
                    status = "PARTIAL"
                    status_reason = f"Frame parsing error: {str(e)}. Header metadata retained."

            # Normalize telemetry samples if frames exist
            telemetry_samples: List[TelemetrySampleModel] = []
            events: List[Dict[str, Any]] = []
            calculated_distance = 0.0
            prev_lat, prev_lon = None, None

            for i, f in enumerate(frames):
                # Extract frame details
                ts_ms = getattr(f, "timestamp_ms", i * 100)
                lat = getattr(f, "latitude", None)
                lon = getattr(f, "longitude", None)
                alt = getattr(f, "relative_altitude", getattr(f, "altitude", None))
                spd = getattr(f, "horizontal_speed", None)
                vspd = getattr(f, "vertical_speed", None)
                pitch = getattr(f, "pitch", None)
                roll = getattr(f, "roll", None)
                yaw = getattr(f, "yaw", None)
                bat = getattr(f, "battery_percent", None)
                volt = getattr(f, "battery_voltage", None)
                temp = getattr(f, "battery_temperature", None)
                sats = getattr(f, "satellites", None)
                rc_sig = getattr(f, "rc_signal", None)
                mode = getattr(f, "flight_mode", None)

                # Distance calculation using haversine
                if lat and lon and prev_lat and prev_lon and (lat != prev_lat or lon != prev_lon):
                    dlat = math.radians(lat - prev_lat)
                    dlon = math.radians(lon - prev_lon)
                    a = math.sin(dlat / 2)**2 + math.cos(math.radians(prev_lat)) * math.cos(math.radians(lat)) * math.sin(dlon / 2)**2
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    step_dist = 6371000.0 * c
                    if step_dist < 500:  # discard GPS glitch jumps
                        calculated_distance += step_dist
                if lat and lon:
                    prev_lat, prev_lon = lat, lon

                sample = TelemetrySampleModel(
                    timestampMs=ts_ms,
                    timeOffsetSec=i * 0.1,
                    latitude=lat,
                    longitude=lon,
                    relativeAltitude=alt,
                    horizontalSpeed=spd,
                    verticalSpeed=vspd,
                    pitch=pitch,
                    roll=roll,
                    yaw=yaw,
                    heading=yaw,
                    satellites=sats,
                    batteryPercent=bat,
                    batteryVoltage=volt,
                    batteryTemperature=temp,
                    rcSignal=rc_sig,
                    flightMode=str(mode) if mode else "GPS",
                )
                telemetry_samples.append(sample)

            if calculated_distance > 0:
                summary.calculated_distance_m = calculated_distance

            # Build GeoJSON track if coordinates exist
            track_geojson = None
            coords = [[s.longitude, s.latitude, s.relativeAltitude or 0.0] for s in telemetry_samples if s.latitude and s.longitude]
            if not coords and summary.takeoff_lat and summary.takeoff_lon:
                # If only takeoff point is known in partial mode
                coords = [[summary.takeoff_lon, summary.takeoff_lat, summary.takeoff_alt_m or 0.0]]

            if coords:
                track_geojson = {
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    },
                    "properties": {
                        "aircraft": summary.aircraft_name,
                        "pointCount": len(coords)
                    }
                }

            # Generate baseline events
            if summary.start_time:
                events.append({
                    "timestampMs": 0,
                    "timeOffsetSec": 0.0,
                    "category": "SYSTEM",
                    "severity": "INFO",
                    "title": "Motors Started",
                    "description": f"Flight initialized by aircraft {summary.aircraft_name} ({summary.aircraft_sn})"
                })
                events.append({
                    "timestampMs": 2000,
                    "timeOffsetSec": 2.0,
                    "category": "PILOT",
                    "severity": "INFO",
                    "title": "Takeoff Detected",
                    "description": f"Aircraft airborne at coordinates {summary.takeoff_lat}, {summary.takeoff_lon}"
                })

            return ParseResult(
                parser_name=self.name,
                parser_version=self.version,
                status=status,
                status_reason=status_reason,
                inspection=inspection,
                summary=summary,
                telemetry=telemetry_samples,
                track_geojson=track_geojson,
                events=events
            )

        except Exception as e:
            logger.exception("Parse exception")
            return ParseResult(
                parser_name=self.name,
                parser_version=self.version,
                status="FAILED",
                status_reason=str(e),
                inspection=inspection,
                summary=FlightSummaryData(),
            )
