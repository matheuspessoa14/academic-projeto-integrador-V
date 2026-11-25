// LUMERA_PACIENTES_RECEPCAO_DEMO_V1
// Adaptador de demonstracao: usuario RECEPCAO do MySQL Auth -> UUID estavel
// para o campo paciente_id CHAR(36) do MySQL Agendamentos.
// NAO representa uma entidade Paciente adequada para uso em producao.
function uuidDeConta(id) {
  try {
    const numero = BigInt(String(id));
    if (numero <= 0n || numero >= (1n << 64n)) return null;
    const h = numero.toString(16).padStart(16, '0');
    return 'c1a0' + h.slice(0, 4) + '-0000-4000-8000-' + h.slice(4);
  } catch {
    return null;
  }
}

export function mapearPacientesRecepcao(usuarios) {
  return (Array.isArray(usuarios) ? usuarios : [])
    .filter(u => u.ativo === true && u.role === 'RECEPCAO')
    .map(u => ({ id: uuidDeConta(u.id), nome: u.nome }))
    .filter(p => Boolean(p.id));
}
