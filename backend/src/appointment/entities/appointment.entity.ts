import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Symptom } from 'src/symptom/entities/symptom.entity';
import { Prescription } from 'src/prescription/entities/prescription.entity';

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

  @Column({ nullable: true })
  secretaryId: number;

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
}