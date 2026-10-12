import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RfidTapDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;

  @IsOptional()
  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  mode?: 'CHECK_IN' | 'CHECK_OUT';
}
