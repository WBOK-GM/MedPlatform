import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

export enum AuthProviderColumn {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

@Entity('credentials')
export class CredentialOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: AuthProviderColumn, default: AuthProviderColumn.LOCAL })
  provider: AuthProviderColumn;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  refreshToken: string;
}
