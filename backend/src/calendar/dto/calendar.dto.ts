import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must look like 2026-12-25' })
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}