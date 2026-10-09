import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FslService } from './fsl.service';
import { ImportProgressDto, RecordGameDto, RecordSignDto } from './dto/fsl.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { getAuthUser } from '../common/access.util';

@Controller('fsl')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FslController {
  constructor(private readonly fsl: FslService) {}

  @Get('words')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  words() {
    return this.fsl.listWords();
  }

  @Get('overview')
  @Roles('ADMIN', 'TEACHER')
  overview() {
    return this.fsl.overview();
  }

  @Get('progress/me')
  @Roles('STUDENT')
  myProgress(@Req() req: any) {
    return this.fsl.getProgress(getAuthUser(req).id);
  }

  @Get('progress/student/:studentId')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  studentProgress(@Param('studentId') studentId: string, @Req() req: any) {
    return this.fsl.getProgressFor(getAuthUser(req), studentId);
  }

  @Post('progress')
  @Roles('STUDENT')
  record(@Body() dto: RecordSignDto, @Req() req: any) {
    return this.fsl.recordSign(getAuthUser(req).id, dto);
  }

  @Post('games')
  @Roles('STUDENT')
  recordGame(@Body() dto: RecordGameDto, @Req() req: any) {
    return this.fsl.recordGame(getAuthUser(req).id, dto);
  }

  @Post('import')
  @Roles('STUDENT')
  importLocal(@Body() dto: ImportProgressDto, @Req() req: any) {
    return this.fsl.importLocal(getAuthUser(req).id, dto);
  }
}