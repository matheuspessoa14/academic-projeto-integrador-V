
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor(config: ConfigService) {
    const databaseUrl = config.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'Configure uma DATABASE_URL válida antes de usar o PrismaService.',
      );
    }

    const url = new URL(databaseUrl);

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\/+/, ''),

      // Tempo máximo para estabelecer uma conexão
      connectTimeout: 10_000,

      // Tempo máximo aguardando uma conexão disponível
      acquireTimeout: 20_000,

      // Limite reduzido para o banco compartilhado do SENAC
      connectionLimit: 3,

      // Tempo de inatividade em segundos
      idleTimeout: 300,
    });

    super({
      adapter,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
