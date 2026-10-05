// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  PILOT = 'PILOT',
  VIEWER = 'VIEWER',
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
  LOST = 'LOST',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  INSPECTING = 'INSPECTING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  UNSUPPORTED = 'UNSUPPORTED',
}

export enum FileCategory {
  DJI_FLIGHT_RECORD = 'DJI_FLIGHT_RECORD',
  DJI_DAT = 'DJI_DAT',
  COMPANION_METADATA = 'COMPANION_METADATA',
  SRT = 'SRT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  RTK = 'RTK',
  UNKNOWN = 'UNKNOWN',
}

export enum EventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum EventCategory {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  SYSTEM = 'SYSTEM',
  PILOT = 'PILOT',
  BATTERY = 'BATTERY',
  GPS = 'GPS',
  RC = 'RC',
  RTH = 'RTH',
  CAMERA = 'CAMERA',
  MOTOR = 'MOTOR',
}

// Normalized Telemetry Sample
export interface TelemetrySample {
  timestampMs: number;
  timeOffsetSec?: number;
  latitude?: number;
  longitude?: number;
  gpsAltitude?: number;
  relativeAltitude?: number;
  barometricAltitude?: number;
  velocityX?: number;
  velocityY?: number;
  velocityZ?: number;
  horizontalSpeed?: number;
  verticalSpeed?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  heading?: number;
  satellites?: number;
  gpsLevel?: number;
  batteryPercent?: number;
  batteryVoltage?: number;
  batteryCurrent?: number;
  batteryTemperature?: number;
  rcSignal?: number;
  flightMode?: string;
  gimbalPitch?: number;
  gimbalRoll?: number;
  gimbalYaw?: number;
  isRecording?: boolean;
  isTakingPhoto?: boolean;
  raw?: Record<string, unknown>;
}

// Coordinate GeoJSON Point
export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Deductions and Health Score Breakdown
export interface HealthDeduction {
  category: 'GPS' | 'Battery' | 'RC Signal' | 'Navigation' | 'Flight Stability' | 'Propulsion';
  points: number;
  reason: string;
  timestampMs?: number;
}

export interface HealthScoreBreakdown {
  overallScore: number;
  gpsScore: number | null;
  batteryScore: number | null;
  rcScore: number | null;
  navigationScore: number | null;
  stabilityScore: number | null;
  propulsionScore: number | null;
  deductions: HealthDeduction[];
  isSufficientTelemetry: boolean;
}

// Incident / Anomaly definition
export interface FlightAnomaly {
  type: string;
  severity: EventSeverity;
  startMs: number;
  endMs: number;
  value: number;
  threshold: number;
  message: string;
}

// Flight Event
export interface FlightEvent {
  id: string;
  flightId: string;
  timestampMs: number;
  timeOffsetSec: number;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  acknowledged?: boolean;
}

// Asset interfaces
export interface DroneAsset {
  id: string;
  manufacturer: string;
  model: string;
  nickname?: string;
  serialNumber: string;
  firmwareVersion?: string;
  status: AssetStatus;
  departmentId?: string;
  departmentName?: string;
  purchaseDate?: string;
  totalFlightTimeSeconds: number;
  totalDistanceMeters: number;
  totalFlightCount: number;
  lastFlightAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatteryAsset {
  id: string;
  serialNumber: string;
  model?: string;
  droneId?: string;
  droneNickname?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  cycleCount: number;
  nominalCapacityMah?: number;
  latestHealthPct?: number;
  minRecordedVoltage?: number;
  maxRecordedTemperature?: number;
  cellDeviation?: number;
  status: AssetStatus;
  flightCount: number;
  totalFlightTimeSeconds: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ControllerAsset {
  id: string;
  serialNumber: string;
  model?: string;
  status: AssetStatus;
  createdAt: string;
}

export interface CameraAsset {
  id: string;
  serialNumber: string;
  model?: string;
  droneId?: string;
  status: AssetStatus;
  createdAt: string;
}

export interface PilotAsset {
  id: string;
  userId?: string;
  fullName: string;
  licenseNumber?: string;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
  totalFlightTimeSeconds: number;
  totalFlights: number;
  createdAt: string;
}

export interface MissionAsset {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  locationName?: string;
  pilotId?: string;
  droneId?: string;
  plannedAt?: string;
  status: string;
  createdAt: string;
}

// Flight Summary
export interface FlightSummary {
  id: string;
  flightNumber: string;
  uuid?: string;
  droneId?: string;
  drone?: DroneAsset;
  pilotId?: string;
  pilot?: PilotAsset;
  batteryId?: string;
  battery?: BatteryAsset;
  missionId?: string;
  mission?: MissionAsset;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  reportedDistanceMeters?: number;
  calculatedDistanceMeters?: number;
  maxAltitudeMeters?: number;
  maxHorizontalSpeed?: number;
  maxVerticalSpeed?: number;
  takeoffLocation?: GeoPoint;
  landingLocation?: GeoPoint;
  homeLocation?: GeoPoint;
  photoCount: number;
  videoDurationSeconds: number;
  healthScore?: number;
  healthBreakdown?: HealthScoreBreakdown;
  processingStatus: ProcessingStatus;
  processingNotes?: string;
  fileCount?: number;
  warningCount?: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// File Record
export interface FlightFileRecord {
  id: string;
  flightId?: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  fileCategory: FileCategory;
  detectedFormat?: string;
  detectedVersion?: number;
  parserName?: string;
  parserVersion?: string;
  associationConfidence: number;
  associationReason?: string;
  createdAt: string;
}

// Capabilities
export interface ParserCapabilities {
  hasMetadata: boolean;
  hasTelemetry: boolean;
  hasGps: boolean;
  hasImu: boolean;
  hasBattery: boolean;
  hasMotorEsc: boolean;
  hasRc: boolean;
  hasCamera: boolean;
  hasEvents: boolean;
}

// File Inspection
export interface FileInspectionResult {
  fileType: string;
  logVersion?: number;
  signature?: string;
  capabilities: ParserCapabilities;
  aircraftModel?: string;
  aircraftSn?: string;
  cameraSn?: string;
  rcSn?: string;
  batterySn?: string;
  uuid?: string;
  startTime?: string;
  approxDurationSec?: number;
  canDecodeTelemetry: boolean;
  notes?: string;
}

// KPI Dashboard Data
export interface DashboardStats {
  totalFlights: number;
  totalFlightTimeHours: number;
  totalDistanceKm: number;
  activeDrones: number;
  activeBatteries: number;
  totalWarnings: number;
  totalIncidents: number;
  flightsThisMonth: number;
  monthlyStats: Array<{
    month: string;
    flightCount: number;
    flightHours: number;
    distanceKm: number;
  }>;
  flightsByDrone: Array<{
    droneId: string;
    model: string;
    nickname?: string;
    count: number;
  }>;
  flightsByPilot: Array<{
    pilotId: string;
    name: string;
    count: number;
  }>;
  warningsByCategory: Array<{
    category: EventCategory;
    count: number;
  }>;
  fleetAlerts: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    severity: EventSeverity;
    entityType: 'DRONE' | 'BATTERY' | 'FLIGHT';
    entityId: string;
    timestamp: string;
  }>;
  recentFlights: FlightSummary[];
}
