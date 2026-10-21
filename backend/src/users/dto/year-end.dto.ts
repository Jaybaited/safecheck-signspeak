import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class YearEndDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(700)
  @IsString({ each: true })
  studentIds: string[];

  @IsIn(['PROMOTE', 'GRADUATE'])
  action: 'PROMOTE' | 'GRADUATE';
}