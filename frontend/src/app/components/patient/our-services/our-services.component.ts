import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-our-services',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent,SidebarComponent],
  templateUrl: './our-services.component.html',
  styleUrls: ['./our-services.component.css'],
})
export class OurServicesComponent implements OnInit {
  prompt: string = '';
  sessionId: string | null = null;
  messages: ChatMessage[] = [];
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Initialiser le chatbot avec un message de bienvenue
    this.messages.push({
      text: 'Bienvenue ! Décrivez vos symptômes ou posez une question sur votre suivi médical, et je vous aiderai à trouver un médecin adapté.',
      isUser: false,
    });
  }

  sendMessage() {
    if (!this.prompt.trim()) {
      this.errorMessage = 'Veuillez entrer un message.';
      return;
    }

    // Ajouter le message de l'utilisateur à l'historique
    this.messages.push({ text: this.prompt, isUser: true });
    const currentPrompt = this.prompt;
    this.prompt = ''; // Réinitialiser le champ de saisie

    // Préparer les en-têtes avec le token JWT
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    });

    // Envoyer la requête au backend
    const body = { prompt: currentPrompt, sessionId: this.sessionId };
    this.http.post<{ result: string; sessionId: string }>(`${environment.apiUrl}/chat`, body, { headers }).subscribe({
      next: (response) => {
        // Ajouter la réponse du chatbot à l'historique
        this.messages.push({ text: response.result, isUser: false });
        this.sessionId = response.sessionId; // Mettre à jour l'ID de session
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Erreur lors de l’envoi du message au chatbot:', error);
        this.errorMessage = 'Erreur lors de la communication avec le chatbot. Veuillez réessayer.';
      },
    });
  }
}