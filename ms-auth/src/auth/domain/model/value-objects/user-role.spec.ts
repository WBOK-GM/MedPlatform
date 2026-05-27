import { UserRole, UserRoleValue } from './user-role';

describe('UserRole', () => {
  it('acepta cualquier valor del enum', () => {
    expect(UserRole.of('PATIENT').value).toBe(UserRoleValue.PATIENT);
    expect(UserRole.of('DOCTOR').value).toBe(UserRoleValue.DOCTOR);
    expect(UserRole.of('ADMINISTRATOR').value).toBe(UserRoleValue.ADMINISTRATOR);
  });

  it('rechaza valores fuera del enum', () => {
    expect(() => UserRole.of('SUPERUSER')).toThrow();
  });

  it('UserRole.patient() retorna PATIENT', () => {
    expect(UserRole.patient().value).toBe(UserRoleValue.PATIENT);
  });
});
