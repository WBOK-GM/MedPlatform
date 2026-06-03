import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/model/user';

export class UserView {
  @ApiProperty({ description: 'Identificador único del usuario', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  public readonly id: string;

  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  public readonly email: string;

  @ApiProperty({ description: 'Rol del usuario: PATIENT, DOCTOR o ADMINISTRATOR', example: 'PATIENT' })
  public readonly role: string;

  constructor(id: string, email: string, role: string) {
    this.id = id;
    this.email = email;
    this.role = role;
  }

  static fromAggregate(user: User): UserView {
    return new UserView(user.id.value, user.email.value, user.role.value);
  }
}
