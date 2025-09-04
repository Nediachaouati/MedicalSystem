export interface Symptom {
  id?: number;
  date: string;
  description: string;
  intensity: number;
  patientId: number;
  appointmentId?: number;
}