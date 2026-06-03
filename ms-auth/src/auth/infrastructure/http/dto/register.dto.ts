import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoleValue } from '../../../domain/model/value-objects/user-role';

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del nuevo usuario', example: 'paciente@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', example: 'secret123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Ana García' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Rol del usuario. Por defecto PATIENT', enum: UserRoleValue, example: UserRoleValue.PATIENT })
  @IsOptional()
  @IsEnum(UserRoleValue)
  role?: UserRoleValue;
}
