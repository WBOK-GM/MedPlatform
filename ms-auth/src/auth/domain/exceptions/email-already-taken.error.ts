import { DomainException } from '../../../shared/domain.exception';

export class EmailAlreadyTakenError extends DomainException {
  constructor(email: string) {
    super(`El email ya está registrado: ${email}`);
  }
}
