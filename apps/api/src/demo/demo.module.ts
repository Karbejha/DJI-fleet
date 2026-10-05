import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [RulesModule],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
