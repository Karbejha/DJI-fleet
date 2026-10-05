import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { ParserClientService } from './parser-client.service';
import { FleetService } from '../fleet/fleet.service';
import { RulesService } from '../rules/rules.service';
import {
  FlightSummary,
  FlightFileRecord,
  ProcessingStatus,
  FileCategory,
  EventSeverity,
  EventCategory,
} from '@dji-fleet/shared';
import { v4 as uuidv4 } from 'uuid';

export interface IngestionJobStatus {
  jobId: string;
  filename: string;
  stage: 'UPLOADED' | 'FINGERPRINTED' | 'PARSING' | 'ASSOCIATING' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  progressPct: number;
  message: string;
  flightId?: string;
  flightNumber?: string;
  error?: string;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private jobs: Map<string, IngestionJobStatus> = new Map();

  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly parserClient: ParserClientService,
    private readonly fleetService: FleetService,
    private readonly rulesService: RulesService
  ) {}

  getJobStatus(jobId: string): IngestionJobStatus | null {
    return this.jobs.get(jobId) || null;
  }

  async getFileInspectorData(fileId: string): Promise<any> {
    const store = this.db.getStore();
    const file = store.flightFiles.get(fileId);
    if (!file) {
      throw new NotFoundException(`File #${fileId} not found`);
    }

    const flight = file.flightId ? store.flights.get(file.flightId) : null;
    return {
      file,
      associatedFlight: flight
        ? {
            id: flight.id,
            flightNumber: flight.flightNumber,
            aircraft: flight.drone?.nickname || flight.drone?.model,
            startedAt: flight.startedAt,
          }
        : null,
    };
  }

  async processUploadedFile(file: Express.Multer.File, userApiKey?: string): Promise<any> {
    const jobId = uuidv4();
    const store = this.db.getStore();
    const buffer = file.buffer;
    const filename = file.originalname;

    // 1. Calculate SHA-256 Checksum for Duplicate Detection (Section 11)
    const sha256 = this.storage.computeSha256(buffer);
    this.logger.log(`Ingesting ${filename} (SHA-256: ${sha256.substring(0, 16)}...)`);

    // Check for duplicate in database
    for (const existingFile of store.flightFiles.values()) {
      if (existingFile.sha256 === sha256) {
        const flight = existingFile.flightId ? store.flights.get(existingFile.flightId) : null;
        this.logger.warn(`Duplicate upload detected for ${filename} (SHA-256 match)`);
        return {
          duplicate: true,
          message: 'This file already exists in the system.',
          existingFileId: existingFile.id,
          associatedFlightId: existingFile.flightId,
          flightNumber: flight?.flightNumber || 'Unassigned',
        };
      }
    }

    const jobStatus: IngestionJobStatus = {
      jobId,
      filename,
      stage: 'UPLOADED',
      progressPct: 15,
      message: 'File uploaded and SHA-256 verified.',
    };
    this.jobs.set(jobId, jobStatus);

    // 2. Persist raw file to S3/MinIO
    const storageKey = `logs/${new Date().getFullYear()}/${uuidv4()}_${filename}`;
    const uploadRes = await this.storage.uploadFile(storageKey, buffer, file.mimetype || 'application/octet-stream');

    jobStatus.stage = 'PARSING';
    jobStatus.progressPct = 40;
    jobStatus.message = 'Executing parser microservice...';

    // 3. Invoke Parser Microservice
    const parseResult = await this.parserClient.parseFile(buffer, filename, userApiKey);
    const inspection = parseResult.inspection || {};
    const summary = parseResult.summary || {};
    const telemetry = parseResult.telemetry || [];

    jobStatus.stage = 'ASSOCIATING';
    jobStatus.progressPct = 70;
    jobStatus.message = 'Correlating flight association and fleet assets...';

    // 4. Discover and register fleet hardware (Section 25 & 26)
    let drone = null;
    if (summary.aircraft_sn) {
      drone = await this.fleetService.findOrCreateDroneBySerial(summary.aircraft_sn, summary.aircraft_name || 'DJI Drone');
    }
    let battery = null;
    if (summary.battery_sn) {
      battery = await this.fleetService.findOrCreateBatteryBySerial(summary.battery_sn, 'Intelligent Flight Battery', drone?.id);
    }
    if (summary.rc_sn) {
      await this.fleetService.findOrCreateController(summary.rc_sn);
    }
    if (summary.camera_sn) {
      await this.fleetService.findOrCreateCamera(summary.camera_sn, drone?.id);
    }

    // 5. Flight Association Engine (Section 12)
    let matchedFlight: FlightSummary | null = null;
    let confidence = 1.0;
    let reason = 'Primary flight record log';

    const fileStartTime = summary.start_time ? new Date(summary.start_time).getTime() : null;

    for (const f of store.flights.values()) {
      // Rule A: Match by UUID
      if (inspection.uuid && f.uuid === inspection.uuid) {
        matchedFlight = f;
        confidence = 1.0;
        reason = `Direct match by flight UUID (${inspection.uuid})`;
        break;
      }
      // Rule B: Match by aircraft SN + timestamp window (±60 seconds)
      if (
        summary.aircraft_sn &&
        f.drone?.serialNumber === summary.aircraft_sn &&
        fileStartTime &&
        f.startedAt
      ) {
        const timeDiffSec = Math.abs((new Date(f.startedAt).getTime() - fileStartTime) / 1000);
        if (timeDiffSec <= 60) {
          matchedFlight = f;
          confidence = 0.95;
          reason = `Matched aircraft serial (${summary.aircraft_sn}) within ${Math.round(timeDiffSec)}s time window`;
          break;
        }
      }
    }

    // Determine File Category
    let category = FileCategory.UNKNOWN;
    if (filename.startsWith('DJIFlightRecord') && filename.endsWith('.txt')) {
      category = FileCategory.DJI_FLIGHT_RECORD;
    } else if (filename.endsWith('.DAT') || filename.endsWith('.dat')) {
      category = FileCategory.DJI_DAT;
    } else if (filename.includes('.txt_')) {
      category = FileCategory.COMPANION_METADATA;
    }

    let flightId = matchedFlight?.id;
    let flightNumber = matchedFlight?.flightNumber;

    if (!matchedFlight) {
      // Create new Flight
      flightId = uuidv4();
      const flightCount = store.flights.size + 1;
      flightNumber = `FLIGHT-${new Date().getFullYear()}-${String(flightCount).padStart(5, '0')}`;

      // 6. Evaluate Rule Engine & Flight Health Score (Section 23 & 24)
      const healthBreakdown = this.rulesService.evaluateHealthScore(telemetry);
      const { anomalies, events } = this.rulesService.detectAnomalies(flightId, telemetry);

      // Merge events from parser
      const allEvents = [...(parseResult.events || []), ...events];

      const newFlight: FlightSummary = {
        id: flightId,
        flightNumber,
        uuid: inspection.uuid || uuidv4(),
        droneId: drone?.id,
        drone: drone || undefined,
        batteryId: battery?.id,
        battery: battery || undefined,
        startedAt: summary.start_time || new Date().toISOString(),
        endedAt: summary.end_time || (summary.start_time ? new Date(new Date(summary.start_time).getTime() + (summary.duration_seconds || 0) * 1000).toISOString() : undefined),
        durationSeconds: summary.duration_seconds || 0,
        reportedDistanceMeters: summary.reported_distance_m || 0,
        calculatedDistanceMeters: summary.calculated_distance_m || summary.reported_distance_m || 0,
        maxAltitudeMeters: summary.max_altitude_m || 0,
        maxHorizontalSpeed: summary.max_horizontal_speed_ms || 0,
        maxVerticalSpeed: summary.max_vertical_speed_ms || 0,
        takeoffLocation: summary.takeoff_lat && summary.takeoff_lon ? { latitude: summary.takeoff_lat, longitude: summary.takeoff_lon, altitude: summary.takeoff_alt_m } : undefined,
        photoCount: summary.photo_count || 0,
        videoDurationSeconds: summary.video_time_sec || 0,
        healthScore: healthBreakdown.overallScore,
        healthBreakdown,
        processingStatus: (parseResult.status as ProcessingStatus) || ProcessingStatus.COMPLETED,
        processingNotes: parseResult.status_reason || 'Ingested successfully.',
        isDemo: false,
        fileCount: 1,
        warningCount: allEvents.filter((e) => e.severity === EventSeverity.WARNING || e.severity === EventSeverity.CRITICAL).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.flights.set(flightId, newFlight);

      // Save geometry & telemetry
      if (parseResult.track_geojson) {
        store.flightTracks.set(flightId, parseResult.track_geojson);
      }
      if (telemetry && telemetry.length > 0) {
        store.telemetryPoints.set(flightId, telemetry);
      }
      for (const evt of allEvents) {
        const evtId = evt.id || uuidv4();
        store.flightEvents.set(evtId, { ...evt, id: evtId, flightId });
      }

      // Update Drone statistics
      if (drone) {
        drone.totalFlightCount += 1;
        drone.totalFlightTimeSeconds += Math.round(newFlight.durationSeconds);
        drone.totalDistanceMeters += Math.round(newFlight.calculatedDistanceMeters || 0);
        drone.lastFlightAt = newFlight.startedAt;
      }
    } else {
      // Merge companion metadata into existing flight
      matchedFlight.fileCount = (matchedFlight.fileCount || 1) + 1;
      if (!matchedFlight.battery && battery) {
        matchedFlight.battery = battery;
        matchedFlight.batteryId = battery.id;
      }
      if (summary.aircraft_name && !matchedFlight.drone?.nickname) {
        matchedFlight.drone = drone || matchedFlight.drone;
      }
      this.logger.log(`Associated ${filename} to existing flight ${matchedFlight.flightNumber}`);
    }

    // 7. Save file record
    const fileRecord: FlightFileRecord = {
      id: uuidv4(),
      flightId,
      storageKey: uploadRes.storageKey,
      originalFilename: filename,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: uploadRes.sizeBytes,
      sha256: uploadRes.sha256,
      fileCategory: category,
      detectedFormat: parseResult.inspection?.file_type || 'DJI',
      detectedVersion: parseResult.inspection?.log_version,
      parserName: parseResult.parser_name,
      parserVersion: parseResult.parser_version,
      associationConfidence: confidence,
      associationReason: reason,
      createdAt: new Date().toISOString(),
    };
    store.flightFiles.set(fileRecord.id, fileRecord);

    jobStatus.stage = 'COMPLETED';
    jobStatus.progressPct = 100;
    jobStatus.flightId = flightId;
    jobStatus.flightNumber = flightNumber;
    jobStatus.message = `Processing complete. Associated with Flight ${flightNumber}.`;

    return {
      jobId,
      flightId,
      flightNumber,
      fileId: fileRecord.id,
      sha256,
      status: parseResult.status,
      statusReason: parseResult.status_reason,
      inspection,
    };
  }
}
