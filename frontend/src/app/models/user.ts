export enum Role {
  ADMIN = 'ADMIN',
  MEDECIN = 'MEDECIN',
  PATIENT = 'PATIENT',
  SECRETAIRE = 'SECRETAIRE',
}

export interface User {
  id: number;
  email: string;
  password?: string;
  photo: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  speciality?: string;
  role: 'ADMIN' | 'MEDECIN' | 'PATIENT' | 'SECRETAIRE';
  medecinId?: number;
  created_at: Date;
  updated_at: Date;
}