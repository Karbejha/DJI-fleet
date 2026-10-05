import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  DashboardStats,
  EventCategory,
  EventSeverity,
} from '@dji-fleet/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDashboardData(): Promise<DashboardStats> {
    const store = this.db.getStore();
    const allFlights = Array.from(store.flights.values());
    const allDrones = Array.from(store.drones.values());
    const allBatteries = Array.from(store.batteries.values());
    const allEvents = Array.from(store.flightEvents.values());

    let totalFlightTimeSec = 0;
    let totalDistanceM = 0;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    let flightsThisMonth = 0;

    for (const f of allFlights) {
      totalFlightTimeSec += f.durationSeconds || 0;
      totalDistanceM += f.calculatedDistanceMeters || f.reportedDistanceMeters || 0;
      if (f.startedAt && f.startedAt.startsWith(currentMonth)) {
        flightsThisMonth += 1;
      }
    }

    const totalWarnings = allEvents.filter((e) => e.severity === EventSeverity.WARNING).length;
    const totalIncidents = allEvents.filter((e) => e.severity === EventSeverity.CRITICAL).length;

    // Monthly breakdown stats
    const monthMap: Record<string, { count: number; duration: number; distance: number }> = {};
    for (const f of allFlights) {
      const m = f.startedAt ? f.startedAt.slice(0, 7) : currentMonth;
      if (!monthMap[m]) monthMap[m] = { count: 0, duration: 0, distance: 0 };
      monthMap[m].count += 1;
      monthMap[m].duration += f.durationSeconds || 0;
      monthMap[m].distance += f.calculatedDistanceMeters || 0;
    }

    const monthlyStats = Object.keys(monthMap)
      .sort()
      .map((month) => ({
        month,
        flightCount: monthMap[month].count,
        flightHours: Number((monthMap[month].duration / 3600).toFixed(1)),
        distanceKm: Number((monthMap[month].distance / 1000).toFixed(1)),
      }));

    // Flights by drone
    const droneMap: Record<string, { model: string; nickname?: string; count: number }> = {};
    for (const f of allFlights) {
      const droneKey = f.droneId || 'unknown';
      if (!droneMap[droneKey]) {
        droneMap[droneKey] = {
          model: f.drone?.model || 'DJI Drone',
          nickname: f.drone?.nickname,
          count: 0,
        };
      }
      droneMap[droneKey].count += 1;
    }
    const flightsByDrone = Object.entries(droneMap).map(([droneId, val]) => ({
      droneId,
      model: val.model,
      nickname: val.nickname,
      count: val.count,
    }));

    // Flights by pilot
    const pilotMap: Record<string, { name: string; count: number }> = {};
    for (const f of allFlights) {
      const pilotKey = f.pilotId || 'unassigned';
      if (!pilotMap[pilotKey]) {
        pilotMap[pilotKey] = {
          name: f.pilot?.fullName || 'Chief Pilot',
          count: 0,
        };
      }
      pilotMap[pilotKey].count += 1;
    }
    const flightsByPilot = Object.entries(pilotMap).map(([pilotId, val]) => ({
      pilotId,
      name: val.name,
      count: val.count,
    }));

    // Warnings by category
    const catMap: Partial<Record<EventCategory, number>> = {};
    for (const e of allEvents) {
      catMap[e.category] = (catMap[e.category] || 0) + 1;
    }
    const warningsByCategory = Object.entries(catMap).map(([category, count]) => ({
      category: category as EventCategory,
      count: count as number,
    }));

    // Fleet alerts (Section 16)
    const fleetAlerts = [
      {
        id: 'alert-1',
        type: 'BATTERY_HEALTH',
        title: 'Battery B-003 Cell Deviation',
        description: 'Cell imbalance increasing on pack B-003 (deviation > 0.045V). Cycle count: 68.',
        severity: EventSeverity.WARNING,
        entityType: 'BATTERY' as const,
        entityId: 'B-003',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'alert-2',
        type: 'DRONE_INSPECTION',
        title: 'Drone DJI-M4P-01 50-Hour Inspection Due',
        description: 'Total flight time exceeded 50 operating hours. Motor bearing check recommended.',
        severity: EventSeverity.INFO,
        entityType: 'DRONE' as const,
        entityId: 'DJI-M4P-01',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'alert-3',
        type: 'FLIGHT_ANOMALY',
        title: 'RC Signal Degraded in High-Density Sector',
        description: 'Repeated signal attenuation below 20% in industrial inspection sector.',
        severity: EventSeverity.WARNING,
        entityType: 'FLIGHT' as const,
        entityId: allFlights[0]?.id || 'fl-1',
        timestamp: new Date().toISOString(),
      },
    ];

    // Recent flights (top 6)
    const recent = [...allFlights]
      .sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime())
      .slice(0, 8);

    return {
      totalFlights: allFlights.length,
      totalFlightTimeHours: Number((totalFlightTimeSec / 3600).toFixed(1)),
      totalDistanceKm: Number((totalDistanceM / 1000).toFixed(1)),
      activeDrones: allDrones.length,
      activeBatteries: allBatteries.length,
      totalWarnings,
      totalIncidents,
      flightsThisMonth,
      monthlyStats,
      flightsByDrone,
      flightsByPilot,
      warningsByCategory,
      fleetAlerts,
      recentFlights: recent,
    };
  }
}
