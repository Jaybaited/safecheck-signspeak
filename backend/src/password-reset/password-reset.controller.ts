import {
  Controller, Post, Get, Param, Body, Req, UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RequestPasswordResetDto } from './dto/password-reset-request.dto';  // ← add this

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  // Public — no JWT required
  @Post('request')
  request(@Body() dto: RequestPasswordResetDto) {                            // ← change Body()
    return this.service.requestReset(dto.username);                          // ← use dto.username
  }

  // Admin only
  @UseGuards(JwtAuthGuard)
  @Get('requests')
  getAll(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    return this.service.getAllRequests();
  }

  // Admin only — badge count
  @UseGuards(JwtAuthGuard)
  @Get('requests/pending-count')
  getPendingCount(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    return this.service.getPendingCount();
  }

  // Admin only
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    const adminId = req.user?.id ?? req.user?.sub;
    return this.service.approveRequest(id, adminId);
  }

  // Admin only
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/reject')
  reject(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admins only.');
    const adminId = req.user?.id ?? req.user?.sub;
    return this.service.rejectRequest(id, adminId);
  }
}