import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { Credential, AuthProvider } from '../users/entities/credential.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const user = this.usersRepository.create({
      email: registerDto.email,
      role: registerDto.role || UserRole.PATIENT, 
    });

    const savedUser = await this.usersRepository.save(user);

    const credential = this.credentialsRepository.create({
      user: savedUser,
      provider: AuthProvider.LOCAL,
      passwordHash: hashedPassword,
    });

    await this.credentialsRepository.save(credential);

    // TODO: Emit event to ms-doctor or ms-notification if needed.
    return { id: savedUser.id, email: savedUser.email, role: savedUser.role };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const credential = await this.credentialsRepository.findOne({
      where: { userId: user.id, provider: AuthProvider.LOCAL },
    });

    if (!credential || !credential.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, credential.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, role: user.role };
  }
}
