import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ReviewAttemptDto {
  /** Optional override of the automatic score (0 to 100). */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;
}