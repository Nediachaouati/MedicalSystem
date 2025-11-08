import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsInt()
  @IsNotEmpty()
  appointmentId: number;

  @IsString()
  @IsNotEmpty()
  medication: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  
}