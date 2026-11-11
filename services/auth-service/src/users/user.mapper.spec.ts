
import { describe, expect, it } from 'vitest';

import { paraUsuarioPublico } from './user.mapper.js';

describe('Proteção dos dados do usuário', () => {
  it('não deve retornar o hash da senha', () => {
    const usuario = {
      id: 1,
      nome: 'Usuário Teste',
      email: 'teste@lumera.demo',
      senha: 'hash-ficticio',
      role: 'paciente',
      ativo: true,
    };

    const resultado = paraUsuarioPublico(usuario);

    expect(resultado).not.toHaveProperty('senha');
    expect(resultado).toEqual({
      id: 1,
      nome: 'Usuário Teste',
      email: 'teste@lumera.demo',
      role: 'paciente',
      ativo: true,
    });
  });
});
