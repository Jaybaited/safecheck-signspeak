import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { id: string; username: string; role: string };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}