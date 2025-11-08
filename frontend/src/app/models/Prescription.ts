export interface Prescription {
  id?: number;                    // optionnel (pas envoyé dans POST)
  appointmentId: number;
  medication: string;
  dosage: string;
  duration: string;
  additionalNotes?: string;
  createdAt?: Date;               // optionnel (généré par le backend)
}