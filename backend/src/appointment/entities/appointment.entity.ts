import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Symptom } from 'src/symptom/entities/symptom.entity';
import { Prescription } from 'src/prescription/entities/prescription.entity';
import { TimeSlot } from 'src/availability/entities/time-slot.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  medecinId: number;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column({
    type: 'enum',
    enum: ['en_attente', 'approuvé', 'annulé'],
    default: 'en_attente',
  })
  appointmentStatus: 'en_attente' | 'approuvé' | 'annulé';

  @Column({
    type: 'enum',
    enum: ['en_cours', 'terminée'],
    nullable: true,
  })
  consultationStatus: 'en_cours' | 'terminée' | null;

  @Column({ nullable: true })
  patientName: string;

  @Column({ nullable: true })
  doctorName: string;

  @Column()
  secretaryId: number;

  @Column()
  timeSlotId: number;  

  @ManyToOne(() => User, { nullable: true })
  patient: User;

  @ManyToOne(() => User, { nullable: true })
  medecin: User;

  @ManyToOne(() => User, { nullable: true })
  secretary: User;

  @OneToMany(() => Symptom, (symptom) => symptom.appointment)
  symptoms: Symptom[];

  @OneToMany(() => Prescription, (prescription) => prescription.appointment)
  prescriptions: Prescription[];

  @ManyToOne(() => TimeSlot, { eager: true })
  @JoinColumn({ name: 'timeSlotId' })
  timeSlot: TimeSlot;

  @Column({ type: 'int', nullable: true })
  rating?: number; 

  @Column({ type: 'text', nullable: true })
  review?: string;
}