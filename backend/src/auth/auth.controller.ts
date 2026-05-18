import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { LoginThrottlerGuard } from './throttler.guard';
import type { AuthenticatedRequest } from './jwt.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { LoginResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponse> {
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    return this.authService.login(loginDto.username, loginDto.password, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Request() req: any, @Body() body: { refreshToken: string }) {
    return this.authService.refresh(req.user.id, body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken: string }) {
    await this.authService.logout(body.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.id);
  }
}