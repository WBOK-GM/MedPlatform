import { User } from '../../domain/model/user';

export class UserView {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: string,
  ) {}

  static fromAggregate(user: User): UserView {
    return new UserView(user.id.value, user.email.value, user.role.value);
  }
}
