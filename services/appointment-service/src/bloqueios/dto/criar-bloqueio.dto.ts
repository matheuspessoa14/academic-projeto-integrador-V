
import { ApiProperty } from '@nestjs/swagger';

import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CriarBloqueioDto {
  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Identificador da agenda.',
  })
  @IsUUID()
  agendaId!: string;

  @ApiProperty({
    example: '2026-11-20T09:00:00',
    description: 'Data e horário de início do bloqueio.',
  })
  @IsDateString()
  inicio!: string;

  @ApiProperty({
    example: '2026-11-20T12:00:00',
    description: 'Data e horário de término do bloqueio.',
  })
  @IsDateString()
  fim!: string;

  @ApiProperty({
    example: 'Indisponibilidade do profissional',
    description: 'Motivo do bloqueio.',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo!: string;
}
