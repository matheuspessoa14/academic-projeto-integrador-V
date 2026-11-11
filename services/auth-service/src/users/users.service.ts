import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { gerarHashSenha } from '../auth/password.utils.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { paraUsuarioPublico } from './user.mapper.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const usuarioExistente = await this.prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com este e-mail.',
      );
    }

    const senhaHash = await gerarHashSenha(dto.senha);

    const usuario = await this.prisma.user.create({
      data: {
        nome: dto.nome.trim(),
        email,
        senha: senhaHash,
        role: 'paciente',
        ativo: true,
      },
    });

    return paraUsuarioPublico(usuario);
  }

  async buscarPorEmailComSenha(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        role: true,
        ativo: true,
      },
    });
  }
}
