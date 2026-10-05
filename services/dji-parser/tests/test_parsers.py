import os
import sys

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.parsers.registry import default_registry
from app.parsers.flight_record import DJIFlightRecordParser
from app.parsers.companion_metadata import DJICompanionMetadataParser
from app.parsers.dat_parser import DJIDatParser

def test_registry_has_all_parsers():
    parsers = default_registry.get_all_parsers()
    names = [p.name for p in parsers]
    assert "DJIFlightRecordParser" in names
    assert "DJICompanionMetadataParser" in names
    assert "DJIDatParser" in names

def test_companion_parser_inspection():
    parser = DJICompanionMetadataParser()
    fake_data = b"5LRPMCGCA408GT 6TVQMB60M208RW 6UZBN1202103M9 1581F6Z9C2516003AGLHB DJI Mini 4 Pro 90aef0c2-6cce-4648-9962-71abc18f5773"
    assert parser.can_handle(fake_data, "DJIFlightRecord_2025-09-09_[12-43-37].txt_275337")
    
    inspection = parser.inspect(fake_data, "test.txt_275337")
    assert inspection.file_type == "COMPANION_METADATA"
    assert inspection.aircraft_model == "DJI Mini 4 Pro"
    assert inspection.uuid == "90aef0c2-6cce-4648-9962-71abc18f5773"
    assert inspection.aircraft_sn == "1581F6Z9C2516003AGLHB"

def test_dat_parser_inspection():
    parser = DJIDatParser()
    # Mock first 256 bytes with DJI_LOG_V3T
    fake_data = b"\x00" * 16 + b"BUILD Aug 12 2024\x00" + b"\x00" * 200 + b"DJI_LOG_V3T\x00" + b"\x00" * 1000
    assert parser.can_handle(fake_data, "2024-08-29_14-35-35_FLY022.DAT")
    
    inspection = parser.inspect(fake_data, "2024-08-29_14-35-35_FLY022.DAT")
    assert inspection.file_type == "DJI_DAT"
    assert "DJI_LOG_V3T" in (inspection.signature or "")
    assert inspection.can_decode_telemetry is False
    assert inspection.capabilities.has_telemetry is False

def test_corrupt_or_unsupported_file():
    garbage = b"\x00\x01\x02\x03random_garbage_non_dji_file"
    parser = default_registry.find_parser(garbage, "some_random_image.png")
    assert parser is None
