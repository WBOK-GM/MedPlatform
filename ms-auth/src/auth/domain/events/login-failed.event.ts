import { DomainEvent } from '../../../shared/domain-event';

export class LoginFailed extends DomainEvent {
  constructor(
    public readonly email: string,
    public readonly reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'NO_LOCAL_CREDENTIAL',
  ) {
    super();
  }

  eventName(): string {
    return 'auth.login-failed';
  }
}
