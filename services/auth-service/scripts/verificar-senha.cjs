
const bcrypt = require('bcrypt');
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Cole o hash bcrypt do usuário: ', (hash) => {
  rl.question('Digite a senha para verificar: ', async (senha) => {
    try {
      const corresponde = await bcrypt.compare(senha, hash.trim());

      console.log(
        corresponde
          ? 'Senha correta: corresponde ao hash.'
          : 'Senha incorreta: não corresponde ao hash.',
      );
    } catch {
      console.log('Não foi possível verificar o hash informado.');
    } finally {
      rl.close();
    }
  });
});
