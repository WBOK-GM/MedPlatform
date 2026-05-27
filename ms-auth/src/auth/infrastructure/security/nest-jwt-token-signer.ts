import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/model/user';
import { TokenSigner } from '../../domain/ports/out/token-signer';

@Injectable()
export class NestJwtTokenSigner implements TokenSigner {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(user: User): string {
    return this.jwt.sign({
      sub: user.id.value,
      email: user.email.value,
      role: user.role.value,
    });
  }
}
