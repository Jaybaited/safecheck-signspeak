import {
  IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString,
  ValidateNested, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentAudience, AssessmentType, GradeLevel, QuestionType } from '@prisma/client';

export class CreateAssessmentQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  wordId?: string;

  @IsOptional()
  choices?: Record<string, any>;

  @IsString()
  @IsOptional()
  correctAnswer?: string;
}

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsEnum(AssessmentAudience)
  audience: AssessmentAudience;

  @IsEnum(AssessmentType)
  type: AssessmentType;

  @IsEnum(GradeLevel)
  @IsOptional()
  gradeLevel?: GradeLevel;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentQuestionDto)
  questions: CreateAssessmentQuestionDto[];
}