export interface Prescription {
  id: number;
  appointmentId: number;
  medication: string;
  dosage: string;
  duration: string;
  additionalNotes?: string;
  createdAt: Date;
}