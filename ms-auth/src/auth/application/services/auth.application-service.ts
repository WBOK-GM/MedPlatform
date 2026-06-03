import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/model/user';
import { Email } from '../../domain/model/value-objects/email';
import { ProviderId } from '../../domain/model/value-objects/provider-id';
import { UserId } from '../../domain/model/value-objects/user-id';
import { UserRole } from '../../domain/model/value-objects/user-role';
import { EmailAlreadyTakenError } from '../../domain/exceptions/email-already-taken.error';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { UserNotFoundError } from '../../domain/exceptions/user-not-found.error';
import { GetUserByIdUseCase } from '../../domain/ports/in/get-user-by-id.use-case';
import { LoginUseCase } from '../../domain/ports/in/login.use-case';
import { LoginWithGoogleUseCase } from '../../domain/ports/in/login-with-google.use-case';
import { RegisterUserUseCase } from '../../domain/ports/in/register-user.use-case';
import {
  EVENT_PUBLISHER,
  EventPublisher,
} from '../../domain/ports/out/event-publisher';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/ports/out/password-hasher';
import {
  TOKEN_SIGNER,
  TokenSigner,
} from '../../domain/ports/out/token-signer';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/out/user.repository';
import { LoginCommand } from '../commands/login.command';
import { LoginWithGoogleCommand } from '../commands/login-with-google.command';
import { RegisterUserCommand } from '../commands/register-user.command';
import { AuthTokenView } from '../views/auth-token.view';
import { UserView } from '../views/user.view';

@Injectable()
export class AuthApplicationService
  implements
    RegisterUserUseCase,
    LoginUseCase,
    LoginWithGoogleUseCase,
    GetUserByIdUseCase
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SIGNER) private readonly tokens: TokenSigner,
    @Inject(EVENT_PUBLISHER) private readonly publisher: EventPublisher,
  ) {}

  async register(command: RegisterUserCommand): Promise<UserView> {
    const email = Email.of(command.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyTakenError(email.value);
    }
    const role = command.role ? UserRole.of(command.role) : UserRole.patient();
    const hash = await this.hasher.hash(command.password);
    const user = User.register(email, role, hash);
    const saved = await this.users.save(user);
    await this.publisher.publishAll(user.pullEvents());
    return UserView.fromAggregate(saved);
  }

  async login(command: LoginCommand): Promise<AuthTokenView> {
    const email = Email.of(command.email);
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    await user.authenticateLocal(command.password, this.hasher);
    await this.publisher.publishAll(user.pullEvents());
    const token = this.tokens.signAccessToken(user);
    return new AuthTokenView(token, UserView.fromAggregate(user));
  }

  async loginWithGoogle(
    command: LoginWithGoogleCommand,
  ): Promise<AuthTokenView> {
    const email = Email.of(command.email);
    const providerId = ProviderId.of(command.googleId);
    let user = await this.users.findByEmail(email);
    if (!user) {
      user = User.registerWithGoogle(email, UserRole.patient(), providerId);
    } else {
      user.linkGoogle(providerId);
    }
    const saved = await this.users.save(user);
    await this.publisher.publishAll(user.pullEvents());
    const token = this.tokens.signAccessToken(saved);
    return new AuthTokenView(token, UserView.fromAggregate(saved));
  }

  async getById(id: string): Promise<UserView> {
    const userId = UserId.of(id);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return UserView.fromAggregate(user);
  }
}
