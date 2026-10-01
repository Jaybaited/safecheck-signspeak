import {
  Controller, Post, Get, Param, Body, Req, UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RequestPasswordResetDto } from './dto/password-reset-request.dto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  // Public — no JWT required. Limited to 10 requests per 15 minutes per IP.
  @Post('request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  request(@Body() dto: RequestPasswordResetDto) {
    return this.service.requestReset(dto.username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests')
  getAll(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    return this.service.getAllRequests();
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests/pending-count')
  getPendingCount(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    return this.service.getPendingCount();
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    const adminId = req.user?.id ?? req.user?.sub;
    return this.service.approveRequest(id, adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/reject')
  reject(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    const adminId = req.user?.id ?? req.user?.sub;
    return this.service.rejectRequest(id, adminId);
  }
}