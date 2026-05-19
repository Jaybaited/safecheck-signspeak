import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'a114f225-4e4e-4e54-831c-90d8751864fb',
    });
  }

  async validate(payload: any) {
    return {
      id:       payload.sub,
      sub:      payload.sub,
      username: payload.username,
      role:     payload.role,
    };
  }
}