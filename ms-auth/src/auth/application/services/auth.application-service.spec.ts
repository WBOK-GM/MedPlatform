import { User } from '../../domain/model/user';
import { Email } from '../../domain/model/value-objects/email';
import { HashedPassword } from '../../domain/model/value-objects/hashed-password';
import { UserId } from '../../domain/model/value-objects/user-id';
import { EmailAlreadyTakenError } from '../../domain/exceptions/email-already-taken.error';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { UserNotFoundError } from '../../domain/exceptions/user-not-found.error';
import { EventPublisher } from '../../domain/ports/out/event-publisher';
import { PasswordHasher } from '../../domain/ports/out/password-hasher';
import { TokenSigner } from '../../domain/ports/out/token-signer';
import { UserRepository } from '../../domain/ports/out/user.repository';
import { DomainEvent } from '../../../shared/domain-event';
import { LoginCommand } from '../commands/login.command';
import { RegisterUserCommand } from '../commands/register-user.command';
import { AuthApplicationService } from './auth.application-service';

class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.value) ?? null;
  }
  async findByEmail(email: Email): Promise<User | null> {
    for (const u of this.store.values()) {
      if (u.email.equals(email)) return u;
    }
    return null;
  }
  async save(user: User): Promise<User> {
    this.store.set(user.id.value, user);
    return user;
  }
}

class FakeHasher implements PasswordHasher {
  constructor(private readonly matches: boolean = true) {}
  async hash(_plain: string): Promise<HashedPassword> {
    return HashedPassword.fromHash('x'.repeat(20));
  }
  async compare(_plain: string, _hashed: HashedPassword): Promise<boolean> {
    return this.matches;
  }
}

class FakeSigner implements TokenSigner {
  signAccessToken(user: User): string {
    return `token-for-${user.id.value}`;
  }
}

class CollectingPublisher implements EventPublisher {
  events: DomainEvent[] = [];
  async publishAll(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

const buildService = (overrides?: {
  matches?: boolean;
  seed?: (repo: InMemoryUserRepository) => Promise<void>;
}) => {
  const repo = new InMemoryUserRepository();
  const hasher = new FakeHasher(overrides?.matches ?? true);
  const signer = new FakeSigner();
  const publisher = new CollectingPublisher();
  const service = new AuthApplicationService(repo, hasher, signer, publisher);
  return { service, repo, publisher };
};

describe('AuthApplicationService', () => {
  describe('register', () => {
    it('persiste un nuevo usuario y publica UserRegistered', async () => {
      const { service, publisher } = buildService();
      const view = await service.register(
        new RegisterUserCommand('foo@bar.com', 'secret123', 'Foo', 'PATIENT'),
      );
      expect(view.email).toBe('foo@bar.com');
      expect(view.role).toBe('PATIENT');
      expect(publisher.events.map((e) => e.eventName())).toContain(
        'user.registered',
      );
    });

    it('lanza EmailAlreadyTakenError si el email ya existe', async () => {
      const { service } = buildService();
      await service.register(
        new RegisterUserCommand('foo@bar.com', 'secret123', 'Foo'),
      );
      await expect(
        service.register(
          new RegisterUserCommand('foo@bar.com', 'other', 'Other'),
        ),
      ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
    });
  });

  describe('login', () => {
    it('retorna access_token y user view cuando las credenciales son válidas', async () => {
      const { service } = buildService({ matches: true });
      await service.register(
        new RegisterUserCommand('jane@doe.com', 'secret123', 'Jane'),
      );
      const result = await service.login(
        new LoginCommand('jane@doe.com', 'secret123'),
      );
      expect(result.access_token).toContain('token-for-');
      expect(result.user.email).toBe('jane@doe.com');
    });

    it('rechaza con InvalidCredentialsError si la password no coincide', async () => {
      const { service } = buildService({ matches: false });
      await service.register(
        new RegisterUserCommand('jane@doe.com', 'secret123', 'Jane'),
      );
      await expect(
        service.login(new LoginCommand('jane@doe.com', 'wrong')),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('rechaza con InvalidCredentialsError si el usuario no existe', async () => {
      const { service } = buildService();
      await expect(
        service.login(new LoginCommand('ghost@nowhere.com', 'secret123')),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe('getById', () => {
    it('retorna el UserView del usuario existente', async () => {
      const { service } = buildService();
      const registered = await service.register(
        new RegisterUserCommand('jane@doe.com', 'secret123', 'Jane'),
      );
      const view = await service.getById(registered.id);
      expect(view.email).toBe('jane@doe.com');
    });

    it('lanza UserNotFoundError si no existe', async () => {
      const { service } = buildService();
      await expect(
        service.getById('11111111-1111-1111-1111-111111111111'),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });
});
