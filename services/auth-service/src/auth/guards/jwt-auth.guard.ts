
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Token de autenticação não informado.',
      );
    }

    const [tipo, token] = authorization.split(' ');

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Formato de token inválido.',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      if (
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0 ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string'
      ) {
        throw new Error('Payload inválido');
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token inválido ou expirado.',
      );
    }
  }
}
