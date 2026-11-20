
import { ApiProperty } from '@nestjs/swagger';

import {
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CriarAgendamentoDto {
  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Identificador da agenda.',
  })
  @IsUUID()
  agendaId!: string;

  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000002',
    description: 'Identificador do paciente.',
  })
  @IsUUID()
  pacienteId!: string;

  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000003',
    description: 'Identificador da unidade.',
  })
  @IsUUID()
  unidadeId!: string;

  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000004',
    description: 'Identificador do serviço.',
  })
  @IsUUID()
  servicoId!: string;

  @ApiProperty({
    example: '2026-11-20T09:00:00',
    description: 'Data e horário de início.',
  })
  @IsDateString()
  inicio!: string;

  @ApiProperty({
    example: '2026-11-20T10:00:00',
    description: 'Data e horário de término.',
  })
  @IsDateString()
  fim!: string;
}
