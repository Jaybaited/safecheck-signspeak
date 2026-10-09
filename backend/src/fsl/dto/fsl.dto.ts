import {
  ArrayMaxSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';

export class RecordSignDto {
  @IsString()
  @MaxLength(40)
  word!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsOptional()
  @IsIn(['PRACTICE', 'GAME'])
  source?: 'PRACTICE' | 'GAME';
}

export class RecordGameDto {
  @IsIn(['SPEED', 'STREAK'])
  mode!: 'SPEED' | 'STREAK';

  @IsInt()
  @Min(0)
  @Max(1000000)
  score!: number;

  @IsInt()
  @Min(0)
  @Max(1000)
  lettersCount!: number;
}

export class ImportProgressDto {
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  letters!: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  highScore?: number;
}