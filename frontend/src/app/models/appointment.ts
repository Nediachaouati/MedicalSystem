import { Symptom } from './symptom';
import { User } from './user';

export interface Appointment {
  id?: number;
  patientId: number;
  medecinId: number;
  date: string;
  time: string;
  status?: 'en_attente' | 'confirmé' | 'refusé';
  patientName?: string;
  doctorName?: string;
  patient?: User;
  medecin?: User;
  symptoms?: Symptom[];
}