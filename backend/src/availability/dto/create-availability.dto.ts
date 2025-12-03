import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  date: string; // "2025-11-20"

  @IsString()
  @IsNotEmpty()
  startTime: string; // "08:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "17:00"
}