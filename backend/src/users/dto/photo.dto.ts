import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PhotoDto {
  // A base64 JPEG (the browser resizes it first). About 400 KB of image is roughly 550,000 characters.
  @IsString()
  @IsNotEmpty()
  @MaxLength(700000)
  image: string;
}