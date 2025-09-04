import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  patientName?: string;
  doctorName?: string;
  date?: string;
  time?: string;
}
