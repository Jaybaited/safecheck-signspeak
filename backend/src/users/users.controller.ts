import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ── Named routes MUST be declared BEFORE :id to avoid route conflicts ──

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

  // ─── Save FCM / Expo push token for the logged-in user ───────────────────
  @UseGuards(AuthGuard('jwt'))
  @Patch('me/fcm-token')
  saveFcmToken(
    @Req() req: any,
    @Body('fcmToken') fcmToken: string,
  ) {
    return this.usersService.updateFcmToken(req.user.id ?? req.user.sub, fcmToken);
  }

  // ── Param routes below ────────────────────────────────────────────────────

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}