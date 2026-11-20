import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AgendasModule } from './agendas/agendas.module.js';
import { DisponibilidadesModule } from './disponibilidades/disponibilidades.module.js';
import { BloqueiosModule } from './bloqueios/bloqueios.module.js';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    AgendasModule,
    DisponibilidadesModule,
    BloqueiosModule,
    AgendamentosModule,
  ],
})
export class AppModule {}
