import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/model/user';
import { Email } from '../../domain/model/value-objects/email';
import { UserId } from '../../domain/model/value-objects/user-id';
import { UserRepository } from '../../domain/ports/out/user.repository';
import { UserOrmEntity } from './entities/user.orm-entity';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const found = await this.repo.findOne({
      where: { id: id.value },
      relations: ['credentials'],
    });
    return found ? UserMapper.toDomain(found) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const found = await this.repo.findOne({
      where: { email: email.value },
      relations: ['credentials'],
    });
    return found ? UserMapper.toDomain(found) : null;
  }

  async save(user: User): Promise<User> {
    const existing =
      (await this.repo.findOne({
        where: { id: user.id.value },
        relations: ['credentials'],
      })) ?? undefined;
    const entity = UserMapper.toOrm(user, existing);
    const saved = await this.repo.save(entity);
    return UserMapper.toDomain(saved);
  }
}
