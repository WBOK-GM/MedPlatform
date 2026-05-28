import { UserView } from './user.view';

export class AuthTokenView {
  constructor(
    public readonly access_token: string,
    public readonly user: UserView,
  ) {}
}
