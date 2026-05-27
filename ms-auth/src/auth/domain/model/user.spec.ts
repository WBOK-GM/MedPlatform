import { InvalidCredentialsError } from '../exceptions/invalid-credentials.error';
import { PasswordHasher } from '../ports/out/password-hasher';
import { User } from './user';
import { Email } from './value-objects/email';
import { HashedPassword } from './value-objects/hashed-password';
import { ProviderId } from './value-objects/provider-id';
import { UserRole } from './value-objects/user-role';

class FakeHasher implements PasswordHasher {
  constructor(private readonly truthy: boolean) {}
  async hash(_plain: string): Promise<HashedPassword> {
    return HashedPassword.fromHash('x'.repeat(20));
  }
  async compare(_plain: string, _hashed: HashedPassword): Promise<boolean> {
    return this.truthy;
  }
}

describe('User aggregate', () => {
  const email = Email.of('jane@doe.com');
  const role = UserRole.patient();
  const hash = HashedPassword.fromHash('h'.repeat(20));

  describe('register', () => {
    it('crea el agregado con credential LOCAL y emite UserRegistered', () => {
      const user = User.register(email, role, hash);
      expect(user.email.equals(email)).toBe(true);
      expect(user.role.equals(role)).toBe(true);
      expect(user.credentials).toHaveLength(1);
      expect(user.localCredential()).toBeDefined();

      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('user.registered');
    });

    it('pullEvents vacía la cola', () => {
      const user = User.register(email, role, hash);
      user.pullEvents();
      expect(user.pullEvents()).toHaveLength(0);
    });
  });

  describe('linkGoogle', () => {
    it('añade credential GOOGLE y emite CredentialAdded', () => {
      const user = User.register(email, role, hash);
      user.pullEvents();
      user.linkGoogle(ProviderId.of('google-123'));
      expect(user.credentials).toHaveLength(2);
      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('auth.credential-added');
    });

    it('no duplica credential GOOGLE si ya existe', () => {
      const user = User.register(email, role, hash);
      user.linkGoogle(ProviderId.of('google-123'));
      user.pullEvents();
      user.linkGoogle(ProviderId.of('google-999'));
      expect(user.credentials).toHaveLength(2);
      expect(user.pullEvents()).toHaveLength(0);
    });
  });

  describe('authenticateLocal', () => {
    it('emite LoginSucceeded cuando el hasher acepta la contraseña', async () => {
      const user = User.register(email, role, hash);
      user.pullEvents();
      await user.authenticateLocal('correct', new FakeHasher(true));
      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('auth.login-succeeded');
    });

    it('lanza InvalidCredentialsError y emite LoginFailed si la password no coincide', async () => {
      const user = User.register(email, role, hash);
      user.pullEvents();
      await expect(
        user.authenticateLocal('wrong', new FakeHasher(false)),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('auth.login-failed');
    });

    it('lanza InvalidCredentialsError si no hay credential LOCAL', async () => {
      const user = User.rehydrate({
        id: '11111111-1111-1111-1111-111111111111',
        email: email.value,
        role: role.value,
        phone: null,
        isActive: true,
        credentials: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            provider: 'GOOGLE',
            providerId: 'google-1',
            passwordHash: null,
            refreshToken: null,
          },
        ],
      });
      await expect(
        user.authenticateLocal('any', new FakeHasher(true)),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe('rehydrate/toSnapshot roundtrip', () => {
    it('preserva los datos del agregado', () => {
      const original = User.register(email, role, hash);
      const snap = original.toSnapshot();
      const rebuilt = User.rehydrate(snap);
      expect(rebuilt.email.value).toBe(snap.email);
      expect(rebuilt.role.value).toBe(snap.role);
      expect(rebuilt.credentials).toHaveLength(1);
      expect(rebuilt.localCredential()).toBeDefined();
    });
  });
});
