import { IsString, IsNotEmpty } from 'class-validator';

export class LinkChildDto {
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;
}
