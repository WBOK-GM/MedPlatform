export class HashedPassword {
  private constructor(private readonly hash: string) {}

  static fromHash(hash: string): HashedPassword {
    if (!hash || hash.length < 10) {
      throw new Error('Invalid hashed password');
    }
    return new HashedPassword(hash);
  }

  get value(): string {
    return this.hash;
  }

  toString(): string {
    return '[REDACTED]';
  }
}
