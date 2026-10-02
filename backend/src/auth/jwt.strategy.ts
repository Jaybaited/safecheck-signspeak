import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * While a user's mustChangePassword flag is set, only these routes may be
 * used. Login, logout and refresh do not go through this strategy.
 */
function isAllowedWhilePasswordChangeRequired(req: Request): boolean {
  const path = (req.originalUrl ?? req.url ?? '').split('?')[0].replace(/\/+$/, '');
  if (req.method === 'GET' && path === '/auth/me') return true;
  if (req.method === 'POST' && /^\/users\/[^/]+\/force-change-password$/.test(path)) return true;
  return false;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'a114f225-4e4e-4e54-831c-90d8751864fb',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // Always trust the database for role and password-change state,
    // not the (possibly stale) token claims.
    const user = await this.prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, username: true, role: true, mustChangePassword: true },
    });
    if (!user) throw new UnauthorizedException();

    if (user.mustChangePassword && !isAllowedWhilePasswordChangeRequired(req)) {
      throw new ForbiddenException({
        statusCode: 403,
        error:      'Forbidden',
        code:       'PASSWORD_CHANGE_REQUIRED',
        message:    'You must change your password before continuing.',
      });
    }

    return {
      id:                 user.id,
      sub:                user.id,
      username:           user.username,
      role:               user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
}