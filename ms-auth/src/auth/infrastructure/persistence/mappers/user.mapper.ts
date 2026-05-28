import { User } from '../../../domain/model/user';
import {
  CredentialOrmEntity,
  AuthProviderColumn,
} from '../entities/credential.orm-entity';
import { UserOrmEntity, UserRoleColumn } from '../entities/user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.rehydrate({
      id: orm.id,
      email: orm.email,
      role: orm.role,
      phone: orm.phone ?? null,
      isActive: orm.isActive,
      credentials: (orm.credentials ?? []).map((c) => ({
        id: c.id,
        provider: c.provider,
        providerId: c.providerId ?? null,
        passwordHash: c.passwordHash ?? null,
        refreshToken: c.refreshToken ?? null,
      })),
    });
  }

  static toOrm(user: User, existing?: UserOrmEntity): UserOrmEntity {
    const snap = user.toSnapshot();
    const entity = existing ?? new UserOrmEntity();
    entity.id = snap.id;
    entity.email = snap.email;
    entity.role = snap.role as UserRoleColumn;
    entity.phone = snap.phone ?? null;
    entity.isActive = snap.isActive;
    const existingCreds = new Map(
      (existing?.credentials ?? []).map((c) => [c.id, c]),
    );
    entity.credentials = snap.credentials.map((c) => {
      const cred = existingCreds.get(c.id) ?? new CredentialOrmEntity();
      cred.id = c.id;
      cred.userId = snap.id;
      cred.provider = c.provider as AuthProviderColumn;
      cred.providerId = c.providerId ?? null;
      cred.passwordHash = c.passwordHash ?? null;
      cred.refreshToken = c.refreshToken ?? null;
      return cred;
    });
    return entity;
  }
}
