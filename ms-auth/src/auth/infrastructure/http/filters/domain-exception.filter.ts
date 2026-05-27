import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailAlreadyTakenError } from '../../../domain/exceptions/email-already-taken.error';
import { InvalidCredentialsError } from '../../../domain/exceptions/invalid-credentials.error';
import { UserNotFoundError } from '../../../domain/exceptions/user-not-found.error';
import { DomainException } from '../../../../shared/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  private statusFor(exception: DomainException): number {
    if (exception instanceof EmailAlreadyTakenError) return HttpStatus.CONFLICT;
    if (exception instanceof InvalidCredentialsError)
      return HttpStatus.UNAUTHORIZED;
    if (exception instanceof UserNotFoundError) return HttpStatus.NOT_FOUND;
    return HttpStatus.BAD_REQUEST;
  }
}
