import { DomainException } from '../../../shared/domain.exception';

export class UserNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(`Usuario no encontrado: ${identifier}`);
  }
}
