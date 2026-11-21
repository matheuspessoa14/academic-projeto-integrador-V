
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Usuário Teste',
    description: 'Nome completo do usuário.',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(120)
  nome!: string;

  @ApiProperty({
    example: 'usuario@lumera.demo',
    description: 'E-mail único para cadastro.',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(150)
  email!: string;

  @ApiProperty({
    example: 'SenhaExemplo123',
    description: 'Senha com no mínimo 8 caracteres.',
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @MinLength(8, {
    message: 'A senha deve ter no mínimo 8 caracteres',
  })
  @MaxLength(72)
  senha!: string;
  @ApiProperty({ example: 'PROFISSIONAL_SAUDE', required: false, enum: ['ADMINISTRADOR', 'PROFISSIONAL_SAUDE', 'RECEPCAO'] })
  @IsOptional()
  @IsIn(['ADMINISTRADOR', 'PROFISSIONAL_SAUDE', 'RECEPCAO'])
  role?: 'ADMINISTRADOR' | 'PROFISSIONAL_SAUDE' | 'RECEPCAO';
}
