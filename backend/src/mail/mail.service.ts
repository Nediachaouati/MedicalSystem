import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Confirmation de votre rendez-vous',
      template: 'appointment-confirmation', // Nom du fichier .hbs sans l'extension
      context: {
        patientName: patientName || 'Patient',
        doctorName: doctorName || 'Médecin',
        date,
        time,
      },
    });
  }
}