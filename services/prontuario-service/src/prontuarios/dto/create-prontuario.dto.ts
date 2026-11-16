
import {
  IsString,
  IsNotEmpty,
  IsISO8601,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProntuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/)
  paciente!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/)
  medico!: string;

  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  data!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/\S/)
  tipo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(/\S/)
  observacoes!: string;
}
