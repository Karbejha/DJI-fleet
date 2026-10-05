import re
import logging
from typing import Optional, List, Dict, Any
from .base import DroneLogParser
from ..models import (
    FileInspection,
    ParseResult,
    ParserCapabilities,
    FlightSummaryData,
)

logger = logging.getLogger(__name__)

class DJICompanionMetadataParser(DroneLogParser):
    @property
    def name(self) -> str:
        return "DJICompanionMetadataParser"

    @property
    def version(self) -> str:
        return "1.0.0"

    def can_handle(self, data: bytes, filename: str) -> bool:
        # Check filename pattern e.g. DJIFlightRecord_*.txt_275337
        if "DJIFlightRecord" in filename and re.search(r"\.txt_\d+$", filename):
            return True
        # Check if small metadata cache file with DJI strings
        if len(data) < 2048 and (b"DJI Mini" in data or b"DJI Air" in data or b"DJI Mavic" in data or b"1581F" in data):
            return True
        return False

    def get_capabilities(self) -> ParserCapabilities:
        return ParserCapabilities(
            has_metadata=True,
            has_telemetry=False,
            has_gps=False,
            has_imu=False,
            has_battery=True,
            has_motor_esc=False,
            has_rc=True,
            has_camera=True,
            has_events=False,
        )

    def _extract_metadata(self, data: bytes):
        text = data.decode("latin1", errors="ignore")
        
        # UUID search
        uuid_match = re.search(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", text, re.IGNORECASE)
        uuid_str = uuid_match.group(1) if uuid_match else None

        # Model search
        model = None
        for m in ["DJI Mini 4 Pro", "DJI Mini 3 Pro", "DJI Mini 3", "DJI Air 3", "DJI Mavic 3 Pro", "DJI Mavic 3", "DJI Matrice 350", "DJI Matrice 300", "DJI Inspire 3", "DJI Avata 2", "DJI Avata"]:
            if m.encode() in data:
                model = m
                break

        # Serial numbers extraction (standard DJI serials are 14, 15, or 20-22 alphanumeric chars)
        serials = re.findall(r"\b([0-9A-Z]{14,24})\b", text)
        aircraft_sn, battery_sn, camera_sn, rc_sn = None, None, None, None

        for s in serials:
            if s.startswith("1581F"):  # DJI Mini 4 Pro / Mavic serial prefix
                aircraft_sn = s
            elif s.startswith("5LR"):  # Battery serial prefix
                battery_sn = s
            elif s.startswith("6TV"):  # Camera/Gimbal serial prefix
                camera_sn = s
            elif s.startswith("6UZ"):  # RC serial prefix
                rc_sn = s

        return {
            "uuid": uuid_str,
            "model": model or "DJI Drone",
            "aircraft_sn": aircraft_sn,
            "battery_sn": battery_sn,
            "camera_sn": camera_sn,
            "rc_sn": rc_sn,
        }

    def inspect(self, data: bytes, filename: str) -> FileInspection:
        meta = self._extract_metadata(data)
        return FileInspection(
            file_type="COMPANION_METADATA",
            capabilities=self.get_capabilities(),
            aircraft_model=meta["model"],
            aircraft_sn=meta["aircraft_sn"],
            camera_sn=meta["camera_sn"],
            rc_sn=meta["rc_sn"],
            battery_sn=meta["battery_sn"],
            uuid=meta["uuid"],
            can_decode_telemetry=False,
            notes=f"Companion cache metadata. Extracted UUID: {meta['uuid']} and serials."
        )

    def parse(self, data: bytes, filename: str, api_key: Optional[str] = None) -> ParseResult:
        inspection = self.inspect(data, filename)
        meta = self._extract_metadata(data)

        summary = FlightSummaryData(
            aircraft_name=meta["model"],
            aircraft_sn=meta["aircraft_sn"],
            camera_sn=meta["camera_sn"],
            rc_sn=meta["rc_sn"],
            battery_sn=meta["battery_sn"],
        )

        return ParseResult(
            parser_name=self.name,
            parser_version=self.version,
            status="COMPLETED",
            status_reason="Extracted hardware identifiers and flight session UUID from companion cache.",
            inspection=inspection,
            summary=summary,
            telemetry=[],
            track_geojson=None,
            events=[]
        )
