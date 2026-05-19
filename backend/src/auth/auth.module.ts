import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('JWT_SECRET') ?? 'a114f225-4e4e-4e54-831c-90d8751864fb',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers:   [AuthService, JwtStrategy, JwtRefreshStrategy, PrismaService],
  controllers: [AuthController],
  exports:     [AuthService, JwtModule],
})
export class AuthModule {}