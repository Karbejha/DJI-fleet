import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { ParserClientService } from './parser-client.service';
import { FleetModule } from '../fleet/fleet.module';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [FleetModule, RulesModule],
  providers: [ImportsService, ParserClientService],
  controllers: [ImportsController],
  exports: [ImportsService, ParserClientService],
})
export class ImportsModule {}
