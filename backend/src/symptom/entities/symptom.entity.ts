import { Appointment } from 'src/appointment/entities/appointment.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';


@Entity('symptoms')
export class Symptom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column()
  description: string;

  @Column()
  intensity: number;

  @Column()
  patientId: number;

  @Column({ nullable: true })
  appointmentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}