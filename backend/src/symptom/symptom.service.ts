import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Symptom } from './entities/symptom.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class SymptomService {
  constructor(
    @InjectRepository(Symptom)
    private symptomRepository: Repository<Symptom>,
    private usersService: UsersService,
  ) {}

  async create(createSymptomDto: CreateSymptomDto): Promise<Symptom> {
    const patient = await this.usersService.findOneById(createSymptomDto.patientId);
    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${createSymptomDto.patientId} non trouvé`);
    }
    const symptom = this.symptomRepository.create({
      ...createSymptomDto,
      patientId: patient.id,
      appointmentId: createSymptomDto.appointmentId,
    });
    return this.symptomRepository.save(symptom);
  }

  async findByPatient(patientId: number): Promise<Symptom[]> {
    return this.symptomRepository.find({
      where: { patientId },
      relations: ['patient', 'appointment'],
    });
  }

  async updateSymptomAppointmentId(symptomId: number, appointmentId: number): Promise<Symptom> {
    const symptom = await this.symptomRepository.findOne({ where: { id: symptomId } });
    if (!symptom) {
      throw new NotFoundException(`Symptôme avec l'ID ${symptomId} non trouvé`);
    }
    symptom.appointmentId = appointmentId;
    return this.symptomRepository.save(symptom);
  }
}