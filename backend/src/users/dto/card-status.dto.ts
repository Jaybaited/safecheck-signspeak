import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CardStatusDto {
  @IsIn(['LOST', 'SUSPEND', 'REACTIVATE'])
  action: 'LOST' | 'SUSPEND' | 'REACTIVATE';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}