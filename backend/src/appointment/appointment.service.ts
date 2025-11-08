import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private usersService: UsersService,
    private mailService: MailService
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.usersService.findOneById(createAppointmentDto.patientId);
    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${createAppointmentDto.patientId} non trouvé`);
    }
    const doctor = await this.usersService.findOneById(createAppointmentDto.medecinId);
    if (!doctor) {
      throw new NotFoundException(`Médecin avec l'ID ${createAppointmentDto.medecinId} non trouvé`);
    }
    const secretaries = await this.usersService.findSecretariesByMedecin(createAppointmentDto.medecinId);
    const secretary = secretaries.length > 0 ? secretaries[0] : null;
    const appointmentData = {
      ...createAppointmentDto,
      patientName: patient.name || 'Patient inconnu',
      doctorName: doctor.name || 'Médecin inconnu',
      secretaryId: secretary ? secretary.id : undefined,
    };
    const appointment = this.appointmentRepository.create(appointmentData);
    return this.appointmentRepository.save(appointment);
  }


  async findOne(id: number): Promise<Appointment> {
  const appointment = await this.appointmentRepository.findOne({
    where: { id },
    relations: ['patient', 'medecin'],
  });
  if (!appointment) {
    throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
  }
  return appointment;
}


  async findByDoctor(medecinId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { medecinId },
      relations: ['patient', 'medecin', 'symptoms', 'prescriptions'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async findByPatient(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['patient', 'medecin', 'secretary', 'symptoms', 'prescriptions'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async updateAppointmentStatus(id: number, appointmentStatus: 'en_attente' | 'approuvé' | 'annulé'): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'medecin'],
    });
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
    }
    appointment.appointmentStatus = appointmentStatus;
    if (appointmentStatus === 'approuvé') {
      appointment.consultationStatus = 'en_cours';
    } else if (appointmentStatus === 'annulé') {
      appointment.consultationStatus = null;
    }
    const savedAppointment = await this.appointmentRepository.save(appointment);
    if (appointmentStatus === 'approuvé') {
      try {
        await this.mailService.sendAppointmentConfirmation(
          appointment.patient.email,
          appointment.patientName || 'Patient',
          appointment.doctorName || 'Médecin',
          appointment.date,
          appointment.time,
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      }
    }
    return savedAppointment;
  }

  async updateConsultationStatus(id: number, consultationStatus: 'en_cours' | 'terminée'): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'medecin'],
    });
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
    }
    if (appointment.appointmentStatus !== 'approuvé') {
      throw new ForbiddenException('Le rendez-vous doit être approuvé pour modifier le statut de consultation');
    }
    appointment.consultationStatus = consultationStatus;
    const savedAppointment = await this.appointmentRepository.save(appointment);
    if (consultationStatus === 'terminée') {
      try {
        await this.mailService.sendAppointmentCompletion(
          appointment.patient.email,
          appointment.patientName || 'Patient',
          appointment.doctorName || 'Médecin',
          appointment.date,
          appointment.time,
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      }
    }
    return savedAppointment;
  }


  async getMonthlyCountLast6Months() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const result = await this.appointmentRepository
      .createQueryBuilder('a')
      .select("TO_CHAR(a.date, 'Mon')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('a.date >= :start', { start: sixMonthsAgo })
      .groupBy("TO_CHAR(a.date, 'Mon'), TO_CHAR(a.date, 'MM')")
      .orderBy("TO_CHAR(a.date, 'MM')")
      .getRawMany();

    return result.map(r => ({
      month: r.month,
      count: parseInt(r.count, 10)
    }));
  }



  async getStatsForSecretary(secretaryId: number): Promise<{
  patientsCount: number;
  approvedAppointments: number;
  canceledAppointments: number;
  monthlyAppointments: { month: string; count: number }[];
}> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  // 1. Patients distincts
  const patientsCount = await this.appointmentRepository
    .createQueryBuilder('a')
    .select('COUNT(DISTINCT a.patientId)', 'count')
    .where('a.secretaryId = :secretaryId', { secretaryId })
    .getRawOne();

  // 2. Approuvés
  const approvedAppointments = await this.appointmentRepository.count({
    where: { secretaryId, appointmentStatus: 'approuvé' }
  });

  // 3. Annulés
  const canceledAppointments = await this.appointmentRepository.count({
    where: { secretaryId, appointmentStatus: 'annulé' }
  });

  // 4. Courbe mensuelle → MySQL
  const monthlyAppointments = await this.appointmentRepository
    .createQueryBuilder('a')
    .select("DATE_FORMAT(a.date, '%b')", 'month')           // %b = Jun, Jul
    .addSelect('COUNT(*)', 'count')
    .where('a.secretaryId = :secretaryId', { secretaryId })
    .andWhere('a.date >= :start', { start: sixMonthsAgo })
    .groupBy("DATE_FORMAT(a.date, '%b'), MONTH(a.date)")     // %b + MONTH
    .orderBy('MONTH(a.date)')                               // 1 à 12
    .getRawMany();

  return {
    patientsCount: parseInt(patientsCount.count, 10),
    approvedAppointments,
    canceledAppointments,
    monthlyAppointments: monthlyAppointments.map(r => ({
      month: r.month,
      count: parseInt(r.count, 10)
    }))
  };
}



async getStatsForDoctor(doctorId: number): Promise<{
  patientsCount: number;
  approvedAppointments: number;
  completedConsultations: number;
  ongoingConsultations: number;
  monthlyAppointments: { month: string; count: number }[];
}> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  // 1. Patients distincts
  const patientsCount = await this.appointmentRepository
    .createQueryBuilder('a')
    .select('COUNT(DISTINCT a.patientId)', 'count')
    .where('a.medecinId = :doctorId', { doctorId })
    .getRawOne();

  // 2. RDV approuvés
  const approvedAppointments = await this.appointmentRepository.count({
    where: { medecinId: doctorId, appointmentStatus: 'approuvé' }
  });

  // 3. Consultations terminées
  const completedConsultations = await this.appointmentRepository.count({
    where: { medecinId: doctorId, consultationStatus: 'terminée' }
  });

  // 4. Consultations en cours
  const ongoingConsultations = await this.appointmentRepository.count({
    where: { medecinId: doctorId, consultationStatus: 'en_cours' }
  });

  // 5. Courbe mensuelle
  const monthlyAppointments = await this.appointmentRepository
    .createQueryBuilder('a')
    .select("DATE_FORMAT(a.date, '%b')", 'month')
    .addSelect('COUNT(*)', 'count')
    .where('a.medecinId = :doctorId', { doctorId })
    .andWhere('a.date >= :start', { start: sixMonthsAgo })
    .groupBy("DATE_FORMAT(a.date, '%b'), MONTH(a.date)")
    .orderBy('MONTH(a.date)')
    .getRawMany();

  return {
    // PROTÈGE ICI
    patientsCount: parseInt(patientsCount?.count || '0', 10),
    approvedAppointments,
    completedConsultations,
    ongoingConsultations,
    monthlyAppointments: monthlyAppointments.map(r => ({
      month: r.month,
      count: parseInt(r.count || '0', 10)
    }))
  };
}
}