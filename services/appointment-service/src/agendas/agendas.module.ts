import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AgendasController } from './agendas.controller.js';
import { AgendasService } from './agendas.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AgendasController],
  providers: [AgendasService],
})
export class AgendasModule {}
