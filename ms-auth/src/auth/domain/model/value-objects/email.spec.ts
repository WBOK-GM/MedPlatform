import { Email } from './email';

describe('Email', () => {
  it('acepta emails válidos y los normaliza a lowercase', () => {
    const email = Email.of('User@Example.COM');
    expect(email.value).toBe('user@example.com');
  });

  it('rechaza email vacío', () => {
    expect(() => Email.of('')).toThrow();
  });

  it('rechaza formato inválido', () => {
    expect(() => Email.of('not-an-email')).toThrow();
    expect(() => Email.of('foo@')).toThrow();
    expect(() => Email.of('@bar.com')).toThrow();
  });

  it('equals compara por valor normalizado', () => {
    expect(Email.of('a@b.com').equals(Email.of('A@B.com'))).toBe(true);
    expect(Email.of('a@b.com').equals(Email.of('c@b.com'))).toBe(false);
  });
});
