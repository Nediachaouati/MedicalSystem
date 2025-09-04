import { Symptom } from 'src/symptom/entities/symptom.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  medecinId: number;

  @Column({ nullable: true })
  secretaryId: number;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column()
  status: 'en_attente' | 'confirmé' | 'refusé';

  @Column()
  patientName: string;

  @Column()
  doctorName: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'medecinId' })
  medecin: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'secretaryId' })
  secretary: User;

  @OneToMany(() => Symptom, (symptom) => symptom.appointment)
  symptoms: Symptom[];
}