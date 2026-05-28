import { RegisterUserCommand } from '../../../application/commands/register-user.command';
import { UserView } from '../../../application/views/user.view';

export const REGISTER_USER_USE_CASE = Symbol('REGISTER_USER_USE_CASE');

export interface RegisterUserUseCase {
  register(command: RegisterUserCommand): Promise<UserView>;
}
