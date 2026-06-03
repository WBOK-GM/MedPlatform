import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthApplicationService } from './application/services/auth.application-service';
import { GET_USER_BY_ID_USE_CASE } from './domain/ports/in/get-user-by-id.use-case';
import { LOGIN_USE_CASE } from './domain/ports/in/login.use-case';
import { REGISTER_USER_USE_CASE } from './domain/ports/in/register-user.use-case';
import { EVENT_PUBLISHER } from './domain/ports/out/event-publisher';
import { PASSWORD_HASHER } from './domain/ports/out/password-hasher';
import { TOKEN_SIGNER } from './domain/ports/out/token-signer';
import { USER_REPOSITORY } from './domain/ports/out/user.repository';
import { AuthController } from './infrastructure/http/auth.controller';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';
import { JwtStrategy } from './infrastructure/http/strategies/jwt.strategy';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event-publisher';
import { CredentialOrmEntity } from './infrastructure/persistence/entities/credential.orm-entity';
import { UserOrmEntity } from './infrastructure/persistence/entities/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { NestJwtTokenSigner } from './infrastructure/security/nest-jwt-token-signer';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, CredentialOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'super_secret_default_key_mvp',
        ),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthApplicationService,
    JwtStrategy,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SIGNER, useClass: NestJwtTokenSigner },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: REGISTER_USER_USE_CASE, useExisting: AuthApplicationService },
    { provide: LOGIN_USE_CASE, useExisting: AuthApplicationService },
    { provide: GET_USER_BY_ID_USE_CASE, useExisting: AuthApplicationService },
  ],
})
export class AuthModule {}
