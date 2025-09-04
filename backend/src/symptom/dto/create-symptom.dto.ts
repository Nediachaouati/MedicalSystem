export class CreateSymptomDto {
  date: string;
  description: string;
  intensity: number;
  patientId: number;
  appointmentId?: number;
}