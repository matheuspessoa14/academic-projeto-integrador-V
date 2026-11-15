import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function gerarHashSenha(
  senha: string,
): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
