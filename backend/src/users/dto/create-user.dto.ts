/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum GradeLevel {
  GRADE_1 = 'GRADE_1',
  GRADE_2 = 'GRADE_2',
  GRADE_3 = 'GRADE_3',
  GRADE_4 = 'GRADE_4',
  GRADE_5 = 'GRADE_5',
  GRADE_6 = 'GRADE_6',
  GRADE_7 = 'GRADE_7',
  GRADE_8 = 'GRADE_8',
  GRADE_9 = 'GRADE_9',
  GRADE_10 = 'GRADE_10',
  GRADE_11 = 'GRADE_11',
  GRADE_12 = 'GRADE_12',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  // Password is now optional — backend generates it if not provided
  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, TEACHER, STUDENT, or PARENT' })
  role: Role;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-'.]+$/, {
    message: 'First name can only contain letters, spaces, hyphens, apostrophes, and periods',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-'.]+$/, {
    message: 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods',
  })
  lastName: string;

  @IsEnum(GradeLevel, { message: 'Invalid grade level' })
  @IsOptional()
  gradeLevel?: GradeLevel;

  @IsString()
  @IsOptional()
  rfidCard?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}