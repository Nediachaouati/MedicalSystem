import { Injectable, Logger } from "@nestjs/common";
import { ChatSession, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { GetAiMessageDTO } from './dto/get-ai-response.dto';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../role.enum';

const GEMINI_MODEL = 'gemini-1.5-flash';

@Injectable()
export class ChatService {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private chatSessions: { [sessionId: string]: ChatSession } = {};
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const geminiApiKey = configService.get('GEMINI_API_KEY');
    this.googleAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.googleAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });
  }

  private getChatSession(sessionId?: string) {
    let sessionIdToUse = sessionId ?? v4();
    let result = this.chatSessions[sessionIdToUse];

    if (!result) {
      result = this.model.startChat();
      this.chatSessions[sessionIdToUse] = result;
    }

    return {
      sessionId: sessionIdToUse,
      chat: result,
    };
  }

  // Construire le contexte avec les médecins disponibles et des informations sur le suivi médical
  private async buildContext(): Promise<string> {
    // Récupérer les médecins actifs dans la base de données
    const doctors = await this.userRepository.find({ where: { role: Role.MEDECIN } });
    const doctorsText = doctors
      .map(
        (doctor) => `
          Nom: ${doctor.name || 'Non spécifié'}
          Spécialité: ${doctor.speciality || 'Généraliste'}
          Email: ${doctor.email || 'Non spécifié'}
          Téléphone: ${doctor.phoneNumber || 'Non spécifié'}
          Adresse: ${doctor.address || 'Non spécifié'}
          
        `,
      )
      .join('\n---\n');

    // Informations statiques sur le service de suivi médical
    const medicalServiceInfo = `
      Nom du service : DIGI-Santé
      Mission : Aider les patients à trouver le médecin adapté à leurs symptômes et à organiser un suivi médical personnalisé.
      Localisation : Ariana Technopole Ghazela Bloc B1, Tunisie.
      Valeurs : Soins de qualité, accessibilité, empathie.
      Services : Consultation avec des médecins spécialisés, recommandations basées sur les symptômes, prise de rendez-vous.
    `;

    return `
      Tu es un chatbot conçu pour aider les patients à trouver un médecin adapté à leurs symptômes ou à obtenir des recommandations pour un suivi médical.
      Voici les informations dont tu disposes :

      ### Médecins disponibles :
      ${doctorsText || "Aucun médecin disponible pour le moment."}

      ### Informations sur le service de suivi médical :
      ${medicalServiceInfo}

      Instructions :
      - Réponds uniquement en fonction de ces données et des symptômes fournis par le patient.
      - Si le patient décrit des symptômes, suggère le type de médecin ou de spécialité le plus adapté (par exemple, "Pour des douleurs abdominales, un gastro-entérologue est recommandé").
      - Si le patient demande des informations sur un médecin spécifique, utilise son **nom** ou sa **spécialité** pour répondre précisément.
      - Si le patient veut simplifier la recherche, pose-lui des questions comme "Quels symptômes ressentez-vous ?" ou "Préférez-vous un médecin près de chez vous ?" pour filtrer les médecins.
      - Si une question est hors contexte, dis simplement : "Je ne peux répondre qu’aux questions sur les médecins ou le suivi médical."
    `;
  }

  async generateText(data: GetAiMessageDTO) {
    try {
      const { sessionId, chat } = this.getChatSession(data.sessionId);

      // Ajouter le contexte au prompt
      const context = await this.buildContext();
      const fullPrompt = `${context}\n\nQuestion ou symptômes du patient : ${data.prompt}`;

      const result = await chat.sendMessage(fullPrompt);

      return {
        result: await result.response.text(),
        sessionId,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l’envoi du message à l’API Gemini >>', error);
      throw error;
    }
  }
}