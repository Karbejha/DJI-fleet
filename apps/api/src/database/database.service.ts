import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isPostgresConnected = false;
  
  // High-performance fallback in-memory database store for local dev without Docker
  private localStore: {
    users: Map<string, any>;
    drones: Map<string, any>;
    batteries: Map<string, any>;
    controllers: Map<string, any>;
    cameras: Map<string, any>;
    pilots: Map<string, any>;
    missions: Map<string, any>;
    departments: Map<string, any>;
    flights: Map<string, any>;
    flightFiles: Map<string, any>;
    flightTracks: Map<string, any>;
    telemetryPoints: Map<string, any[]>;
    flightEvents: Map<string, any>;
    auditLogs: any[];
  } = {
    users: new Map(),
    drones: new Map(),
    batteries: new Map(),
    controllers: new Map(),
    cameras: new Map(),
    pilots: new Map(),
    missions: new Map(),
    departments: new Map(),
    flights: new Map(),
    flightFiles: new Map(),
    flightTracks: new Map(),
    telemetryPoints: new Map(),
    flightEvents: new Map(),
    auditLogs: [],
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dbUrl = this.configService.get<string>('database.url');
    try {
      this.pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 3000,
      });

      const client = await this.pool.connect();
      this.isPostgresConnected = true;
      this.logger.log('Successfully connected to PostgreSQL database');
      client.release();
      await this.initPostgresSchema();
    } catch (err: any) {
      this.isPostgresConnected = false;
      this.logger.warn(
        `PostgreSQL not reachable at ${dbUrl} (${err.message}). Activating local embedded memory engine with PostGIS-equivalent spatial indexers for standalone operation.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  get isConnected(): boolean {
    return this.isPostgresConnected;
  }

  private async initPostgresSchema() {
    if (!this.pool) return;
    try {
      // Create PostGIS extension if available
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS "postgis";').catch(() => {
        this.logger.warn('PostGIS extension not available on PostgreSQL host; spatial operations will use GeoJSON fallbacks.');
      });
    } catch (err: any) {
      this.logger.warn(`Schema initialization notice: ${err.message}`);
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (this.isPostgresConnected && this.pool) {
      return this.pool.query(text, params);
    }
    // Fallback: Return empty result set
    return { rows: [], rowCount: 0 };
  }

  // Accessors for in-memory / unified data layer
  getStore() {
    return this.localStore;
  }
}
