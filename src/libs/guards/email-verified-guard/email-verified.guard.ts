import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessUserAuth } from '@/libs/types';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const auth = request.user;

    if (!auth) {
      return true; // Let other guards handle auth
    }

    if (!auth.user.emailVerifiedAt) {
      throw new CustomException({
        message: 'Email verification required',
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCode.EMAIL_NOT_VERIFIED,
      });
    }

    return true;
  }
}
