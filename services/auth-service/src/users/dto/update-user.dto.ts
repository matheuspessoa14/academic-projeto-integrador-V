import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nome Atualizado' })
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome?: string;

  @ApiPropertyOptional({ example: 'usuario@lumera.demo' })
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ enum: ['ADMINISTRADOR', 'PROFISSIONAL_SAUDE', 'RECEPCAO'] })
  @ValidateIf((_, valor) => valor !== undefined)
  @IsIn(['ADMINISTRADOR', 'PROFISSIONAL_SAUDE', 'RECEPCAO'])
  role?: 'ADMINISTRADOR' | 'PROFISSIONAL_SAUDE' | 'RECEPCAO';

  @ApiPropertyOptional({ description: 'Desativar/reativar conta sem excluir historico.' })
  @ValidateIf((_, valor) => valor !== undefined)
  @IsBoolean()
  ativo?: boolean;
}
