import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { AppointmentService } from '../appointment/appointment.service';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,
    private appointmentService: AppointmentService,
  ) {}

  async create(createPrescriptionDto: CreatePrescriptionDto): Promise<Prescription> {
    const appointment = await this.appointmentService.findOne(createPrescriptionDto.appointmentId);
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${createPrescriptionDto.appointmentId} non trouvé`);
    }
    if (appointment.consultationStatus !== 'terminée') {
      throw new NotFoundException('Le rendez-vous doit être terminé pour créer une ordonnance');
    }
    const prescription = this.prescriptionRepository.create(createPrescriptionDto);
    return this.prescriptionRepository.save(prescription);
  }

  async update(id: number, updatePrescriptionDto: UpdatePrescriptionDto): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({ where: { id } });
    if (!prescription) {
      throw new NotFoundException(`Ordonnance avec l'ID ${id} non trouvée`);
    }
    const appointment = await this.appointmentService.findOne(updatePrescriptionDto.appointmentId);
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${updatePrescriptionDto.appointmentId} non trouvé`);
    }
    if (appointment.consultationStatus !== 'terminée') {
      throw new NotFoundException('Le rendez-vous doit être terminé pour modifier une ordonnance');
    }
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionRepository.save(prescription);
  }

  async findByAppointment(appointmentId: number): Promise<Prescription[]> {
    return this.prescriptionRepository.find({
      where: { appointmentId },
      order: { createdAt: 'ASC' },
    });
  }

  async generatePrescriptionPdf(appointmentId: number, userId?: number, userRole?: string): Promise<Buffer> {
    const prescriptions = await this.findByAppointment(appointmentId);
    if (!prescriptions || prescriptions.length === 0) {
      throw new NotFoundException(`Aucune ordonnance trouvée pour le rendez-vous avec l'ID ${appointmentId}`);
    }
    const appointment = await this.appointmentService.findOne(appointmentId);
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${appointmentId} non trouvé`);
    }
    // Vérifier que le patient est autorisé à télécharger son ordonnance
    if (userRole === 'PATIENT' && appointment.patientId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à télécharger cette ordonnance');
    }

    const pdf = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    pdf.on('data', buffers.push.bind(buffers));
    pdf.on('end', () => {});

    // Police professionnelle
    pdf.font('Helvetica');

    // En-tête
    pdf.fontSize(20).text('Ordonnance Médicale', 50, 50, { align: 'center' });
    pdf.fontSize(12).text(`Dr. ${appointment.doctorName || 'Inconnu'}`, 400, 30, { align: 'right' });
    pdf.text('Cabinet Médical', 400, 50, { align: 'right' });
    pdf.text('123 Rue de la Santé, 75000 Paris', 400, 65, { align: 'right' });
    pdf.text('Tél: +33 1 23 45 67 89', 400, 80, { align: 'right' });

    // Ligne de séparation
    pdf.moveTo(50, 100).lineTo(550, 100).stroke();

    // Informations du patient
    pdf.fontSize(14).text('Patient:', 50, 120);
    pdf.fontSize(12).text(`Nom: ${appointment.patientName || 'Inconnu'}`, 50, 140);
    // Formater la date (supposons que date est une string au format 'YYYY-MM-DD')
    const dateParts = appointment.date.split('-');
    const formattedDate = `${parseInt(dateParts[2], 10)} ${getFrenchMonth(parseInt(dateParts[1], 10))} ${dateParts[0]}`;
    pdf.text(`Date du rendez-vous: ${formattedDate}`, 50, 160);
    pdf.text(`Heure: ${appointment.time}`, 50, 180);

    // Ligne de séparation
    pdf.moveTo(50, 200).lineTo(550, 200).stroke();

    // Prescriptions
    pdf.fontSize(14).text('Prescriptions:', 50, 220);
    let yPosition = 240;
    prescriptions.forEach((prescription, index) => {
      pdf.fontSize(12).text(`${index + 1}. ${prescription.medication}`, 50, yPosition);
      pdf.text(`   Dosage: ${prescription.dosage}`, 70, yPosition + 15);
      pdf.text(`   Durée: ${prescription.duration}`, 70, yPosition + 30);
      if (prescription.additionalNotes) {
        pdf.text(`   Notes: ${prescription.additionalNotes}`, 70, yPosition + 45);
        yPosition += 60;
      } else {
        yPosition += 45;
      }
    });

    // Pied de page
    pdf.moveTo(50, yPosition + 20).lineTo(550, yPosition + 20).stroke();
    pdf.fontSize(10).text('Signature du médecin: ___________________________', 50, yPosition + 40);
    pdf.text('À usage médical uniquement', 50, yPosition + 60);
    pdf.text(`Émis le: ${new Date().toLocaleDateString('fr-FR')}`, 400, yPosition + 60, { align: 'right' });

    pdf.end();
    return new Promise((resolve) => {
      pdf.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}

// Fonction utilitaire pour obtenir le nom du mois en français
function getFrenchMonth(monthNumber: number): string {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return months[monthNumber - 1] || 'inconnu';
}