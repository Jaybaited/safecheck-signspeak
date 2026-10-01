import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, Req, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UsersService }   from './users.service';
import { CreateUserDto }  from './dto/create-user.dto';
import { NewPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { JwtAuthGuard }   from '../auth/jwt.guard';
import { RolesGuard }     from '../auth/roles.guard';
import { Roles }          from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // A user may only change their OWN password.
  private assertSelf(req: any, id: string) {
    const callerId = req.user?.id ?? req.user?.sub;
    if (!callerId || callerId !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }
  }

  // ── IMPORTANT: All named/specific routes must come BEFORE /:id ────────────

  @Get()
  @Roles('ADMIN')
  findAll(@Query('excludeId') excludeId?: string) {
    return this.usersService.findAll(excludeId ?? '');
  }

  @Get('stats')
  @Roles('ADMIN')
  getStats() {
    return this.usersService.getStats();
  }

  @Get('check-rfid')
  @Roles('ADMIN')
  checkRfid(@Query('rfid') rfid: string) {
    return this.usersService.checkRfidAvailable(rfid);
  }

  @Get('student-parent/:studentId')
  @Roles('ADMIN', 'PARENT', 'TEACHER', 'STUDENT')
  getStudentParent(@Param('studentId') studentId: string) {
    return this.usersService.getStudentParent(studentId);
  }

  @Get('my-children/:parentId')
  @Roles('ADMIN', 'PARENT')
  getMyChildren(@Param('parentId') parentId: string) {
    return this.usersService.getMyChildren(parentId);
  }

  @Patch('me/fcm-token')
  saveFcmToken(@Req() req: any, @Body('fcmToken') fcmToken: string) {
    return this.usersService.updateFcmToken(req.user.id ?? req.user.sub, fcmToken);
  }

  @Get('audit-log/:userId')
  @Roles('ADMIN')
  getAuditLog(@Param('userId') userId: string) {
    return this.usersService.getAuditLog(userId);
  }

  // ── Generic /:id routes — must come LAST ──────────────────────────────────

  @Get(':id')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post(':id/change-password')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordDto,
    @Req() req: any,
  ) {
    this.assertSelf(req, id);
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @Post(':id/force-change-password')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  forceChangePassword(
    @Param('id') id: string,
    @Body() body: NewPasswordDto,
    @Req() req: any,
  ) {
    this.assertSelf(req, id);
    return this.usersService.forceChangePassword(id, body.newPassword);
  }

  // Admin only. password and username are no longer handled by this route.
  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
    @Req() req: any,
  ) {
    const callerId = req.user?.id ?? req.user?.sub ?? '';
    return this.usersService.update(id, updateUserDto, callerId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}