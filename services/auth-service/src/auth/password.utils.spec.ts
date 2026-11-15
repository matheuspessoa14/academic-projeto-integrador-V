
import {
  gerarHashSenha,
  verificarSenha,
} from './password.utils.js';

describe('Segurança das senhas', () => {
  const senha = 'Lumera@12345';

  it('deve gerar um hash diferente da senha', async () => {
    const hash = await gerarHashSenha(senha);

    expect(hash).not.toBe(senha);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('deve aceitar a senha correta', async () => {
    const hash = await gerarHashSenha(senha);

    const resultado = await verificarSenha(
      senha,
      hash,
    );

    expect(resultado).toBe(true);
  });

  it('deve rejeitar a senha incorreta', async () => {
    const hash = await gerarHashSenha(senha);

    const resultado = await verificarSenha(
      'SenhaErrada123',
      hash,
    );

    expect(resultado).toBe(false);
  });
});
