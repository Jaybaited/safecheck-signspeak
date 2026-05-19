import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, Req, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)   // JWT required on ALL routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get('student-parent/:studentId')
  @Roles('ADMIN', 'PARENT', 'TEACHER')
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
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @Post(':id/force-change-password')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  forceChangePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.forceChangePassword(id, body.newPassword);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
    @Req() req: any,
  ) {
    const caller     = req.user;
    const callerId   = caller?.id ?? caller?.sub ?? '';
    const callerRole = caller?.role ?? '';

    if (updateUserDto.role && callerRole !== 'ADMIN') {
      const { role: _stripped, ...rest } = updateUserDto;
      return this.usersService.update(id, rest, callerId);
    }
    return this.usersService.update(id, updateUserDto, callerId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('audit-log/:userId')
  @Roles('ADMIN')
  getAuditLog(@Param('userId') userId: string, @Req() req: any) {
    return this.usersService.getAuditLog(userId);
  }
}