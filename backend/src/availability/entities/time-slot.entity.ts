import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Availability } from './availability.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';

@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  availabilityId: number;

  @Column({ type: 'int' })
medecinId: number;

  @Column({ type: 'date' })
  date: string;

  
  @Column({ type: 'time' })
  startTime: string; // "09:00"

  @Column({ type: 'time' })
  endTime: string; // "09:20"

  @Column({
    type: 'enum',
    enum: ['disponible', 'occupé'],
    default: 'disponible',
  })
  status: 'disponible' | 'occupé';

  @Column({ nullable: true })
patientId?: number;

@Column({ nullable: true })
appointmentId?: number;

  // Relations
  @ManyToOne(() => Availability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'availabilityId' })
  availability: Availability;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'medecinId' })
  medecin: User;

  @ManyToOne(() => User, { nullable: true, eager: true }) // eager pour charger le nom du patient direct
  @JoinColumn({ name: 'patientId' })
  patient?: User;

  

  // AJOUTE CETTE RELATION (si elle n’existe pas encore)
  @ManyToOne(() => Appointment, (appointment) => appointment.timeSlot, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment?: Appointment;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}