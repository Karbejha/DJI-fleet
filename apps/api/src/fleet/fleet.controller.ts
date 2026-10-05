import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FleetService } from './fleet.service';

@ApiTags('Fleet')
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('drones')
  @ApiOperation({ summary: 'List all registered aircraft' })
  async getDrones() {
    return this.fleetService.getAllDrones();
  }

  @Get('drones/:id')
  @ApiOperation({ summary: 'Get aircraft profile by ID' })
  async getDrone(@Param('id') id: string) {
    const drone = await this.fleetService.getDroneById(id);
    if (!drone) throw new NotFoundException('Aircraft not found');
    return drone;
  }

  @Get('batteries')
  @ApiOperation({ summary: 'List all fleet batteries' })
  async getBatteries() {
    return this.fleetService.getAllBatteries();
  }

  @Get('batteries/:id')
  @ApiOperation({ summary: 'Get battery profile and health trend' })
  async getBattery(@Param('id') id: string) {
    const battery = await this.fleetService.getBatteryById(id);
    if (!battery) throw new NotFoundException('Battery not found');
    return battery;
  }

  @Get('pilots')
  @ApiOperation({ summary: 'List pilots' })
  async getPilots() {
    return this.fleetService.getAllPilots();
  }

  @Get('missions')
  @ApiOperation({ summary: 'List missions' })
  async getMissions() {
    return this.fleetService.getAllMissions();
  }
}
