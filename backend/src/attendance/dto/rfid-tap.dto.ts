import { IsString, IsNotEmpty } from 'class-validator';

export class RfidTapDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;
}
