import {
  IsDateString, IsEnum, IsOptional, IsString, IsNumberString,
} from 'class-validator';

export enum AttendanceStatus {
  PRESENT       = 'PRESENT',
  LATE          = 'LATE',
  ABSENT        = 'ABSENT',
  UNCONFIRMED_OUT = 'UNCONFIRMED_OUT',
}

export class AttendanceQueryDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  /** Single exact date — ISO format e.g. 2026-05-19 */
  @IsDateString()
  @IsOptional()
  date?: string;

  /** Range start — inclusive */
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  /** Range end — inclusive */
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsEnum(AttendanceStatus, { message: 'status must be PRESENT, LATE, ABSENT, or UNCONFIRMED_OUT' })
  @IsOptional()
  status?: AttendanceStatus;

  /** Grade level filter e.g. GRADE_7 */
  @IsString()
  @IsOptional()
  gradeLevel?: string;

  /** Page number — default 1 */
  @IsNumberString()
  @IsOptional()
  page?: string;

  /** Items per page — default 20 */
  @IsNumberString()
  @IsOptional()
  limit?: string;
}