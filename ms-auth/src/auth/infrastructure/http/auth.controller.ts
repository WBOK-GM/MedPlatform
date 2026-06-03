import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthTokenView } from '../../application/views/auth-token.view';
import { UserView } from '../../application/views/user.view';
import { LoginCommand } from '../../application/commands/login.command';
import { RegisterUserCommand } from '../../application/commands/register-user.command';
import {
  GET_USER_BY_ID_USE_CASE,
  GetUserByIdUseCase,
} from '../../domain/ports/in/get-user-by-id.use-case';
import {
  LOGIN_USE_CASE,
  LoginUseCase,
} from '../../domain/ports/in/login.use-case';
import {
  LOGIN_WITH_GOOGLE_USE_CASE,
  LoginWithGoogleUseCase,
} from '../../domain/ports/in/login-with-google.use-case';
import { LoginWithGoogleCommand } from '../../application/commands/login-with-google.command';
import {
  REGISTER_USER_USE_CASE,
  RegisterUserUseCase,
} from '../../domain/ports/in/register-user.use-case';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(REGISTER_USER_USE_CASE)
    private readonly registerUser: RegisterUserUseCase,
    @Inject(LOGIN_USE_CASE) private readonly loginUseCase: LoginUseCase,
    @Inject(GET_USER_BY_ID_USE_CASE)
    private readonly getUserById: GetUserByIdUseCase,
    @Inject(LOGIN_WITH_GOOGLE_USE_CASE)
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario paciente (US-001)',
    description: 'Crea una cuenta de usuario con rol PATIENT por defecto. Dispara el evento user.registered que envía email de bienvenida.',
  })
  @ApiCreatedResponse({ description: 'Usuario registrado exitosamente', type: UserView })
  async register(@Body() dto: RegisterDto) {
    return this.registerUser.register(
      new RegisterUserCommand(dto.email, dto.password, dto.name, dto.role),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión con credenciales (US-002)',
    description: 'Autentica al usuario y devuelve un JWT de acceso junto con los datos del perfil.',
  })
  @ApiOkResponse({ description: 'Credenciales válidas. Devuelve el token y datos del usuario', type: AuthTokenView })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.login(new LoginCommand(dto.email, dto.password));
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Iniciar sesión con Google (OAuth2)',
    description:
      'Redirige al usuario a la pantalla de consentimiento de Google. Tras autorizar, Google redirige a /auth/google/callback. Abrir esta URL en el navegador (no es una llamada AJAX).',
  })
  googleAuth(): void {
    // El guard 'google' inicia el flujo OAuth redirigiendo a Google.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthCallback(
    @Req() req: { user: { googleId: string; email: string; name?: string } },
    @Res() res: Response,
  ): Promise<void> {
    const token = await this.loginWithGoogle.loginWithGoogle(
      new LoginWithGoogleCommand(
        req.user.googleId,
        req.user.email,
        req.user.name,
      ),
    );
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const params = new URLSearchParams({
      token: token.access_token,
      role: token.user.role,
      email: token.user.email,
    });
    res.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Uso interno: recupera los datos de un usuario por su ID. Utilizado por otros microservicios para mapear información del perfil.',
  })
  @ApiParam({ name: 'id', description: 'UUID del usuario en ms-auth', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiOkResponse({ description: 'Datos del usuario', type: UserView })
  async getUser(@Param('id') id: string) {
    return this.getUserById.getById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('validate-token')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validar token JWT y obtener perfil',
    description: 'Uso interno: verifica el JWT del header Authorization y devuelve el payload decodificado con los datos del usuario autenticado.',
  })
  @ApiOkResponse({ description: 'Payload del token con datos del usuario autenticado' })
  getProfile(@Request() req) {
    return req.user;
  }
}
