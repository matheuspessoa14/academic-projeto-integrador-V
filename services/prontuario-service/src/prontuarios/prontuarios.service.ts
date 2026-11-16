
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProntuarioDto } from './dto/create-prontuario.dto.js';

@Injectable()
export class ProntuariosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listar() {
    return this.prisma.prontuario.findMany({
      orderBy: {
        data: 'desc',
      },
    });
  }

  async buscarPorId(id: number) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
    });

    if (!prontuario) {
      throw new NotFoundException(
        `Prontuário com ID ${id} não encontrado.`,
      );
    }

    return prontuario;
  }

  async criar(dto: CreateProntuarioDto) {
    return this.prisma.prontuario.create({
      data: {
        paciente: dto.paciente.trim(),
        medico: dto.medico.trim(),
        data: new Date(`${dto.data}T00:00:00.000Z`),
        tipo: dto.tipo.trim(),
        observacoes: dto.observacoes.trim(),
      },
    });
  }
}
