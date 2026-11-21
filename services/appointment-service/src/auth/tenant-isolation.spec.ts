import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AgendasService } from '../agendas/agendas.service.js';
import { AgendamentosService } from '../agendamentos/agendamentos.service.js';
import { DisponibilidadesService } from '../disponibilidades/disponibilidades.service.js';
import { BloqueiosService } from '../bloqueios/bloqueios.service.js';

const tenant = '00000000-0000-4000-8000-000000000001';
const outroTenant = '00000000-0000-4000-8000-000000000002';

describe('Isolamento de agendamentos por clinica', () => {
  it('nao permite que o filtro de clinica do cliente substitua o JWT', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new AgendasService({ agenda: { findMany } } as unknown as PrismaService)
      .listar({ clinicaId: outroTenant, tenantId: tenant });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ clinicaId: tenant }),
    }));
  });
  it('restringe a lista de agendamentos a clinica do JWT', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new AgendamentosService({ agendamento: { findMany } } as unknown as PrismaService)
      .listar({ tenantId: tenant });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ agenda: { clinicaId: tenant } }),
    }));
  });
  it('restringe disponibilidades a clinica do JWT', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new DisponibilidadesService({ disponibilidade: { findMany } } as unknown as PrismaService)
      .listar({ tenantId: tenant });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ agenda: { clinicaId: tenant } }),
    }));
  });
  it('restringe bloqueios a clinica do JWT', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new BloqueiosService({ bloqueio: { findMany } } as unknown as PrismaService)
      .listar(undefined, tenant);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ agenda: { clinicaId: tenant } }),
    }));
  });
});
