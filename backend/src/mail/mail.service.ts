/*import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendCandidatureStatusEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    status: 'accepted' | 'rejected',
  ) {
    const subject =
      status === 'accepted'
        ? 'Convocation à un entretien'
        : 'Mise à jour de votre candidature';
    
    await this.mailerService.sendMail({
      to,
      subject,
      template: status === 'accepted' ? 'interview' : 'rejection',
      context: {
        candidateName: candidateName || 'Candidat',
        jobTitle,
      },
    });
  }
}*/