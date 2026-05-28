import { DomainEvent } from '../../../shared/domain-event';

export class LoginSucceeded extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  eventName(): string {
    return 'auth.login-succeeded';
  }
}
