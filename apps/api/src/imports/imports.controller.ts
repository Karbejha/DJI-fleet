import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@Controller()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('imports/upload')
  @ApiOperation({ summary: 'Upload and asynchronously ingest DJI flight log or companion file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        apiKey: { type: 'string', description: 'Optional server-side DJI API key override' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('apiKey') apiKey?: string
  ) {
    if (!file) throw new NotFoundException('No file provided');
    return this.importsService.processUploadedFile(file, apiKey);
  }

  @Post('imports/upload-batch')
  @ApiOperation({ summary: 'Upload batch of DJI files (multi-file drag-and-drop)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadBatch(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('apiKey') apiKey?: string
  ) {
    if (!files || files.length === 0) throw new NotFoundException('No files provided');
    const results = [];
    for (const f of files) {
      results.push(await this.importsService.processUploadedFile(f, apiKey));
    }
    return results;
  }

  @Get('imports/status/:jobId')
  @ApiOperation({ summary: 'Query ingestion job status and progress' })
  async getStatus(@Param('jobId') jobId: string) {
    const job = this.importsService.getJobStatus(jobId);
    if (!job) throw new NotFoundException('Job ID not found');
    return job;
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'File Inspector - inspect raw file metadata and association' })
  async inspectFile(@Param('id') fileId: string) {
    return this.importsService.getFileInspectorData(fileId);
  }
}
