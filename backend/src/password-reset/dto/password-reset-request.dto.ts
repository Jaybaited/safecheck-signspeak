import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;
}

export class ResolvePasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: 'Request ID is required' })
  requestId: string;

  @IsIn(['approve', 'reject'], { message: 'action must be "approve" or "reject"' })
  action: 'approve' | 'reject';
}