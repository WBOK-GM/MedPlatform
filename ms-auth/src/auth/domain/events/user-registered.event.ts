import { DomainEvent } from '../../../shared/domain-event';

export class UserRegistered extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
  ) {
    super();
  }

  eventName(): string {
    return 'user.registered';
  }
}
