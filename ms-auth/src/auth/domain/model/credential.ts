import { randomUUID } from 'crypto';
import { AuthProvider } from './value-objects/auth-provider';
import { HashedPassword } from './value-objects/hashed-password';
import { ProviderId } from './value-objects/provider-id';

export interface CredentialSnapshot {
  id: string;
  provider: string;
  providerId: string | null;
  passwordHash: string | null;
  refreshToken: string | null;
}

export class Credential {
  private constructor(
    public readonly id: string,
    public readonly provider: AuthProvider,
    public readonly providerId: ProviderId | null,
    public readonly passwordHash: HashedPassword | null,
    public readonly refreshToken: string | null,
  ) {}

  static local(hash: HashedPassword, id?: string): Credential {
    return new Credential(id ?? randomUUID(), AuthProvider.local(), null, hash, null);
  }

  static google(providerId: ProviderId, id?: string): Credential {
    return new Credential(
      id ?? randomUUID(),
      AuthProvider.google(),
      providerId,
      null,
      null,
    );
  }

  static rehydrate(snapshot: CredentialSnapshot): Credential {
    return new Credential(
      snapshot.id,
      AuthProvider.of(snapshot.provider),
      snapshot.providerId ? ProviderId.of(snapshot.providerId) : null,
      snapshot.passwordHash ? HashedPassword.fromHash(snapshot.passwordHash) : null,
      snapshot.refreshToken,
    );
  }

  isLocal(): boolean {
    return this.provider.isLocal();
  }

  toSnapshot(): CredentialSnapshot {
    return {
      id: this.id,
      provider: this.provider.value,
      providerId: this.providerId?.value ?? null,
      passwordHash: this.passwordHash?.value ?? null,
      refreshToken: this.refreshToken,
    };
  }
}
