from typing import List, Optional
from .base import DroneLogParser
from .flight_record import DJIFlightRecordParser
from .companion_metadata import DJICompanionMetadataParser
from .dat_parser import DJIDatParser

class ParserRegistry:
    def __init__(self):
        self._parsers: List[DroneLogParser] = [
            DJIFlightRecordParser(),
            DJICompanionMetadataParser(),
            DJIDatParser(),
        ]

    def register_parser(self, parser: DroneLogParser):
        self._parsers.append(parser)

    def find_parser(self, data: bytes, filename: str) -> Optional[DroneLogParser]:
        for parser in self._parsers:
            if parser.can_handle(data, filename):
                return parser
        return None

    def get_all_parsers(self) -> List[DroneLogParser]:
        return list(self._parsers)

default_registry = ParserRegistry()
