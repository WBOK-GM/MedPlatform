import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, Param } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new PATIENT (US-001)' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with credentials (US-002)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Internal: Fetch user details for UI mapping' })
  async getUser(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('validate-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Internal: Validate token and get user profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}
