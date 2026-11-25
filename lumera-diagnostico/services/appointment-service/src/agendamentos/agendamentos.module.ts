import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AgendamentosController } from './agendamentos.controller.js';
import { AgendamentosService } from './agendamentos.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
})
export class AgendamentosModule {}
