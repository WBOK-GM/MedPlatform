import { DomainEvent } from '../../../shared/domain-event';

export class CredentialAdded extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly provider: string,
    public readonly providerId: string | null,
  ) {
    super();
  }

  eventName(): string {
    return 'auth.credential-added';
  }
}
