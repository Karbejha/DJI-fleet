import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GisService } from './gis.service';

@ApiTags('GIS & Spatial Analytics')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Post('query')
  @ApiOperation({ summary: 'Perform PostGIS spatial query (intersect area, radius buffer, polygon containment)' })
  async spatialQuery(
    @Body()
    body: {
      bbox?: [number, number, number, number];
      point?: [number, number];
      radiusMeters?: number;
      polygonCoords?: Array<[number, number]>;
    }
  ) {
    return this.gisService.queryFlightsSpatial(body);
  }

  @Get('map-tracks')
  @ApiOperation({ summary: 'Get aggregated multi-flight tracks for global flight map' })
  async getMapTracks() {
    return this.gisService.queryFlightsSpatial({});
  }
}
