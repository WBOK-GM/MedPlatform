import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new PATIENT (US-001)' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUser.register(
      new RegisterUserCommand(dto.email, dto.password, dto.name, dto.role),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with credentials (US-002)' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.login(new LoginCommand(dto.email, dto.password));
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Internal: Fetch user details for UI mapping' })
  async getUser(@Param('id') id: string) {
    return this.getUserById.getById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('validate-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Internal: Validate token and get user profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}
