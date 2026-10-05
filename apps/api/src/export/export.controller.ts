import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';

@ApiTags('Exports & Reports')
@Controller('flights/:id')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('export/csv')
  @ApiOperation({ summary: 'Export normalized telemetry points as CSV' })
  async downloadCsv(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.exportService.exportCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="flight_${id}_telemetry.csv"`);
    res.send(csv);
  }

  @Get('export/geojson')
  @ApiOperation({ summary: 'Export 3D flight trajectory and markers as GeoJSON' })
  async downloadGeoJson(@Param('id') id: string, @Res() res: Response) {
    const geoJson = await this.exportService.exportGeoJson(id);
    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename="flight_${id}_track.geojson"`);
    res.send(geoJson);
  }

  @Get('export/kml')
  @ApiOperation({ summary: 'Export flight track for Google Earth (KML)' })
  async downloadKml(@Param('id') id: string, @Res() res: Response) {
    const kml = await this.exportService.exportKml(id);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="flight_${id}_earth.kml"`);
    res.send(kml);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get printable flight briefing report data' })
  async getReport(@Param('id') id: string) {
    return this.exportService.getReportData(id);
  }
}
