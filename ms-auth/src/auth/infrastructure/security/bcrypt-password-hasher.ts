import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HashedPassword } from '../../domain/model/value-objects/hashed-password';
import { PasswordHasher } from '../../domain/ports/out/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<HashedPassword> {
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(plain, salt);
    return HashedPassword.fromHash(hashed);
  }

  async compare(plain: string, hashed: HashedPassword): Promise<boolean> {
    return bcrypt.compare(plain, hashed.value);
  }
}
