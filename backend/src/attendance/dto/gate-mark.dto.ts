import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GateMarkDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  action: 'CHECK_IN' | 'CHECK_OUT';

  @IsIn(['FORGOT_CARD', 'CARD_LOST', 'CARD_NOT_WORKING', 'OTHER'])
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}