import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RulesService } from '../rules/rules.service';
import {
  DroneAsset,
  BatteryAsset,
  PilotAsset,
  FlightSummary,
  TelemetrySample,
  AssetStatus,
  ProcessingStatus,
  EventSeverity,
  EventCategory,
} from '@dji-fleet/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DemoService implements OnModuleInit {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly rulesService: RulesService
  ) {}

  async onModuleInit() {
    await this.seedDemoData();
  }

  async seedDemoData() {
    const store = this.db.getStore();
    if (store.flights.size > 0) return; // don't re-seed if already populated

    this.logger.log('Initializing realistic demonstration data (3 drones, 5 batteries, 4 pilots, 20 flights)...');

    // 1. Drones (Section 45)
    const drones: DroneAsset[] = [
      {
        id: 'drone-m4p-01',
        manufacturer: 'DJI',
        model: 'DJI Mini 4 Pro',
        nickname: 'Recon-Alpha (Mini 4 Pro)',
        serialNumber: '1581F6Z9C2516003',
        status: AssetStatus.ACTIVE,
        totalFlightTimeSeconds: 43200,
        totalDistanceMeters: 148500,
        totalFlightCount: 28,
        createdAt: '2025-08-01T08:00:00Z',
        updatedAt: '2026-01-10T12:00:00Z',
      },
      {
        id: 'drone-m3e-02',
        manufacturer: 'DJI',
        model: 'DJI Mavic 3 Enterprise',
        nickname: 'Surveyor-02 (M3E)',
        serialNumber: '1581F5G8B2411009',
        status: AssetStatus.ACTIVE,
        totalFlightTimeSeconds: 98400,
        totalDistanceMeters: 312000,
        totalFlightCount: 54,
        createdAt: '2025-05-15T08:00:00Z',
        updatedAt: '2026-01-12T15:30:00Z',
      },
      {
        id: 'drone-m350-03',
        manufacturer: 'DJI',
        model: 'DJI Matrice 350 RTK',
        nickname: 'HeavyLifter-03 (M350)',
        serialNumber: '1581F9K1M2504018',
        status: AssetStatus.MAINTENANCE,
        totalFlightTimeSeconds: 162000,
        totalDistanceMeters: 450000,
        totalFlightCount: 65,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2026-01-08T10:00:00Z',
      },
    ];

    for (const d of drones) {
      store.drones.set(d.id, d);
    }

    // 2. Batteries (Section 45)
    const batteries: BatteryAsset[] = [
      {
        id: 'bat-5lr-01',
        serialNumber: '5LRXMCDDG302XC',
        model: 'BWX140-2590-7.32 (Mini 4 Pro)',
        droneId: 'drone-m4p-01',
        droneNickname: 'Recon-Alpha (Mini 4 Pro)',
        firstSeenAt: '2025-09-01T10:00:00Z',
        lastSeenAt: '2026-01-07T12:00:00Z',
        cycleCount: 22,
        nominalCapacityMah: 2590,
        latestHealthPct: 98.5,
        minRecordedVoltage: 11.2,
        maxRecordedTemperature: 39.8,
        cellDeviation: 0.012,
        status: AssetStatus.ACTIVE,
        flightCount: 22,
        totalFlightTimeSeconds: 31200,
        createdAt: '2025-09-01T10:00:00Z',
        updatedAt: '2026-01-07T12:00:00Z',
      },
      {
        id: 'bat-5lr-02',
        serialNumber: '5LRPMCGCA408GT',
        model: 'BWX140-2590-7.32 (Mini 4 Pro)',
        droneId: 'drone-m4p-01',
        droneNickname: 'Recon-Alpha (Mini 4 Pro)',
        firstSeenAt: '2025-09-01T10:00:00Z',
        lastSeenAt: '2026-01-06T14:00:00Z',
        cycleCount: 35,
        nominalCapacityMah: 2590,
        latestHealthPct: 96.0,
        minRecordedVoltage: 11.1,
        maxRecordedTemperature: 42.1,
        cellDeviation: 0.018,
        status: AssetStatus.ACTIVE,
        flightCount: 35,
        totalFlightTimeSeconds: 48900,
        createdAt: '2025-09-01T10:00:00Z',
        updatedAt: '2026-01-06T14:00:00Z',
      },
      {
        id: 'bat-m3e-03',
        serialNumber: '5LRB03CELLIMBAL',
        model: 'BWX260-5000-15.4 (M3E)',
        droneId: 'drone-m3e-02',
        droneNickname: 'Surveyor-02 (M3E)',
        firstSeenAt: '2025-06-01T10:00:00Z',
        lastSeenAt: '2026-01-05T16:00:00Z',
        cycleCount: 74,
        nominalCapacityMah: 5000,
        latestHealthPct: 89.2, // Degradation trend! (Section 26)
        minRecordedVoltage: 14.2,
        maxRecordedTemperature: 48.6,
        cellDeviation: 0.046, // Higher deviation
        status: AssetStatus.ACTIVE,
        flightCount: 74,
        totalFlightTimeSeconds: 84600,
        createdAt: '2025-06-01T10:00:00Z',
        updatedAt: '2026-01-05T16:00:00Z',
      },
      {
        id: 'bat-m3e-04',
        serialNumber: '5LRB04HEALTHYPK',
        model: 'BWX260-5000-15.4 (M3E)',
        droneId: 'drone-m3e-02',
        droneNickname: 'Surveyor-02 (M3E)',
        firstSeenAt: '2025-07-10T10:00:00Z',
        lastSeenAt: '2026-01-04T11:00:00Z',
        cycleCount: 19,
        nominalCapacityMah: 5000,
        latestHealthPct: 99.1,
        minRecordedVoltage: 14.8,
        maxRecordedTemperature: 36.4,
        cellDeviation: 0.009,
        status: AssetStatus.ACTIVE,
        flightCount: 19,
        totalFlightTimeSeconds: 24500,
        createdAt: '2025-07-10T10:00:00Z',
        updatedAt: '2026-01-04T11:00:00Z',
      },
      {
        id: 'bat-tb65-05',
        serialNumber: '6TB65HIGHV58801',
        model: 'TB65 Intelligent Battery (M350)',
        droneId: 'drone-m350-03',
        droneNickname: 'HeavyLifter-03 (M350)',
        firstSeenAt: '2025-02-01T08:00:00Z',
        lastSeenAt: '2025-12-28T13:00:00Z',
        cycleCount: 88,
        nominalCapacityMah: 5880,
        latestHealthPct: 86.4,
        minRecordedVoltage: 42.0,
        maxRecordedTemperature: 51.5,
        cellDeviation: 0.038,
        status: AssetStatus.MAINTENANCE,
        flightCount: 88,
        totalFlightTimeSeconds: 122000,
        createdAt: '2025-02-01T08:00:00Z',
        updatedAt: '2025-12-28T13:00:00Z',
      },
    ];

    for (const b of batteries) {
      store.batteries.set(b.id, b);
    }

    // 3. Pilots (Section 45)
    const pilots: PilotAsset[] = [
      {
        id: 'pilot-tariq',
        fullName: 'Capt. Tariq Al-Mansoor',
        licenseNumber: 'UAS-COMM-77401',
        phone: '+971-50-1234567',
        departmentName: 'Inspection & Surveillance',
        totalFlightTimeSeconds: 182000,
        totalFlights: 94,
        createdAt: '2025-01-01T08:00:00Z',
      },
      {
        id: 'pilot-layla',
        fullName: 'Eng. Layla Qassim',
        licenseNumber: 'UAS-COMM-89214',
        phone: '+971-55-9876543',
        departmentName: 'GIS & Photogrammetry',
        totalFlightTimeSeconds: 124000,
        totalFlights: 68,
        createdAt: '2025-03-15T08:00:00Z',
      },
      {
        id: 'pilot-omar',
        fullName: 'Lt. Omar Al-Hashimi',
        licenseNumber: 'UAS-TACT-44120',
        phone: '+971-52-3344556',
        departmentName: 'Emergency Response',
        totalFlightTimeSeconds: 156000,
        totalFlights: 81,
        createdAt: '2025-02-10T08:00:00Z',
      },
      {
        id: 'pilot-chen',
        fullName: 'Alex Chen',
        licenseNumber: 'UAS-COMM-55291',
        phone: '+971-56-7788990',
        departmentName: 'Infrastructure Audit',
        totalFlightTimeSeconds: 98000,
        totalFlights: 45,
        createdAt: '2025-06-01T08:00:00Z',
      },
    ];

    for (const p of pilots) {
      store.pilots.set(p.id, p);
    }

    // 4. Generate 20 Realistic Demonstration Flights (Section 45)
    // Centered around coordinates: lat 36.004, lon 36.736 (real FlightRecord location)
    const baseLat = 36.00415;
    const baseLon = 36.73681;

    for (let i = 1; i <= 20; i++) {
      const flightId = `demo-flight-${String(i).padStart(3, '0')}`;
      const flightNumber = `FLIGHT-2026-${String(100 + i).padStart(5, '0')}`;
      const droneIdx = i % 3;
      const drone = drones[droneIdx];
      const batteryIdx = i % 5;
      const battery = batteries[batteryIdx];
      const pilotIdx = i % 4;
      const pilot = pilots[pilotIdx];

      const durationSec = 600 + (i * 73) % 900; // 10 to 25 mins
      const distanceM = 1500 + (i * 320) % 5500;
      const maxAlt = 80 + (i * 24) % 320;
      const maxSpd = 9.5 + (i * 1.2) % 8.0;

      // Flight date spanning last 3 months
      const date = new Date(Date.now() - (20 - i) * 36 * 3600 * 1000);
      const dateStr = date.toISOString();

      // Generate realistic trajectory (circular/survey pattern)
      const telemetry: TelemetrySample[] = [];
      const trackCoords: Array<[number, number, number]> = [];
      const numPoints = 120; // 120 points for smooth charting and replay

      const startLat = baseLat + ((i * 13) % 50) * 0.0004;
      const startLon = baseLon + ((i * 17) % 50) * 0.0004;

      for (let p = 0; p < numPoints; p++) {
        const progress = p / (numPoints - 1);
        const angle = progress * Math.PI * 4; // 2 loops
        const radius = 0.002 + 0.001 * Math.sin(progress * Math.PI);
        const lat = startLat + radius * Math.sin(angle);
        const lon = startLon + radius * Math.cos(angle);

        // Realistic altitude profile: climb, cruise, descent
        let alt = 0;
        if (progress < 0.15) {
          alt = (progress / 0.15) * maxAlt;
        } else if (progress > 0.85) {
          alt = ((1 - progress) / 0.15) * maxAlt;
        } else {
          alt = maxAlt - 10 + 5 * Math.sin(progress * 10);
        }

        const hSpd = progress < 0.1 || progress > 0.9 ? 2.5 : maxSpd * (0.8 + 0.2 * Math.sin(progress * 8));
        const vSpd = progress < 0.15 ? 3.0 : progress > 0.85 ? -2.8 : 0.2 * Math.cos(progress * 15);
        const batPct = 100 - progress * 65; // drains from 100% to 35%
        const batVolt = 12.6 - progress * 1.5;
        const batTemp = 28 + progress * 14;
        const sats = 18 + Math.floor(4 * Math.sin(progress * 5));
        const rcSig = 95 - (progress > 0.5 && progress < 0.7 ? 65 : 15); // simulate RC drop in middle for warning!

        const sample: TelemetrySample = {
          timestampMs: Math.round(progress * durationSec * 1000),
          timeOffsetSec: Number((progress * durationSec).toFixed(1)),
          latitude: lat,
          longitude: lon,
          relativeAltitude: Number(alt.toFixed(1)),
          horizontalSpeed: Number(hSpd.toFixed(1)),
          verticalSpeed: Number(vSpd.toFixed(1)),
          pitch: Number((5 * Math.sin(angle)).toFixed(1)),
          roll: Number((8 * Math.cos(angle)).toFixed(1)),
          yaw: Number(((angle * 180) / Math.PI) % 360).toFixed(1) as any,
          heading: Number(((angle * 180) / Math.PI) % 360).toFixed(1) as any,
          satellites: sats,
          batteryPercent: Number(batPct.toFixed(1)),
          batteryVoltage: Number(batVolt.toFixed(2)),
          batteryTemperature: Number(batTemp.toFixed(1)),
          rcSignal: Math.max(10, Number(rcSig.toFixed(1))),
          flightMode: 'P-GPS',
        };

        telemetry.push(sample);
        trackCoords.push([lon, lat, Number(alt.toFixed(1))]);
      }

      // Evaluate Health Score & Anomalies
      const healthBreakdown = this.rulesService.evaluateHealthScore(telemetry);
      const { anomalies, events } = this.rulesService.detectAnomalies(flightId, telemetry);

      // Add baseline events
      events.unshift({
        id: `evt-start-${i}`,
        flightId,
        timestampMs: 0,
        timeOffsetSec: 0,
        category: EventCategory.SYSTEM,
        severity: EventSeverity.INFO,
        title: 'Motors Started',
        description: `Aircraft systems initialized at Home Point (${startLat.toFixed(5)}, ${startLon.toFixed(5)})`,
        latitude: startLat,
        longitude: startLon,
      });

      events.push({
        id: `evt-land-${i}`,
        flightId,
        timestampMs: durationSec * 1000,
        timeOffsetSec: durationSec,
        category: EventCategory.PILOT,
        severity: EventSeverity.INFO,
        title: 'Safe Landing Completed',
        description: 'Aircraft landed safely on touchdown pad.',
        latitude: startLat,
        longitude: startLon,
      });

      const flight: FlightSummary = {
        id: flightId,
        flightNumber,
        uuid: uuidv4(),
        droneId: drone.id,
        drone,
        batteryId: battery.id,
        battery,
        pilotId: pilot.id,
        pilot,
        startedAt: dateStr,
        endedAt: new Date(date.getTime() + durationSec * 1000).toISOString(),
        durationSeconds: durationSec,
        reportedDistanceMeters: distanceM,
        calculatedDistanceMeters: distanceM,
        maxAltitudeMeters: maxAlt,
        maxHorizontalSpeed: maxSpd,
        maxVerticalSpeed: 3.5,
        takeoffLocation: { latitude: startLat, longitude: startLon, altitude: 0 },
        landingLocation: { latitude: startLat, longitude: startLon, altitude: 0 },
        homeLocation: { latitude: startLat, longitude: startLon, altitude: 0 },
        photoCount: 14 + (i * 3) % 20,
        videoDurationSeconds: 120 + (i * 45) % 300,
        healthScore: healthBreakdown.overallScore,
        healthBreakdown,
        processingStatus: ProcessingStatus.COMPLETED,
        processingNotes: 'Fully decoded demonstration telemetry record.',
        isDemo: true, // Clearly identified as demonstration data (Rule 45)
        fileCount: 1,
        warningCount: events.filter((e) => e.severity === EventSeverity.WARNING).length,
        createdAt: dateStr,
        updatedAt: dateStr,
      };

      store.flights.set(flightId, flight);
      store.flightTracks.set(flightId, {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: trackCoords,
        },
        properties: {
          flightNumber,
          aircraft: drone.nickname,
        },
      });
      store.telemetryPoints.set(flightId, telemetry);

      for (const evt of events) {
        store.flightEvents.set(evt.id, evt);
      }
    }

    this.logger.log('Demonstration dataset successfully seeded (20 flights with full telemetry and tracks).');
  }
}
