import { randomUUID } from 'crypto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserId {
  private constructor(public readonly value: string) {}

  static of(value: string): UserId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid UserId: ${value}`);
    }
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
