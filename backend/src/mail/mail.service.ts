import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService,
    private configService: ConfigService
  ) {}

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

  async sendAppointmentCompletion(
    to: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
  ) {
    await this.mailerService.sendMail({
      to,
      from: this.configService.get<string>('MAIL_USER'),
      subject: 'Fin de votre consultation',
      template: 'appointment-completion', // Fichier dans templates/appointment-completion.hbs
      context: {
        patientName: patientName || 'Patient',
        doctorName: doctorName || 'Médecin',
        date,
        time,
      },
    });
  }
}