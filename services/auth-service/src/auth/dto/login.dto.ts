
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@lumera.demo',
    description: 'E-mail cadastrado do usuário.',
  })
  @IsEmail({}, {
    message: 'Informe um e-mail válido',
  })
  email!: string;

  @ApiProperty({
    example: 'SenhaExemplo123',
    description: 'Senha da conta.',
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty({
    message: 'A senha é obrigatória',
  })
  senha!: string;
}
