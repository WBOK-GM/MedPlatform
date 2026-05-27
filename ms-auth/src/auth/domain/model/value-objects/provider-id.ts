export class ProviderId {
  private constructor(public readonly value: string) {}

  static of(value: string): ProviderId {
    if (!value || value.trim().length === 0) {
      throw new Error('ProviderId cannot be empty');
    }
    return new ProviderId(value.trim());
  }

  equals(other: ProviderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
