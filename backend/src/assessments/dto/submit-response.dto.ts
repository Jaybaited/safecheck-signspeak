import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitResponseDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  submittedSign?: string;
}