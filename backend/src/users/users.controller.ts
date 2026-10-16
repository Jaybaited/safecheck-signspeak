import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, Req, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UsersService }   from './users.service';
import { CreateUserDto }  from './dto/create-user.dto';
import { NewPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { LinkChildDto } from './dto/link-child.dto';
import { ArchiveStudentDto, RestoreStudentDto } from './dto/archive.dto';
import { CardStatusDto } from './dto/card-status.dto';
import { PhotoDto } from './dto/photo.dto';
import { JwtAuthGuard }   from '../auth/jwt.guard';
import { RolesGuard }     from '../auth/roles.guard';
import { Roles }          from '../auth/roles.decorator';
import { PrismaService }  from '../prisma/prisma.service';
import { assertCanAccessStudent, getAuthUser } from '../common/access.util';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  // A user may only change their OWN password.
  private assertSelf(req: any, id: string) {
    const callerId = req.user?.id ?? req.user?.sub;
    if (!callerId || callerId !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }
  }

  // ADMIN: any user. Everyone else: themselves, or a student they may access
  // (linked parent / teacher).
  private async assertCanViewUser(req: any, id: string) {
    const user = getAuthUser(req);
    if (user.role === 'ADMIN' || user.id === id) return;

    const target = await this.prisma.user.findUnique({
      where:  { id },
      select: { role: true },
    });
    if (target?.role === 'STUDENT') {
      await assertCanAccessStudent(this.prisma, user, id);
      return;
    }
    throw new ForbiddenException('You do not have access to this user.');
  }

  // ── IMPORTANT: All named/specific routes must come BEFORE /:id ────────────

  @Get()
  @Roles('ADMIN')
  findAll(@Query('excludeId') excludeId?: string) {
    return this.usersService.findAll(excludeId ?? '');
  }

  @Get('archive')
  @Roles('ADMIN')
  listArchived(
    @Query('status') status?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    return this.usersService.listArchived({ status, gradeLevel, from, to, q });
  }

  @Post(':id/archive')
  @Roles('ADMIN')
  archiveStudent(@Param('id') id: string, @Body() body: ArchiveStudentDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.archiveStudent(id, body, adminId);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  restoreStudent(@Param('id') id: string, @Body() body: RestoreStudentDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.restoreStudent(id, body, adminId);
  }

  @Get('retired-cards')
  @Roles('ADMIN')
  getRetiredCards() {
    return this.usersService.getRetiredCards();
  }

  @Post(':id/card-status')
  @Roles('ADMIN')
  setCardStatus(@Param('id') id: string, @Body() body: CardStatusDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.setCardStatus(id, body.action, adminId, body.note);
  }

  @Post(':id/photo')
  @Roles('ADMIN')
  setPhoto(@Param('id') id: string, @Body() body: PhotoDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.setPhoto(id, body.image, adminId);
  }

  @Delete(':id/photo')
  @Roles('ADMIN')
  removePhoto(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.removePhoto(id, adminId);
  }

  @Get(':id/photo-url')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  async getPhotoUrl(@Param('id') id: string, @Req() req: any) {
    await this.assertCanViewUser(req, id);
    return this.usersService.getPhotoUrl(id);
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

  @Get('parents/search')
  @Roles('ADMIN')
  searchParents(@Query('q') q?: string, @Query('by') by?: string) {
    return this.usersService.searchParents(q, by);
  }

  @Post('change-parent')
  @Roles('ADMIN')
  changeParent(@Body() body: LinkChildDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.changeParent(body.studentId, body.parentId, adminId);
  }

  @Get(':id/delete-preview')
  @Roles('ADMIN')
  deletePreview(@Param('id') id: string) {
    return this.usersService.getDeletePreview(id);
  }

  @Get('student-parent/:studentId')
  @Roles('ADMIN', 'PARENT', 'TEACHER', 'STUDENT')
  async getStudentParent(@Param('studentId') studentId: string, @Req() req: any) {
    await assertCanAccessStudent(this.prisma, getAuthUser(req), studentId);
    return this.usersService.getStudentParent(studentId);
  }

  @Get('my-children/:parentId')
  @Roles('ADMIN', 'PARENT')
  getMyChildren(@Param('parentId') parentId: string, @Req() req: any) {
    const user = getAuthUser(req);
    if (user.role !== 'ADMIN' && user.id !== parentId) {
      throw new ForbiddenException('You can only view your own children.');
    }
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
  async findOne(@Param('id') id: string, @Req() req: any) {
    await this.assertCanViewUser(req, id);
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.create(createUserDto, adminId);
  }

  @Post(':id/change-password')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordDto,
    @Req() req: any,
  ) {
    this.assertSelf(req, id);
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword).then(async (result) => {
      await this.usersService.notifyParentsOfPasswordChange(id, 'CHANGED');
      return result;
    });
  }

  @Post(':id/force-change-password')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  forceChangePassword(
    @Param('id') id: string,
    @Body() body: NewPasswordDto,
    @Req() req: any,
  ) {
    this.assertSelf(req, id);
    return this.usersService.forceChangePassword(id, body.newPassword).then(async (result) => {
      await this.usersService.notifyParentsOfPasswordChange(id, 'CHANGED');
      return result;
    });
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
  remove(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.usersService.remove(id, adminId);
  }
}