import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  GET_USER_BY_ID_USE_CASE,
  GetUserByIdUseCase,
} from '../../../domain/ports/in/get-user-by-id.use-case';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(GET_USER_BY_ID_USE_CASE)
    private readonly getUserById: GetUserByIdUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'super_secret_default_key_mvp',
      ),
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    try {
      const view = await this.getUserById.getById(payload.sub);
      return { userId: view.id, email: view.email, role: view.role };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
