import { Prescription } from './Prescription';
import { Symptom } from './symptom';
import { User } from './user';


export interface Appointment {
  id?: number;
  patientId: number;
  medecinId: number;
  date: string;
  time: string;
  appointmentStatus: 'en_attente' | 'approuvé' | 'annulé';
  consultationStatus: 'en_cours' | 'terminée' | null;
  patientName?: string;
  doctorName?: string;
  secretaryId?: number;
  symptoms?: Symptom[];
  prescriptions?: Prescription[];
}