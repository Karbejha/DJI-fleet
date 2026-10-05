import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class GisService {
  private readonly logger = new Logger(GisService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Spatial query for flights intersecting a bounding box or polygon (Section 27)
   */
  async queryFlightsSpatial(params: {
    bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
    point?: [number, number]; // [lon, lat]
    radiusMeters?: number;
    polygonCoords?: Array<[number, number]>;
  }): Promise<any[]> {
    const store = this.db.getStore();
    const results: any[] = [];

    for (const [flightId, track] of store.flightTracks.entries()) {
      const flight = store.flights.get(flightId);
      if (!flight || !track || !track.geometry || !track.geometry.coordinates) continue;

      const coords: Array<[number, number, number]> = track.geometry.coordinates;
      let matched = false;

      // 1. Point + Radius check (Haversine distance)
      if (params.point && params.radiusMeters) {
        const [targetLon, targetLat] = params.point;
        for (const [cLon, cLat] of coords) {
          const dist = this.haversineDistance(targetLat, targetLon, cLat, cLon);
          if (dist <= params.radiusMeters) {
            matched = true;
            break;
          }
        }
      }

      // 2. Bounding box check
      if (params.bbox && !matched) {
        const [minLon, minLat, maxLon, maxLat] = params.bbox;
        for (const [cLon, cLat] of coords) {
          if (cLon >= minLon && cLon <= maxLon && cLat >= minLat && cLat <= maxLat) {
            matched = true;
            break;
          }
        }
      }

      // 3. Polygon containment check (Ray casting algorithm)
      if (params.polygonCoords && params.polygonCoords.length >= 3 && !matched) {
        for (const [cLon, cLat] of coords) {
          if (this.isPointInPolygon([cLon, cLat], params.polygonCoords)) {
            matched = true;
            break;
          }
        }
      }

      // If no spatial filter provided, return all
      if (!params.point && !params.bbox && !params.polygonCoords) {
        matched = true;
      }

      if (matched) {
        results.push({
          flightId: flight.id,
          flightNumber: flight.flightNumber,
          aircraft: flight.drone?.nickname || flight.drone?.model,
          startedAt: flight.startedAt,
          durationSec: flight.durationSeconds,
          distanceM: flight.calculatedDistanceMeters,
          track: track,
        });
      }
    }

    return results;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private isPointInPolygon(point: [number, number], vs: Array<[number, number]>): boolean {
    const x = point[0],
      y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0],
        yi = vs[i][1];
      const xj = vs[j][0],
        yj = vs[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
