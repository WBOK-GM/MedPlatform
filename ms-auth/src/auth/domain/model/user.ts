import { AggregateRoot } from '../../../shared/aggregate-root';
import { CredentialAdded } from '../events/credential-added.event';
import { LoginFailed } from '../events/login-failed.event';
import { LoginSucceeded } from '../events/login-succeeded.event';
import { UserRegistered } from '../events/user-registered.event';
import { InvalidCredentialsError } from '../exceptions/invalid-credentials.error';
import { PasswordHasher } from '../ports/out/password-hasher';
import { Credential, CredentialSnapshot } from './credential';
import { Email } from './value-objects/email';
import { HashedPassword } from './value-objects/hashed-password';
import { ProviderId } from './value-objects/provider-id';
import { UserId } from './value-objects/user-id';
import { UserRole } from './value-objects/user-role';

export interface UserSnapshot {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  credentials: CredentialSnapshot[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends AggregateRoot {
  private constructor(
    public readonly id: UserId,
    private _email: Email,
    private _role: UserRole,
    private _phone: string | null,
    private _isActive: boolean,
    private _credentials: Credential[],
  ) {
    super();
  }

  static register(email: Email, role: UserRole, hashed: HashedPassword): User {
    const id = UserId.generate();
    const credential = Credential.local(hashed);
    const user = new User(id, email, role, null, true, [credential]);
    user.record(new UserRegistered(id.value, email.value, role.value));
    return user;
  }

  static rehydrate(snapshot: UserSnapshot): User {
    return new User(
      UserId.of(snapshot.id),
      Email.of(snapshot.email),
      UserRole.of(snapshot.role),
      snapshot.phone,
      snapshot.isActive,
      snapshot.credentials.map((c) => Credential.rehydrate(c)),
    );
  }

  get email(): Email {
    return this._email;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get phone(): string | null {
    return this._phone;
  }

  get credentials(): readonly Credential[] {
    return this._credentials;
  }

  localCredential(): Credential | undefined {
    return this._credentials.find((c) => c.isLocal());
  }

  linkGoogle(providerId: ProviderId): void {
    if (this._credentials.some((c) => c.provider.isGoogle())) {
      return;
    }
    const credential = Credential.google(providerId);
    this._credentials.push(credential);
    this.record(new CredentialAdded(this.id.value, 'GOOGLE', providerId.value));
  }

  async authenticateLocal(rawPassword: string, hasher: PasswordHasher): Promise<void> {
    const local = this.localCredential();
    if (!local || !local.passwordHash) {
      this.record(new LoginFailed(this._email.value, 'NO_LOCAL_CREDENTIAL'));
      throw new InvalidCredentialsError();
    }
    const ok = await hasher.compare(rawPassword, local.passwordHash);
    if (!ok) {
      this.record(new LoginFailed(this._email.value, 'INVALID_PASSWORD'));
      throw new InvalidCredentialsError();
    }
    this.record(new LoginSucceeded(this.id.value, this._email.value));
  }

  toSnapshot(): UserSnapshot {
    return {
      id: this.id.value,
      email: this._email.value,
      role: this._role.value,
      phone: this._phone,
      isActive: this._isActive,
      credentials: this._credentials.map((c) => c.toSnapshot()),
    };
  }
}
