import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { BloqueiosController } from './bloqueios.controller.js';
import { BloqueiosService } from './bloqueios.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BloqueiosController],
  providers: [BloqueiosService],
})
export class BloqueiosModule {}
