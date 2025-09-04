import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { User } from '../models/user';

export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  recipient: User;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private notificationApiUrl = `${environment.apiUrl}/notifications`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token || ''}` });
  }

  
  getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?role=MEDECIN`, { headers: this.getAuthHeaders() });
  }

  addMedecin(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/add-medecin`, user, { headers: this.getAuthHeaders() });
  }

  addSecretaire(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/add-secretaire`, user, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getSecretariesByMedecin(medecinId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/secretaries/${medecinId}`, { headers: this.getAuthHeaders() });
  }

  getAllSecretaries(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/secretaries`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(formData: FormData): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, formData, { headers: this.getAuthHeaders() })
      .pipe(tap(user => this.currentUserSubject.next(user)));
  }

  getUsersByIds(ids: number[]): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/ids?ids=${ids.join(',')}`, { headers: this.getAuthHeaders() });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() })
      .pipe(tap(user => this.currentUserSubject.next(user)));
  }

  getNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<{ notifications: any[]; unreadCount: number }>(
      `${this.notificationApiUrl}/${userId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response =>
        response.notifications.map(n => ({
          id: n.id,
          message: n.message,
          isRead: n.read, // <-- transforme read en isRead
          recipient: n.recipient,
          createdAt: n.createdAt
        }))
      ),
      tap(notifs => this.notificationsSubject.next(notifs))
    );
  }


markNotificationAsRead(notificationId: number): Observable<void> {
  const userId = this.getCurrentUser()?.id;
  return this.http.post<void>(
    `${this.notificationApiUrl}/read/${notificationId}`,
    { userId }, // <-- ici
    { headers: this.getAuthHeaders() }
  ).pipe(
    tap(() => {
      const updated = this.notificationsSubject.value.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      this.notificationsSubject.next(updated);
    })
  );
}



  // Ajoute cette méthode dans UserService
updateUnreadCount() {
  const unread = this.notificationsSubject.value.filter(n => !n.isRead).length;
  // Mettre à jour le badge (ici notifications$ contient toutes les notifs)
  // Si tu veux un observable séparé pour le compteur, tu peux créer unreadCount$ BehaviorSubject
  return unread;
}


  deleteNotification(notificationId: number): Observable<void> {
  const userId = this.getCurrentUser()?.id;
  return this.http.delete<void>(`${this.notificationApiUrl}/${notificationId}/${userId}`, { headers: this.getAuthHeaders() })
    .pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updated);
      })
    );
}

  // Gestion du current user
  setCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }


 

}
