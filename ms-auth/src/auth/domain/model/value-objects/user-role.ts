export enum UserRoleValue {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

export class UserRole {
  private constructor(public readonly value: UserRoleValue) {}

  static of(value: string | UserRoleValue): UserRole {
    if (!Object.values(UserRoleValue).includes(value as UserRoleValue)) {
      throw new Error(`Invalid user role: ${value}`);
    }
    return new UserRole(value as UserRoleValue);
  }

  static patient(): UserRole {
    return new UserRole(UserRoleValue.PATIENT);
  }

  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
