
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListarProntuariosDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  q?: string;

  @IsOptional()
  @IsIn(['EM_ANALISE', 'FINALIZADO'])
  status?: 'EM_ANALISE' | 'FINALIZADO';
}
