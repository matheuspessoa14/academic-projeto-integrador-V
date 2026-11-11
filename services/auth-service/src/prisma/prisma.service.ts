
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
    const databaseUrl =
      config.get<string>('DATABASE_URL');

    if (
      !databaseUrl ||
      databaseUrl.includes('USUARIO:SENHA@HOST')
    ) {
      throw new Error(
        'Configure uma DATABASE_URL válida antes de usar o PrismaService.',
      );
    }

    const driverUrl = databaseUrl.replace(
      /^mysql:\/\//,
      'mariadb://',
    );

    super({
      adapter: new PrismaMariaDb(driverUrl),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
