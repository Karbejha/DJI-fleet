import { Injectable, Logger } from '@nestjs/common';
import {
  TelemetrySample,
  HealthScoreBreakdown,
  HealthDeduction,
  FlightAnomaly,
  EventSeverity,
  EventCategory,
  FlightEvent,
} from '@dji-fleet/shared';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  // Configurable thresholds
  private readonly thresholds = {
    minSatellites: 10,
    criticalSatellites: 6,
    lowBatteryPct: 20,
    criticalBatteryPct: 10,
    maxBatteryTempC: 50.0,
    criticalBatteryTempC: 60.0,
    minRcSignalPct: 25,
    criticalRcSignalPct: 15,
    maxVerticalSinkRate: -4.5, // m/s
    rapidVoltageDropVolts: 0.6,
  };

  /**
   * Transparent rule-based health score evaluation (0-100)
   */
  evaluateHealthScore(telemetry: TelemetrySample[]): HealthScoreBreakdown {
    if (!telemetry || telemetry.length < 5) {
      return {
        overallScore: 100,
        gpsScore: null,
        batteryScore: null,
        rcScore: null,
        navigationScore: null,
        stabilityScore: null,
        propulsionScore: null,
        deductions: [],
        isSufficientTelemetry: false,
      };
    }

    const deductions: HealthDeduction[] = [];
    let gpsScore = 100;
    let batteryScore = 100;
    let rcScore = 100;
    let navigationScore = 100;
    let stabilityScore = 100;
    let propulsionScore = 100;

    let hasGpsData = false;
    let hasBatteryData = false;
    let hasRcData = false;

    // Check GPS
    const lowSatPoints = telemetry.filter((s) => {
      if (s.satellites != null) {
        hasGpsData = true;
        return s.satellites < this.thresholds.minSatellites;
      }
      return false;
    });

    if (hasGpsData && lowSatPoints.length > 0) {
      const penalty = Math.min(30, Math.ceil(lowSatPoints.length * 0.5));
      gpsScore = Math.max(0, gpsScore - penalty);
      deductions.push({
        category: 'GPS',
        points: penalty,
        reason: `GPS satellite count dropped below ${this.thresholds.minSatellites} satellites across ${lowSatPoints.length} samples.`,
      });
    }

    // Check Battery
    const highTempPoints = telemetry.filter((s) => {
      if (s.batteryTemperature != null) {
        hasBatteryData = true;
        return s.batteryTemperature > this.thresholds.maxBatteryTempC;
      }
      return false;
    });

    if (highTempPoints.length > 0) {
      const penalty = 15;
      batteryScore = Math.max(0, batteryScore - penalty);
      deductions.push({
        category: 'Battery',
        points: penalty,
        reason: `High battery temperature detected exceeding ${this.thresholds.maxBatteryTempC}°C.`,
      });
    }

    const criticalBatPoints = telemetry.filter((s) => {
      if (s.batteryPercent != null) {
        hasBatteryData = true;
        return s.batteryPercent < this.thresholds.lowBatteryPct;
      }
      return false;
    });

    if (criticalBatPoints.length > 0) {
      const penalty = 10;
      batteryScore = Math.max(0, batteryScore - penalty);
      deductions.push({
        category: 'Battery',
        points: penalty,
        reason: `Battery level reached critical reserve (<${this.thresholds.lowBatteryPct}%).`,
      });
    }

    // Check RC Signal
    const lowRcPoints = telemetry.filter((s) => {
      if (s.rcSignal != null) {
        hasRcData = true;
        return s.rcSignal < this.thresholds.minRcSignalPct;
      }
      return false;
    });

    if (hasRcData && lowRcPoints.length > 0) {
      const penalty = Math.min(35, Math.ceil(lowRcPoints.length * 0.8));
      rcScore = Math.max(0, rcScore - penalty);
      deductions.push({
        category: 'RC Signal',
        points: penalty,
        reason: `Radio control signal fell below ${this.thresholds.minRcSignalPct}% threshold for ${Math.round(lowRcPoints.length * 0.1)} seconds.`,
      });
    }

    // Check Sink Rate / Stability
    const rapidSinkPoints = telemetry.filter((s) => s.verticalSpeed != null && s.verticalSpeed < this.thresholds.maxVerticalSinkRate);
    if (rapidSinkPoints.length > 0) {
      const penalty = 12;
      stabilityScore = Math.max(0, stabilityScore - penalty);
      deductions.push({
        category: 'Flight Stability',
        points: penalty,
        reason: `High vertical sink rate recorded (${this.thresholds.maxVerticalSinkRate} m/s).`,
      });
    }

    // Compute Overall Health (weighted average of valid metrics)
    const validScores: number[] = [];
    if (hasGpsData) validScores.push(gpsScore);
    if (hasBatteryData) validScores.push(batteryScore);
    if (hasRcData) validScores.push(rcScore);
    validScores.push(stabilityScore);

    const overallScore = Math.round(
      validScores.reduce((a, b) => a + b, 0) / (validScores.length || 1)
    );

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      gpsScore: hasGpsData ? gpsScore : null,
      batteryScore: hasBatteryData ? batteryScore : null,
      rcScore: hasRcData ? rcScore : null,
      navigationScore,
      stabilityScore,
      propulsionScore,
      deductions,
      isSufficientTelemetry: true,
    };
  }

  /**
   * Evaluates anomalous incidents and generates chronological flight events
   */
  detectAnomalies(flightId: string, telemetry: TelemetrySample[]): { anomalies: FlightAnomaly[]; events: FlightEvent[] } {
    const anomalies: FlightAnomaly[] = [];
    const events: FlightEvent[] = [];

    if (!telemetry || telemetry.length === 0) {
      return { anomalies, events };
    }

    // Detect weak RC signal windows
    let rcWindowStart: number | null = null;
    let minRcVal = 100;

    for (let i = 0; i < telemetry.length; i++) {
      const s = telemetry[i];
      if (s.rcSignal != null && s.rcSignal < this.thresholds.minRcSignalPct) {
        if (rcWindowStart == null) {
          rcWindowStart = s.timestampMs;
          minRcVal = s.rcSignal;
        } else {
          minRcVal = Math.min(minRcVal, s.rcSignal);
        }
      } else if (rcWindowStart != null) {
        const durationSec = Math.round((s.timestampMs - rcWindowStart) / 1000);
        if (durationSec >= 3) {
          anomalies.push({
            type: 'RC_SIGNAL_LOW',
            severity: EventSeverity.WARNING,
            startMs: rcWindowStart,
            endMs: s.timestampMs,
            value: minRcVal,
            threshold: this.thresholds.minRcSignalPct,
            message: `RC signal remained below ${this.thresholds.minRcSignalPct}% for ${durationSec} seconds.`,
          });
          events.push({
            id: `evt-${s.timestampMs}`,
            flightId,
            timestampMs: rcWindowStart,
            timeOffsetSec: s.timeOffsetSec || 0,
            category: EventCategory.RC,
            severity: EventSeverity.WARNING,
            title: 'RC Signal Degraded',
            description: `Signal dropped to ${minRcVal}% (Threshold: ${this.thresholds.minRcSignalPct}%)`,
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }
        rcWindowStart = null;
      }
    }

    // Detect GPS satellite degradation
    let gpsWindowStart: number | null = null;
    for (let i = 0; i < telemetry.length; i++) {
      const s = telemetry[i];
      if (s.satellites != null && s.satellites < this.thresholds.minSatellites) {
        if (gpsWindowStart == null) {
          gpsWindowStart = s.timestampMs;
        }
      } else if (gpsWindowStart != null) {
        const durationSec = Math.round((s.timestampMs - gpsWindowStart) / 1000);
        if (durationSec >= 3) {
          events.push({
            id: `evt-gps-${s.timestampMs}`,
            flightId,
            timestampMs: gpsWindowStart,
            timeOffsetSec: s.timeOffsetSec || 0,
            category: EventCategory.GPS,
            severity: EventSeverity.WARNING,
            title: 'GPS Signal Quality Degraded',
            description: `Satellite count dropped below ${this.thresholds.minSatellites} for ${durationSec}s`,
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }
        gpsWindowStart = null;
      }
    }

    return { anomalies, events };
  }
}
