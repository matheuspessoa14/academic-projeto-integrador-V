import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProntuariosController } from './prontuarios.controller.js';
import { ProntuariosService } from './prontuarios.service.js';
@Module({ imports: [PrismaModule, AuthModule], controllers: [ProntuariosController], providers: [ProntuariosService, JwtAuthGuard] })
export class ProntuariosModule {}
