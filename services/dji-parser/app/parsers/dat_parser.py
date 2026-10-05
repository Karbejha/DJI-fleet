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

class DJIDatParser(DroneLogParser):
    @property
    def name(self) -> str:
        return "DJIDatParser"

    @property
    def version(self) -> str:
        return "1.0.0"

    def can_handle(self, data: bytes, filename: str) -> bool:
        if filename.upper().endswith(".DAT"):
            return True
        if b"DJI_LOG_V3T" in data[:1024] or b"BUILD " in data[:256]:
            return True
        return False

    def get_capabilities(self) -> ParserCapabilities:
        # Honest capability matrix per Rule 9
        return ParserCapabilities(
            has_metadata=True,
            has_telemetry=False,
            has_gps=False,
            has_imu=False,
            has_battery=False,
            has_motor_esc=False,
            has_rc=False,
            has_camera=False,
            has_events=False,
        )

    def _extract_dat_info(self, data: bytes, filename: str):
        # Look for signature DJI_LOG_V3T
        sig = None
        idx = data[:2048].find(b"DJI_LOG")
        if idx != -1:
            sig_raw = data[idx:idx+16].split(b"\x00")[0]
            sig = sig_raw.decode("ascii", errors="ignore")

        # Look for build string
        build_str = None
        build_idx = data[:512].find(b"BUILD ")
        if build_idx != -1:
            build_raw = data[build_idx:build_idx+64].split(b"\x00")[0]
            build_str = build_raw.decode("ascii", errors="ignore")

        # Parse date from filename e.g. 2024-08-29_14-35-35_FLY022.DAT
        start_time = None
        match = re.search(r"(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})", filename)
        if match:
            date_part = match.group(1)
            time_part = match.group(2).replace("-", ":")
            start_time = f"{date_part}T{time_part}Z"

        return {
            "signature": sig or "DJI_LOG_V3T",
            "build_info": build_str,
            "start_time": start_time,
            "size_bytes": len(data),
        }

    def inspect(self, data: bytes, filename: str) -> FileInspection:
        info = self._extract_dat_info(data, filename)
        return FileInspection(
            file_type="DJI_DAT",
            signature=info["signature"],
            capabilities=self.get_capabilities(),
            start_time=info["start_time"],
            can_decode_telemetry=False,
            notes=f"DJI DAT file detected ({info['signature']}). Firmware: {info['build_info'] or 'Unknown'}. Size: {info['size_bytes']} bytes."
        )

    def parse(self, data: bytes, filename: str, api_key: Optional[str] = None) -> ParseResult:
        inspection = self.inspect(data, filename)
        info = self._extract_dat_info(data, filename)

        summary = FlightSummaryData(
            start_time=info["start_time"],
        )

        return ParseResult(
            parser_name=self.name,
            parser_version=self.version,
            status="PARTIAL",
            status_reason=(
                f"DJI DAT binary file fingerprinted ({info['signature']}) and archived in object storage. "
                "Proprietary engineering decoder is currently unavailable. No synthetic telemetry generated."
            ),
            inspection=inspection,
            summary=summary,
            telemetry=[],
            track_geojson=None,
            events=[]
        )
