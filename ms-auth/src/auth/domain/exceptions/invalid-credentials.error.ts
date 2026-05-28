import { DomainException } from '../../../shared/domain.exception';

export class InvalidCredentialsError extends DomainException {
  constructor() {
    super('Credenciales inválidas');
  }
}
