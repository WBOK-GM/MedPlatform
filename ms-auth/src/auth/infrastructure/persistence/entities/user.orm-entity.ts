import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CredentialOrmEntity } from './credential.orm-entity';

export enum UserRoleColumn {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRoleColumn, default: UserRoleColumn.PATIENT })
  role: UserRoleColumn;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => CredentialOrmEntity, (c) => c.user, { cascade: true })
  credentials: CredentialOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
