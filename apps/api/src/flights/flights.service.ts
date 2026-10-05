import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  FlightSummary,
  TelemetrySample,
  FlightEvent,
  ProcessingStatus,
} from '@dji-fleet/shared';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getFlights(params: {
    page?: number;
    limit?: number;
    q?: string;
    droneId?: string;
    pilotId?: string;
    batteryId?: string;
    status?: ProcessingStatus;
  }): Promise<{ items: FlightSummary[]; total: number; page: number; limit: number }> {
    const store = this.db.getStore();
    let all = Array.from(store.flights.values());

    // Search query
    if (params.q) {
      const q = params.q.toLowerCase();
      all = all.filter(
        (f) =>
          f.flightNumber.toLowerCase().includes(q) ||
          (f.drone?.nickname && f.drone.nickname.toLowerCase().includes(q)) ||
          (f.drone?.serialNumber && f.drone.serialNumber.toLowerCase().includes(q)) ||
          (f.pilot?.fullName && f.pilot.fullName.toLowerCase().includes(q))
      );
    }

    if (params.droneId) {
      all = all.filter((f) => f.droneId === params.droneId);
    }
    if (params.pilotId) {
      all = all.filter((f) => f.pilotId === params.pilotId);
    }
    if (params.batteryId) {
      all = all.filter((f) => f.batteryId === params.batteryId);
    }
    if (params.status) {
      all = all.filter((f) => f.processingStatus === params.status);
    }

    // Sort descending by start time
    all.sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime());

    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return {
      items,
      total: all.length,
      page,
      limit,
    };
  }

  async getFlightById(id: string): Promise<FlightSummary> {
    const store = this.db.getStore();
    const flight = store.flights.get(id);
    if (!flight) {
      throw new NotFoundException(`Flight #${id} not found`);
    }
    return flight;
  }

  async deleteFlight(id: string): Promise<{ success: boolean; message: string }> {
    const store = this.db.getStore();
    const flight = store.flights.get(id);
    if (!flight) {
      throw new NotFoundException(`Flight #${id} not found`);
    }

    store.flights.delete(id);
    store.flightTracks.delete(id);
    store.telemetryPoints.delete(id);
    this.logger.log(`Deleted flight #${id} (${flight.flightNumber})`);

    return {
      success: true,
      message: `Flight ${flight.flightNumber} and associated geometry removed successfully. Raw source logs remain preserved.`,
    };
  }

  async getFlightTrack(id: string): Promise<any> {
    const store = this.db.getStore();
    const flight = await this.getFlightById(id);
    const track = store.flightTracks.get(id);

    return {
      flightId: id,
      flightNumber: flight.flightNumber,
      takeoffLocation: flight.takeoffLocation,
      landingLocation: flight.landingLocation,
      homeLocation: flight.homeLocation,
      geoJson: track || null,
    };
  }

  async getFlightTelemetry(
    id: string,
    resolution: string = 'all',
    fields?: string
  ): Promise<{ samples: TelemetrySample[]; totalCount: number; returnedCount: number }> {
    const store = this.db.getStore();
    await this.getFlightById(id); // ensure exists
    const all = store.telemetryPoints.get(id) || [];

    if (all.length === 0) {
      return { samples: [], totalCount: 0, returnedCount: 0 };
    }

    // Downsampling logic based on resolution
    let step = 1;
    if (resolution === '1000ms') {
      step = 10; // assuming 10Hz sampling
    } else if (resolution === '500ms') {
      step = 5;
    } else if (resolution === '2000ms') {
      step = 20;
    } else if (all.length > 5000 && resolution === 'all') {
      // Auto-downsample huge flights if resolution is not specified to protect client performance
      step = Math.ceil(all.length / 2500);
    }

    const filtered: TelemetrySample[] = [];
    for (let i = 0; i < all.length; i += step) {
      filtered.push(all[i]);
    }
    // Always include the final landing sample
    if (filtered[filtered.length - 1] !== all[all.length - 1]) {
      filtered.push(all[all.length - 1]);
    }

    return {
      samples: filtered,
      totalCount: all.length,
      returnedCount: filtered.length,
    };
  }

  async getFlightEvents(id: string): Promise<FlightEvent[]> {
    const store = this.db.getStore();
    await this.getFlightById(id);
    const events: FlightEvent[] = [];
    for (const evt of store.flightEvents.values()) {
      if (evt.flightId === id) {
        events.push(evt);
      }
    }
    events.sort((a, b) => a.timestampMs - b.timestampMs);
    return events;
  }
}
