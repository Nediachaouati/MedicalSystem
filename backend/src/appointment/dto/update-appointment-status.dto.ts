import { IsString, IsIn } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsString()
  @IsIn(['confirmé', 'refusé'])
  status: 'confirmé' | 'refusé';
}