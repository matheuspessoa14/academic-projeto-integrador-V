
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProntuarioDto {
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/)
  paciente?: string;

  @ValidateIf((_, valor) => valor !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/)
  medico?: string;

  @ValidateIf((_, valor) => valor !== undefined)
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  data?: string;

  @ValidateIf((_, valor) => valor !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/\S/)
  tipo?: string;

  @ValidateIf((_, valor) => valor !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(/\S/)
  observacoes?: string;

  @ValidateIf((_, valor) => valor !== undefined)
  @IsIn(['EM_ANALISE', 'FINALIZADO'])
  status?: 'EM_ANALISE' | 'FINALIZADO';
}
