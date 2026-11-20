import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";

import request from "supertest";

import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

import { ValidationPipe } from "@nestjs/common";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

describe("Appointment Service (E2E)", () => {
  let app: INestApplication;

  const prismaMock = {
    agenda: {
      findMany: async () => [],
      findUnique: async () => null,
    },
    agendamento: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
      update: async () => ({}),
    },
    bloqueio: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
    },
    disponibilidade: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(prismaMock),
    $disconnect: async () => {},
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();

    // Reproduz o ValidationPipe da aplicação real.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Reproduz a configuração Swagger do main.ts.
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Lumera — Appointment Service")
      .setDescription("API de gerenciamento de agendas e agendamentos.")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup("api", app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Inicialização", () => {
    it("deve iniciar a aplicação corretamente", () => {
      expect(app).toBeDefined();
    });

    it("deve disponibilizar a documentação Swagger", async () => {
      const response = await request(app.getHttpServer())
        .get("/api-json")
        .expect(200);

      expect(response.body.info.title).toBe("Lumera — Appointment Service");
    });

    it("deve documentar os módulos da API", async () => {
      const response = await request(app.getHttpServer())
        .get("/api-json")
        .expect(200);

      expect(Object.keys(response.body.paths)).toEqual(
        expect.arrayContaining([
          "/agendas",
          "/agendas/{id}",
          "/agendamentos",
          "/agendamentos/{id}",
          "/bloqueios",
          "/disponibilidades",
        ]),
      );

      expect(response.body.components.securitySchemes).toHaveProperty("bearer");
    });
  });
});
