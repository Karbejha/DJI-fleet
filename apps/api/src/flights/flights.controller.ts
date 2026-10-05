import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import { ProcessingStatus } from '@dji-fleet/shared';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get()
  @ApiOperation({ summary: 'Filter and paginate flights' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'droneId', required: false })
  @ApiQuery({ name: 'pilotId', required: false })
  @ApiQuery({ name: 'batteryId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getFlights(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('droneId') droneId?: string,
    @Query('pilotId') pilotId?: string,
    @Query('batteryId') batteryId?: string,
    @Query('status') status?: ProcessingStatus
  ) {
    return this.flightsService.getFlights({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      q,
      droneId,
      pilotId,
      batteryId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full flight details by ID' })
  async getFlight(@Param('id') id: string) {
    return this.flightsService.getFlightById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flight record' })
  async deleteFlight(@Param('id') id: string) {
    return this.flightsService.deleteFlight(id);
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Get GeoJSON 3D flight trajectory' })
  async getTrack(@Param('id') id: string) {
    return this.flightsService.getFlightTrack(id);
  }

  @Get(':id/telemetry')
  @ApiOperation({ summary: 'Query downsampled or full telemetry stream' })
  @ApiQuery({ name: 'resolution', required: false })
  @ApiQuery({ name: 'fields', required: false })
  async getTelemetry(
    @Param('id') id: string,
    @Query('resolution') resolution?: string,
    @Query('fields') fields?: string
  ) {
    return this.flightsService.getFlightTelemetry(id, resolution, fields);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get chronological warnings and events' })
  async getEvents(@Param('id') id: string) {
    return this.flightsService.getFlightEvents(id);
  }
}
