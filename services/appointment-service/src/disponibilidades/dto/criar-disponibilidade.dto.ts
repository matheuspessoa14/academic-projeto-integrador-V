import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CriarDisponibilidadeDto {
  @ApiProperty()
  @IsUUID()
  agendaId!: string;

  @ApiProperty()
  @IsUUID()
  unidadeId!: string;

  @ApiProperty()
  @IsUUID()
  servicoId!: string;

  @ApiProperty({
    example: '2026-11-16T08:00:00',
  })
  @IsDateString()
  inicio!: string;

  @ApiProperty({
    example: '2026-11-16T12:00:00',
  })
  @IsDateString()
  fim!: string;
}