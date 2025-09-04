import { Appointment } from "src/appointment/entities/appointment.entity";
import { Role } from "src/role.enum";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PATIENT,
  })
  role: Role;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  speciality?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ nullable: true })
  photo?: string;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointmentsAsPatient: Appointment[];

  @OneToMany(() => Appointment, (appointment) => appointment.medecin)
  appointmentsAsDoctor: Appointment[];

  @OneToMany(() => User, (user) => user.medecin)
  secretaries?: User[];

  @ManyToOne(() => User, (user) => user.secretaries)
  medecin?: User;

  @Column({ nullable: true })
  medecinId?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}