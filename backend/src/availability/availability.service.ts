import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../role.enum';

@Injectable()
export class AvailabilityService {
  private readonly SLOT_DURATION = 20;

  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,
    @InjectRepository(TimeSlot)
    private timeSlotRepo: Repository<TimeSlot>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // LA FONCTION QUE TU VEUX : celle qui marche dans ton autre projet
  async create(dto: { date: string; startTime: string; endTime: string }, secretaireId: number) {
    // Récupérer la secrétaire et SON médecin
    const secretaire = await this.userRepo.findOne({
      where: { id: secretaireId, role: Role.SECRETAIRE },
      relations: ['medecin'],
    });

    if (!secretaire?.medecin) {
      throw new ForbiddenException('Vous n\'êtes pas rattaché(e) à un médecin');
    }

    const medecinId = secretaire.medecin.id;

    // Vérifier si déjà une dispo ce jour
    const existing = await this.availabilityRepo.findOne({
      where: { medecinId, date: dto.date },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà une plage horaire pour cette date.');
    }

    // Créer la disponibilité
    const availability = this.availabilityRepo.create({
      medecinId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const saved = await this.availabilityRepo.save(availability);
    await this.generateTimeSlots(saved);

    return saved;
  }

  /** Génère les créneaux de 20 min (celle que tu aimes) */

private async generateTimeSlots(availability: Availability) {
  // PROTECTION ABSOLUE
  if (!availability.startTime || !availability.endTime) {
    throw new BadRequestException('Heures de début et fin requises');
  }

  const start = this.timeToMinutes(availability.startTime.trim());
  const end = this.timeToMinutes(availability.endTime.trim());

  if (isNaN(start) || isNaN(end)) {
    throw new BadRequestException('Format d\'heure invalide (utilisez HH:MM)');
  }

  if (end <= start) {
    throw new BadRequestException('L\'heure de fin doit être après l\'heure de début');
  }

  if ((end - start) % this.SLOT_DURATION !== 0) {
    throw new BadRequestException(`La durée doit être un multiple de ${this.SLOT_DURATION} minutes`);
  }

  // Supprimer les anciens créneaux
  await this.timeSlotRepo.delete({ availabilityId: availability.id });

  // Générer les nouveaux
  for (let time = start; time < end; time += this.SLOT_DURATION) {
    const startTime = this.minutesToTime(time);
    const endTime = this.minutesToTime(time + this.SLOT_DURATION);

    const slot = this.timeSlotRepo.create({
      availabilityId: availability.id,
      medecinId: availability.medecinId,
      date: availability.date,
      startTime,
      endTime,
      status: 'disponible',
    });

    await this.timeSlotRepo.save(slot);
  }
}

  /** Convertit "09:30" → 570 minutes */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /** Convertit 570 minutes → "09:30" */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // --- Autres méthodes nécessaires ---

  async findAll(secretaireId: number) {
    const secretaire = await this.userRepo.findOne({
      where: { id: secretaireId },
      relations: ['medecin'],
    });
    if (!secretaire?.medecin) throw new NotFoundException('Médecin non trouvé');

    return this.availabilityRepo.find({
      where: { medecinId: secretaire.medecin.id },
      order: { date: 'ASC' },
    });
  }

  async getTimeSlotsByDate(medecinId: string, date: string): Promise<any[]> {
    const normalizedDate = date.substring(0, 10);

    const slots = await this.timeSlotRepo
      .createQueryBuilder('slot')
      .where('slot.medecinId = :medecinId', { medecinId: Number(medecinId) })
      .andWhere('slot.date = :date', { date: normalizedDate })
      .leftJoinAndSelect('slot.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    return slots.map(slot => {
      if (slot.appointment && slot.appointment.appointmentStatus === 'annulé') {
        return { ...slot, status: 'disponible', patient: null, appointment: null };
      }
      if (slot.appointment) {
        return {
          ...slot,
          status: 'occupé',
          patient: slot.appointment.patient,
          appointment: { id: slot.appointment.id },
        };
      }
      return { ...slot, status: 'disponible', patient: null, appointment: null };
    });
  }


  async update(id: number, dto: { date: string; startTime: string; endTime: string }, secretaireId: number) {
  const availability = await this.availabilityRepo.findOne({
    where: { id },
  });

  if (!availability) throw new NotFoundException('Disponibilité non trouvée');

  // Vérif secrétaire → médecin
  const secretaire = await this.userRepo.findOne({
    where: { id: secretaireId, role: Role.SECRETAIRE },
    relations: ['medecin'],
  });

  if (!secretaire?.medecin || secretaire.medecin.id !== availability.medecinId) {
    throw new ForbiddenException('Accès refusé');
  }

  // Conflit de date ?
  if (dto.date !== availability.date) {
    const conflict = await this.availabilityRepo.findOne({
      where: { medecinId: availability.medecinId, date: dto.date },
    });
    if (conflict && conflict.id !== id) {
      throw new BadRequestException('Une disponibilité existe déjà pour cette date');
    }
  }

  // Mise à jour
  availability.date = dto.date;
  availability.startTime = dto.startTime.trim();
  availability.endTime = dto.endTime.trim();

  const updated = await this.availabilityRepo.save(availability);

  // Régénère les créneaux (avec toutes les protections)
  await this.generateTimeSlots(updated);

  return updated;
}

async getSlotsByDoctorAndDate(medecinId: number, date: string): Promise<TimeSlot[]> {
  return this.timeSlotRepo.find({
    where: {
      medecinId,
      date,
      status: 'disponible'  // UNIQUEMENT LES DISPONIBLES
    },
    order: { startTime: 'ASC' },
  });
}

async findByDoctor(medecinId: number) {
  return this.availabilityRepo.find({
    where: { medecinId },
    order: { date: 'ASC', startTime: 'ASC' }
  });
}

  async remove(id: number, secretaireId: number) {
    const availability = await this.availabilityRepo.findOne({
      where: { id },
      relations: ['medecin'],
    });
    if (!availability) throw new NotFoundException('Non trouvée');

    const secretaire = await this.userRepo.findOne({
      where: { id: secretaireId },
      relations: ['medecin'],
    });

    if (secretaire?.medecin?.id !== availability.medecinId) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.timeSlotRepo.delete({ availabilityId: id });
    await this.availabilityRepo.softDelete(id);

    return { message: 'Supprimée avec succès' };
  }
}