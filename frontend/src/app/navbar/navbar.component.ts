import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService, Notification } from '../services/user-service';
import { User } from '../models/user';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  notifications: Notification[] = [];
  showNotifications = false;

  private userSubscription: Subscription = new Subscription();
  private notificationsSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userSubscription = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user
        ? {
            ...user,
            photo: user.photo
              ? `${environment.apiUrl}/Uploads/photos/${user.photo.split('/').pop()}`
              : null,
          }
        : null;

      if (this.currentUser && (this.currentUser.role === 'MEDECIN' || this.currentUser.role === 'SECRETAIRE')) {
        this.loadNotifications();
      } else {
        this.notifications = [];
      }

      this.cdr.detectChanges();
    });

    this.notificationsSubscription = this.userService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.cdr.detectChanges();
    });

    if (this.authService.isLoggedIn()) {
      this.userService.getProfile().subscribe();
    }
  }

  loadNotifications() {
    if (this.currentUser?.id) {
      this.userService.getNotifications(this.currentUser.id).subscribe();
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.cdr.detectChanges();
  }

  markAsRead(notificationId: number, event: MouseEvent) {
    event.stopPropagation();
    this.userService.markNotificationAsRead(notificationId).subscribe();
  }

  deleteNotification(notificationId: number, event: MouseEvent) {
  event.stopPropagation();

  this.userService.deleteNotification(notificationId).subscribe({
    next: () => {
      // La suppression côté client est déjà faite dans le service
    },
    error: (error) => console.error('Erreur lors de la suppression :', error),
  });
}

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.notificationsSubscription.unsubscribe();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isPatient(): boolean {
    return this.currentUser?.role === 'PATIENT';
  }

  isDoctorOrSecretary(): boolean {
    return this.currentUser?.role === 'MEDECIN' || this.currentUser?.role === 'SECRETAIRE';
  }

  logout(): void {
    this.authService.logout();
    this.userService.setCurrentUser(null);
    this.cdr.detectChanges();
  }

  getPhotoUrl(photoPath: string | null): string {
    if (!photoPath) return 'assets/images/default-profile.png';
    return `${environment.apiUrl}/Uploads/photos/${photoPath.split('/').pop()}`;
  }
}
