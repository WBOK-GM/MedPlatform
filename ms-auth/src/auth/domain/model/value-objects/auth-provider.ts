export enum AuthProviderValue {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

export class AuthProvider {
  private constructor(public readonly value: AuthProviderValue) {}

  static of(value: string | AuthProviderValue): AuthProvider {
    if (!Object.values(AuthProviderValue).includes(value as AuthProviderValue)) {
      throw new Error(`Invalid auth provider: ${value}`);
    }
    return new AuthProvider(value as AuthProviderValue);
  }

  static local(): AuthProvider {
    return new AuthProvider(AuthProviderValue.LOCAL);
  }

  static google(): AuthProvider {
    return new AuthProvider(AuthProviderValue.GOOGLE);
  }

  isLocal(): boolean {
    return this.value === AuthProviderValue.LOCAL;
  }

  isGoogle(): boolean {
    return this.value === AuthProviderValue.GOOGLE;
  }

  equals(other: AuthProvider): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
