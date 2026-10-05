import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FlightsService } from '../flights/flights.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flightsService: FlightsService
  ) {}

  async exportCsv(flightId: string): Promise<string> {
    const flight = await this.flightsService.getFlightById(flightId);
    const { samples } = await this.flightsService.getFlightTelemetry(flightId, 'all');

    const headers = [
      'timestamp_ms',
      'time_offset_sec',
      'latitude',
      'longitude',
      'relative_altitude_m',
      'horizontal_speed_ms',
      'vertical_speed_ms',
      'pitch_deg',
      'roll_deg',
      'yaw_deg',
      'satellites',
      'battery_percent',
      'battery_voltage_v',
      'battery_temperature_c',
      'rc_signal_pct',
      'flight_mode',
    ];

    const lines = [headers.join(',')];

    for (const s of samples) {
      lines.push(
        [
          s.timestampMs,
          s.timeOffsetSec ?? '',
          s.latitude ?? '',
          s.longitude ?? '',
          s.relativeAltitude ?? '',
          s.horizontalSpeed ?? '',
          s.verticalSpeed ?? '',
          s.pitch ?? '',
          s.roll ?? '',
          s.yaw ?? '',
          s.satellites ?? '',
          s.batteryPercent ?? '',
          s.batteryVoltage ?? '',
          s.batteryTemperature ?? '',
          s.rcSignal ?? '',
          `"${s.flightMode ?? 'GPS'}"`,
        ].join(',')
      );
    }

    return lines.join('\n');
  }

  async exportGeoJson(flightId: string): Promise<any> {
    const flight = await this.flightsService.getFlightById(flightId);
    const { samples } = await this.flightsService.getFlightTelemetry(flightId, 'all');
    const events = await this.flightsService.getFlightEvents(flightId);

    const coordinates = samples
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.longitude, s.latitude, s.relativeAltitude || 0]);

    const features: any[] = [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          flightNumber: flight.flightNumber,
          aircraft: flight.drone?.nickname || flight.drone?.model,
          durationSec: flight.durationSeconds,
          distanceM: flight.calculatedDistanceMeters || flight.reportedDistanceMeters,
          maxAltitudeM: flight.maxAltitudeMeters,
          startedAt: flight.startedAt,
        },
      },
    ];

    if (flight.takeoffLocation) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [flight.takeoffLocation.longitude, flight.takeoffLocation.latitude, flight.takeoffLocation.altitude || 0],
        },
        properties: {
          name: 'Takeoff Point',
          markerType: 'TAKEOFF',
        },
      });
    }

    if (flight.landingLocation) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [flight.landingLocation.longitude, flight.landingLocation.latitude, flight.landingLocation.altitude || 0],
        },
        properties: {
          name: 'Landing Point',
          markerType: 'LANDING',
        },
      });
    }

    for (const evt of events) {
      if (evt.latitude && evt.longitude) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [evt.longitude, evt.latitude, 0],
          },
          properties: {
            name: evt.title,
            category: evt.category,
            severity: evt.severity,
            timeOffsetSec: evt.timeOffsetSec,
          },
        });
      }
    }

    return {
      type: 'FeatureCollection',
      name: `${flight.flightNumber}_Track`,
      features,
    };
  }

  async exportKml(flightId: string): Promise<string> {
    const flight = await this.flightsService.getFlightById(flightId);
    const { samples } = await this.flightsService.getFlightTelemetry(flightId, 'all');

    const coordsString = samples
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => `${s.longitude},${s.latitude},${s.relativeAltitude || 0}`)
      .join(' ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${flight.flightNumber} - DJI Flight Trajectory</name>
    <description>
      Aircraft: ${flight.drone?.nickname || flight.drone?.model || 'DJI Drone'}
      Duration: ${Math.round(flight.durationSeconds)}s
      Distance: ${Math.round(flight.calculatedDistanceMeters || 0)}m
      Max Altitude: ${flight.maxAltitudeMeters}m
    </description>
    <Style id="flightTrackStyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${flight.flightNumber} Flight Path</name>
      <styleUrl>#flightTrackStyle</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>
          ${coordsString}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
  }

  async getReportData(flightId: string): Promise<any> {
    const flight = await this.flightsService.getFlightById(flightId);
    const events = await this.flightsService.getFlightEvents(flightId);
    const store = this.db.getStore();
    const files = Array.from(store.flightFiles.values()).filter((f) => f.flightId === flightId);

    return {
      organization: 'Drone Operations Fleet Unit',
      flight,
      events,
      sourceFiles: files,
      generatedAt: new Date().toISOString(),
    };
  }
}
