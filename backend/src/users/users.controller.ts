import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // No JWT guard — filtering done via excludeId query param sent by frontend
  @Get()
  findAll(@Query('excludeId') excludeId?: string) {
    return this.usersService.findAll(excludeId ?? '');
  }

  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  @Get('student-parent/:studentId')
  getStudentParent(@Param('studentId') studentId: string) {
    return this.usersService.getStudentParent(studentId);
  }

  @Get('my-children/:parentId')
  getMyChildren(@Param('parentId') parentId: string) {
    return this.usersService.getMyChildren(parentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/fcm-token')
  saveFcmToken(
    @Req() req: any,
    @Body('fcmToken') fcmToken: string,
  ) {
    return this.usersService.updateFcmToken(req.user.id ?? req.user.sub, fcmToken);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post(':id/change-password')
  changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @Post(':id/force-change-password')
  forceChangePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.forceChangePassword(id, body.newPassword);
  }

  // ── PATCH /users/:id ──────────────────────────────────────────────────────
  // Role changes are only permitted by ADMIN users.
  // If a non-ADMIN sends a `role` field, it is silently stripped.
  // JWT is required when a role change is attempted so we know who changed it.
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
    @Req() req: any,
  ) {
    const caller     = req.user;
    const callerId   = caller?.id ?? caller?.sub ?? '';
    const callerRole = caller?.role ?? '';

    // Strip role from the payload if the caller is not ADMIN
    if (updateUserDto.role && callerRole !== 'ADMIN') {
      const { role: _stripped, ...rest } = updateUserDto;
      return this.usersService.update(id, rest, callerId);
    }

    return this.usersService.update(id, updateUserDto, callerId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ── GET /users/audit-log/:userId ─────────────────────────────────────────
  // Returns role change history for a specific user. ADMIN only.
  @UseGuards(JwtAuthGuard)
  @Get('audit-log/:userId')
  getAuditLog(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const callerRole = req.user?.role ?? '';
    if (callerRole !== 'ADMIN') throw new ForbiddenException('Admins only.');
    return this.usersService.getAuditLog(userId);
  }
}