import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GradeLevel } from './create-user.dto';

export enum ArchiveStatusDto {
  GRADUATED       = 'GRADUATED',
  TRANSFERRED_OUT = 'TRANSFERRED_OUT',
  DROPPED_OUT     = 'DROPPED_OUT',
  OTHER           = 'OTHER',
}

export class ArchiveStudentDto {
  @IsEnum(ArchiveStatusDto, { message: 'Choose a valid archive status.' })
  status: ArchiveStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'The note can be at most 300 characters.' })
  note?: string;
}

export class RestoreStudentDto {
  @IsEnum(GradeLevel, { message: 'Choose a grade level for the restored student.' })
  gradeLevel: GradeLevel;
}