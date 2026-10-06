import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString,
  Max, MaxLength, Min, ValidateNested,
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
  @MaxLength(500)
  captionUrl?: string;

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

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  level?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passMark?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  lessonVideoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  lessonDescription?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentQuestionDto)
  questions: CreateAssessmentQuestionDto[];
}