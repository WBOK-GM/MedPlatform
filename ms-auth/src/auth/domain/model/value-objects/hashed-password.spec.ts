import { HashedPassword } from './hashed-password';

describe('HashedPassword', () => {
  it('acepta un hash con longitud suficiente', () => {
    const hp = HashedPassword.fromHash('a'.repeat(20));
    expect(hp.value).toBe('a'.repeat(20));
  });

  it('rechaza hashes vacíos o muy cortos', () => {
    expect(() => HashedPassword.fromHash('')).toThrow();
    expect(() => HashedPassword.fromHash('short')).toThrow();
  });

  it('no expone el valor en toString', () => {
    const hp = HashedPassword.fromHash('a'.repeat(30));
    expect(hp.toString()).toBe('[REDACTED]');
    expect(`${hp}`).not.toContain('a');
  });
});
