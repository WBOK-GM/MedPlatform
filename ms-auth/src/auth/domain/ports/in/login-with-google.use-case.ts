import { LoginWithGoogleCommand } from '../../../application/commands/login-with-google.command';
import { AuthTokenView } from '../../../application/views/auth-token.view';

export const LOGIN_WITH_GOOGLE_USE_CASE = Symbol('LOGIN_WITH_GOOGLE_USE_CASE');

export interface LoginWithGoogleUseCase {
  loginWithGoogle(command: LoginWithGoogleCommand): Promise<AuthTokenView>;
}
