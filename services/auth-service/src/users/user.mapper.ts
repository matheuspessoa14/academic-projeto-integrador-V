
import { UserResponseDto } from './dto/user-response.dto.js';

type UsuarioInterno = UserResponseDto & {
  senha: string;
};

export function paraUsuarioPublico(
  usuario: UsuarioInterno,
): UserResponseDto {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    ativo: usuario.ativo,
  };
}
