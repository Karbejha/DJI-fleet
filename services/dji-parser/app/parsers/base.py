from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from ..models import FileInspection, ParseResult, ParserCapabilities

class DroneLogParser(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        pass

    @abstractmethod
    def can_handle(self, data: bytes, filename: str) -> bool:
        """Determines if this parser handles the given file bytes and name."""
        pass

    @abstractmethod
    def inspect(self, data: bytes, filename: str) -> FileInspection:
        """Fast non-decrypting inspection of headers and metadata."""
        pass

    @abstractmethod
    def parse(self, data: bytes, filename: str, api_key: Optional[str] = None) -> ParseResult:
        """Full extraction of flight metadata, telemetry frames, and events."""
        pass

    @abstractmethod
    def get_capabilities(self) -> ParserCapabilities:
        """Returns the capabilities supported by this parser implementation."""
        pass
