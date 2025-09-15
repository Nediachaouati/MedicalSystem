import { IsString, IsInt, IsOptional, MinLength } from 'class-validator';

export class UpdatePrescriptionDto {
  @IsInt()
  appointmentId: number;

  @IsString()
  @MinLength(1)
  medication: string;

  @IsString()
  @MinLength(1)
  dosage: string;

  @IsString()
  @MinLength(1)
  duration: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;
}