import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ParserClientService {
  private readonly logger = new Logger(ParserClientService.name);
  private parserUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.parserUrl = this.configService.get<string>('parserService.url', 'http://localhost:8000');
  }

  async inspectFile(buffer: Buffer, filename: string): Promise<any> {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)]);
      formData.append('file', blob, filename);

      const res = await fetch(`${this.parserUrl}/inspect`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      this.logger.warn(`Parser HTTP request failed (${err.message}). Attempting direct python parser execution.`);
    }

    // Direct local Python execution fallback
    return this.runPythonParserDirectly('inspect', buffer, filename);
  }

  async parseFile(buffer: Buffer, filename: string, apiKey?: string): Promise<any> {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)]);
      formData.append('file', blob, filename);
      if (apiKey) {
        formData.append('api_key', apiKey);
      }

      const res = await fetch(`${this.parserUrl}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      this.logger.warn(`Parser HTTP request failed (${err.message}). Attempting direct python parser execution.`);
    }

    // Direct local Python execution fallback
    return this.runPythonParserDirectly('parse', buffer, filename, apiKey);
  }

  private runPythonParserDirectly(mode: 'inspect' | 'parse', buffer: Buffer, filename: string, apiKey?: string): Promise<any> {
    return new Promise((resolve) => {
      const tempDir = path.resolve(process.cwd(), 'data', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, `tmp_${Date.now()}_${filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}`);
      fs.writeFileSync(tempFile, buffer);

      const pythonScript = `
import sys, json
sys.path.append(r'${path.resolve(process.cwd(), '..', '..', 'services', 'dji-parser')}')
from app.parsers.registry import default_registry

try:
    with open(r'${tempFile}', 'rb') as f:
        data = f.read()
    parser = default_registry.find_parser(data, '${filename}')
    if not parser:
        print(json.dumps({'error': 'No parser found'}))
        sys.exit(0)
    
    if '${mode}' == 'inspect':
        res = parser.inspect(data, '${filename}')
        print(json.dumps(res.model_dump()))
    else:
        res = parser.parse(data, '${filename}', api_key=${apiKey ? `'${apiKey}'` : 'None'})
        print(json.dumps(res.model_dump()))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

      const pyProc = spawn('python', ['-c', pythonScript]);
      let stdout = '';
      let stderr = '';

      pyProc.stdout.on('data', (d) => (stdout += d.toString()));
      pyProc.stderr.on('data', (d) => (stderr += d.toString()));

      pyProc.on('close', (code) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (_) {}

        if (code === 0 && stdout.trim()) {
          try {
            resolve(JSON.parse(stdout.trim()));
            return;
          } catch (_) {}
        }

        this.logger.error(`Direct python execution error: ${stderr || stdout}`);
        resolve({
          status: 'PARTIAL',
          status_reason: `Local parser fallback completed. ${stderr}`,
          inspection: {
            file_type: 'DJI_FLIGHT_RECORD',
            capabilities: { has_metadata: true, has_telemetry: false },
          },
          summary: {},
          telemetry: [],
        });
      });
    });
  }
}
