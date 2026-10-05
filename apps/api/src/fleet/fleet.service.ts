import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DroneAsset, BatteryAsset, ControllerAsset, CameraAsset, PilotAsset, MissionAsset, AssetStatus } from '@dji-fleet/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(private readonly db: DatabaseService) {}

  // ----------------- DRONES -----------------
  async getAllDrones(): Promise<DroneAsset[]> {
    const store = this.db.getStore();
    return Array.from(store.drones.values());
  }

  async getDroneById(id: string): Promise<DroneAsset | null> {
    const store = this.db.getStore();
    return store.drones.get(id) || null;
  }

  async findOrCreateDroneBySerial(serialNumber: string, model: string): Promise<DroneAsset> {
    const store = this.db.getStore();
    for (const d of store.drones.values()) {
      if (d.serialNumber === serialNumber) {
        return d;
      }
    }

    const newDrone: DroneAsset = {
      id: uuidv4(),
      manufacturer: 'DJI',
      model: model || 'DJI Drone',
      nickname: `${model || 'DJI'} (${serialNumber.slice(-4)})`,
      serialNumber,
      status: AssetStatus.ACTIVE,
      totalFlightTimeSeconds: 0,
      totalDistanceMeters: 0,
      totalFlightCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.drones.set(newDrone.id, newDrone);
    this.logger.log(`Auto-created fleet drone from discovered serial: ${serialNumber}`);
    return newDrone;
  }

  // ----------------- BATTERIES -----------------
  async getAllBatteries(): Promise<BatteryAsset[]> {
    const store = this.db.getStore();
    return Array.from(store.batteries.values());
  }

  async getBatteryById(id: string): Promise<BatteryAsset | null> {
    const store = this.db.getStore();
    return store.batteries.get(id) || null;
  }

  async findOrCreateBatteryBySerial(serialNumber: string, model?: string, droneId?: string): Promise<BatteryAsset> {
    const store = this.db.getStore();
    for (const b of store.batteries.values()) {
      if (b.serialNumber === serialNumber) {
        return b;
      }
    }

    const newBattery: BatteryAsset = {
      id: uuidv4(),
      serialNumber,
      model: model || 'DJI Intelligent Flight Battery',
      droneId,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      cycleCount: 1,
      latestHealthPct: 98.0,
      minRecordedVoltage: 11.4,
      maxRecordedTemperature: 38.5,
      cellDeviation: 0.015,
      status: AssetStatus.ACTIVE,
      flightCount: 1,
      totalFlightTimeSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.batteries.set(newBattery.id, newBattery);
    this.logger.log(`Auto-created fleet battery from discovered serial: ${serialNumber}`);
    return newBattery;
  }

  // ----------------- CONTROLLERS & CAMERAS -----------------
  async findOrCreateController(serialNumber: string): Promise<ControllerAsset> {
    const store = this.db.getStore();
    for (const c of store.controllers.values()) {
      if (c.serialNumber === serialNumber) return c;
    }
    const newController: ControllerAsset = {
      id: uuidv4(),
      serialNumber,
      model: 'DJI Remote Controller',
      status: AssetStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };
    store.controllers.set(newController.id, newController);
    return newController;
  }

  async findOrCreateCamera(serialNumber: string, droneId?: string): Promise<CameraAsset> {
    const store = this.db.getStore();
    for (const c of store.cameras.values()) {
      if (c.serialNumber === serialNumber) return c;
    }
    const newCamera: CameraAsset = {
      id: uuidv4(),
      serialNumber,
      model: 'DJI Integrated Gimbal Camera',
      droneId,
      status: AssetStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };
    store.cameras.set(newCamera.id, newCamera);
    return newCamera;
  }

  // ----------------- PILOTS & MISSIONS -----------------
  async getAllPilots(): Promise<PilotAsset[]> {
    const store = this.db.getStore();
    return Array.from(store.pilots.values());
  }

  async getAllMissions(): Promise<MissionAsset[]> {
    const store = this.db.getStore();
    return Array.from(store.missions.values());
  }
}
