import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super({ message, error: 'NOT_FOUND' }, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super({ message, error: 'DUPLICATE_RESOURCE' }, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super({ message: 'Invalid email or password', error: 'INVALID_CREDENTIALS' }, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountNotVerifiedException extends HttpException {
  constructor() {
    super({ message: 'Please verify your email before logging in', error: 'EMAIL_NOT_VERIFIED' }, HttpStatus.FORBIDDEN);
  }
}

export class AccountDisabledException extends HttpException {
  constructor(message = 'Your account has been disabled') {
    super({ message, error: 'ACCOUNT_DISABLED' }, HttpStatus.FORBIDDEN);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(detail = 'Token is invalid or has expired') {
    super({ message: detail, error: 'INVALID_TOKEN' }, HttpStatus.UNAUTHORIZED);
  }
}

export class TwoFactorRequiredException extends HttpException {
  constructor() {
    super({ message: 'Two-factor authentication is required', error: 'TWO_FA_REQUIRED' }, HttpStatus.FORBIDDEN);
  }
}

export class InsufficientXpException extends HttpException {
  constructor() {
    super({ message: 'Insufficient XP for this action', error: 'INSUFFICIENT_XP' }, HttpStatus.BAD_REQUEST);
  }
}
