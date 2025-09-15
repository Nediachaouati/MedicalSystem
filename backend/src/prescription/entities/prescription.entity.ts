import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';


@Entity()
export class Prescription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  appointmentId: number;

  @Column()
  medication: string;

  @Column()
  dosage: string;

  @Column()
  duration: string;

  @Column({ nullable: true })
  additionalNotes: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.prescriptions)
  appointment: Appointment;

  @Column()
  createdAt: Date;
}