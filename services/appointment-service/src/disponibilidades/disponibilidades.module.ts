import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { DisponibilidadesController } from './disponibilidades.controller.js';
import { DisponibilidadesService } from './disponibilidades.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DisponibilidadesController],
  providers: [DisponibilidadesService],
})
export class DisponibilidadesModule {}
