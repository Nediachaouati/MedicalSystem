import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { TimeSlot } from 'src/availability/entities/time-slot.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(TimeSlot)
  private timeSlotRepository: Repository<TimeSlot>,
    private usersService: UsersService,
    private mailService: MailService
  ) {}


async bookBySlot(timeSlotId: number, patientId: number) {
  return await this.appointmentRepository.manager.transaction(async (manager) => {
    // 1. Verrouillage du créneau
    const slot = await manager.findOne(TimeSlot, {
      where: { id: timeSlotId, status: 'disponible' },
      relations: ['availability', 'availability.medecin', 'availability.medecin.secretaries'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!slot) {
      throw new BadRequestException('Ce créneau n\'est plus disponible ou n\'existe pas');
    }

    // 2. Charger patient + médecin
    const patient = await manager.findOne(User, {
      where: { id: patientId },
      select: ['id', 'name', 'email'],
    });

    const doctor = await manager.findOne(User, {
      where: { id: slot.medecinId },
      select: ['id', 'name'],
      relations: ['secretaries'],
    });

    if (!patient || !doctor) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    if (!doctor.secretaries || doctor.secretaries.length === 0) {
      throw new BadRequestException('Ce médecin n\'a pas de secrétaire assignée');
    }

    const secretaryId = doctor.secretaries[0].id;

    // 3. Créer le rendez-vous
    const appointment = new Appointment();
    appointment.patientId = patientId;
    appointment.medecinId = slot.medecinId;
    appointment.date = slot.date;
    appointment.time = slot.startTime;
    appointment.appointmentStatus = 'en_attente';
    appointment.patientName = patient.name || patient.email.split('@')[0];
    appointment.doctorName = doctor.name ? `Dr. ${doctor.name}` : 'Médecin';
    appointment.secretaryId = secretaryId;
    appointment.timeSlotId = slot.id;

    const savedAppointment = await manager.save(Appointment, appointment);

    // 4. METTRE À JOUR LE TIME SLOT AVEC LES INFOS DU RDV
    slot.status = 'occupé';
    slot.patientId = patientId;
    slot.appointmentId = savedAppointment.id;

    await manager.save(TimeSlot, slot);

    return {
      message: 'Rendez-vous pris avec succès !',
      appointment: savedAppointment,
      slot: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        patientId: slot.patientId,
        appointmentId: slot.appointmentId,
      }
    };
  });
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

//rating 
async addReview(appointmentId: number, patientId: number, rating: number, review?: string) {
  const appointment = await this.appointmentRepository.findOne({
    where: { id: appointmentId, patientId },
  });

  if (!appointment) throw new NotFoundException('Rendez-vous non trouvé');
  if (appointment.consultationStatus !== 'terminée') {
    throw new BadRequestException('Vous ne pouvez noter que les consultations terminées');
  }
  if (appointment.rating !== null) {
    throw new BadRequestException('Vous avez déjà donné votre avis');
  }
  if (rating < 1 || rating > 5) {
    throw new BadRequestException('La note doit être entre 1 et 5');
  }

  appointment.rating = rating;
  appointment.review = review?.trim() || undefined;

  return await this.appointmentRepository.save(appointment);
}

async getReviewsByDoctor(doctorId: number) {
  return this.appointmentRepository.find({
    where: {
      medecinId: doctorId,
      consultationStatus: 'terminée',
      rating: Not(IsNull()), 
    },
    select: {
      id: true,
      date: true,
      time: true,
      patientName: true,
      rating: true,
      review: true,
    },
    order: { date: 'DESC' },
  });
}
}