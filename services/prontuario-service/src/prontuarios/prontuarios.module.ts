
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProntuariosController } from './prontuarios.controller.js';
import { ProntuariosService } from './prontuarios.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProntuariosController],
  providers: [ProntuariosService],
})
export class ProntuariosModule {}
