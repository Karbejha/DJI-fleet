import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { FleetModule } from './fleet/fleet.module';
import { FlightsModule } from './flights/flights.module';
import { ImportsModule } from './imports/imports.module';
import { RulesModule } from './rules/rules.module';
import { ExportModule } from './export/export.module';
import { GisModule } from './gis/gis.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    FleetModule,
    FlightsModule,
    ImportsModule,
    RulesModule,
    ExportModule,
    GisModule,
    AnalyticsModule,
    DemoModule,
  ],
})
export class AppModule {}
