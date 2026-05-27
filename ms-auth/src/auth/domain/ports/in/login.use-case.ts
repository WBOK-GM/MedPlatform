import { LoginCommand } from '../../../application/commands/login.command';
import { AuthTokenView } from '../../../application/views/auth-token.view';

export const LOGIN_USE_CASE = Symbol('LOGIN_USE_CASE');

export interface LoginUseCase {
  login(command: LoginCommand): Promise<AuthTokenView>;
}
