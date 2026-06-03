import { ApiProperty } from '@nestjs/swagger';
import { UserView } from './user.view';

export class AuthTokenView {
  @ApiProperty({ description: 'JWT de acceso. Incluirlo en el header Authorization: Bearer <token>', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  public readonly access_token: string;

  @ApiProperty({ description: 'Datos del usuario autenticado', type: () => UserView })
  public readonly user: UserView;

  constructor(access_token: string, user: UserView) {
    this.access_token = access_token;
    this.user = user;
  }
}
